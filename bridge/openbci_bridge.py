"""Local bridge from an OpenBCI Cyton board to Invisible Lab.

Binds to 127.0.0.1 only. The board stays closed until the browser sends
"connect". This file has not been run with a headset attached.

    python bridge/openbci_bridge.py
    python bridge/openbci_bridge.py --self-test
"""

from __future__ import annotations

import argparse
import asyncio
import json
from typing import Any

HOST = "127.0.0.1"
DEFAULT_PORT = 8765

try:
    import websockets
except ImportError:  # pragma: no cover - checked at startup
    websockets = None

try:
    from brainflow.board_shim import BoardIds, BoardShim, BrainFlowInputParams
    from serial.tools import list_ports

    BRAINFLOW = True
except ImportError:
    BoardIds = BoardShim = BrainFlowInputParams = None  # type: ignore
    list_ports = None
    BRAINFLOW = False


class Bridge:
    def __init__(self) -> None:
        self.board: Any = None
        self.streaming = False
        self.sfreq = 250

    def ports(self) -> list[str]:
        if list_ports is None:
            return []
        return [port.device for port in list_ports.comports()]

    def connect(self, port: str) -> None:
        if not BRAINFLOW:
            raise RuntimeError("BrainFlow is not installed in this Python environment.")
        if not port:
            raise RuntimeError("Choose a serial port first.")
        self.disconnect()
        params = BrainFlowInputParams()
        params.serial_port = port
        params.timeout = 15
        self.board = BoardShim(BoardIds.CYTON_BOARD.value, params)
        self.board.prepare_session()
        self.sfreq = int(BoardShim.get_sampling_rate(BoardIds.CYTON_BOARD.value))

    def start(self) -> None:
        if self.board is None:
            raise RuntimeError("Open the board before streaming.")
        if not self.streaming:
            self.board.start_stream(450000)
            self.streaming = True

    def stop(self) -> None:
        if self.board is not None and self.streaming:
            self.board.stop_stream()
        self.streaming = False

    def disconnect(self) -> None:
        self.stop()
        if self.board is not None:
            try:
                self.board.release_session()
            except Exception:
                pass
        self.board = None

    def read_chunk(self) -> list[list[float]]:
        if self.board is None or not self.streaming:
            return []
        data = self.board.get_board_data()
        eeg_rows = BoardShim.get_eeg_channels(BoardIds.CYTON_BOARD.value)
        # data shape is (rows, samples). Send up to 8 EEG channels as a list of samples.
        count = data.shape[1] if hasattr(data, "shape") else 0
        chunk: list[list[float]] = []
        for index in range(count):
            sample = []
            for row in eeg_rows[:8]:
                sample.append(round(float(data[row][index]), 3))
            chunk.append(sample)
        return chunk


async def handle(websocket: Any, bridge: Bridge) -> None:
    await websocket.send(json.dumps({
        "type": "hello",
        "brainflow": BRAINFLOW,
        "testedWithHardware": False,
    }))
    try:
        async for raw in websocket:
            message = json.loads(raw)
            op = message.get("op")
            try:
                if op == "ports":
                    await websocket.send(json.dumps({"type": "ports", "ports": bridge.ports()}))
                elif op == "connect":
                    bridge.connect(str(message.get("port", "")))
                    await websocket.send(json.dumps({
                        "type": "status",
                        "state": "connected",
                        "detail": f"Board session open at {bridge.sfreq} Hz. Streaming has not started.",
                    }))
                elif op == "start":
                    bridge.start()
                    await websocket.send(json.dumps({
                        "type": "status",
                        "state": "streaming",
                        "detail": "Streaming from the Cyton. These samples are live.",
                    }))
                elif op == "stop":
                    bridge.stop()
                    await websocket.send(json.dumps({"type": "status", "state": "connected", "detail": "Stream stopped. The board is still open."}))
                elif op == "disconnect":
                    bridge.disconnect()
                    await websocket.send(json.dumps({"type": "status", "state": "idle", "detail": "Board released."}))
                else:
                    await websocket.send(json.dumps({"type": "error", "message": f"Unknown request: {op}"}))
            except Exception as exc:
                await websocket.send(json.dumps({"type": "error", "message": str(exc)}))
    finally:
        bridge.stop()


async def pump(websocket: Any, bridge: Bridge) -> None:
    while True:
        await asyncio.sleep(0.25)
        if bridge.streaming:
            chunk = bridge.read_chunk()
            if chunk:
                await websocket.send(json.dumps({
                    "type": "samples",
                    "sfreq": bridge.sfreq,
                    "chunk": chunk,
                }))


async def session(websocket: Any) -> None:
    bridge = Bridge()
    incoming = asyncio.create_task(handle(websocket, bridge))
    outgoing = asyncio.create_task(pump(websocket, bridge))
    done, pending = await asyncio.wait({incoming, outgoing}, return_when=asyncio.FIRST_COMPLETED)
    for task in pending:
        task.cancel()
    bridge.disconnect()
    for task in done:
        exc = task.exception()
        if exc:
            raise exc


async def serve(port: int) -> None:
    if websockets is None:
        raise SystemExit("Install bridge/requirements.txt before starting the bridge.")
    async with websockets.serve(session, HOST, port):
        print(f"Bridge listening on ws://{HOST}:{port}")
        print("Hardware test status: not run with a Cyton on this machine.")
        await asyncio.Future()


async def self_test() -> None:
    if websockets is None:
        raise SystemExit("websockets is not installed.")
    port = 8766
    server = await websockets.serve(session, HOST, port)
    try:
        async with websockets.connect(f"ws://{HOST}:{port}") as socket:
            hello = json.loads(await socket.recv())
            assert hello["type"] == "hello"
            assert hello["testedWithHardware"] is False
            await socket.send(json.dumps({"op": "connect", "port": ""}))
            reply = json.loads(await socket.recv())
            assert reply["type"] == "error"
            # Ask for samples indirectly: start without a board must error, never emit samples.
            await socket.send(json.dumps({"op": "start"}))
            reply = json.loads(await socket.recv())
            assert reply["type"] == "error"
            assert reply.get("type") != "samples"
        print("self-test ok: bridge refused to invent samples")
    finally:
        server.close()
        await server.wait_closed()


def main() -> None:
    parser = argparse.ArgumentParser(description="Local OpenBCI bridge for Invisible Lab")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        asyncio.run(self_test())
    else:
        asyncio.run(serve(args.port))


if __name__ == "__main__":
    main()
