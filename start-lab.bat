@echo off
setlocal
cd /d "%~dp0"

rem Prefer the Node folder shipped in this project. Fall back to Node on PATH.
set "NODEDIR="
for /d %%D in (".tools\node-v*") do (
  if exist "%%~fD\npm.cmd" set "NODEDIR=%%~fD"
)
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"

where npm >nul 2>&1
if errorlevel 1 (
  echo Could not find npm.
  echo Install Node.js 22 or newer, then run npm install in this folder.
  echo See docs\install.md.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo node_modules is missing. Run npm install in this folder first.
  pause
  exit /b 1
)

echo Starting Invisible Lab.
echo Leave this window open. Press Ctrl+C to stop.
echo.
call npm run dev
echo.
echo The server stopped.
pause
