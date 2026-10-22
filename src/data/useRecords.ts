import { useEffect, useState } from "react";
import { loadCatalog, loadEcg, loadEeg } from "./loadRecords";
import type { Catalog, EcgRecord, EegRecord } from "./types";

function useAsync<T>(urlKey: string, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    load()
      .then((value) => {
        if (live) setData(value);
      })
      .catch((err: Error) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [urlKey]);
  return { data, error };
}

export function useEeg(id: string) {
  const state = useAsync<EegRecord>(id, () => loadEeg(id));
  return { record: state.data, error: state.error };
}

export function useEcg(id: string | null) {
  return useAsync<EcgRecord | null>(id ?? "none", () => (id ? loadEcg(id) : Promise.resolve(null)));
}

export function useCatalog() {
  return useAsync<Catalog>("catalog", loadCatalog);
}
