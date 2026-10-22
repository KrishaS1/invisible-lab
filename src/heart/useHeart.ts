import { useEffect, useState } from "react";
import { loadEcg } from "../data/loadRecords";
import { useCatalog } from "../data/useRecords";
import type { EcgRecord } from "../data/types";
import { peakIndices } from "../data/loadRecords";

export function useHeartSelection() {
  const catalog = useCatalog();
  const [id, setId] = useState<string | null>(null);
  const [record, setRecord] = useState<EcgRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!catalog.data || id) return;
    const suggested = catalog.data.ecg.find((item) => item.suggested) ?? catalog.data.ecg[0];
    if (suggested) setId(suggested.id);
  }, [catalog.data, id]);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setError(null);
    loadEcg(id)
      .then((value) => {
        if (live) setRecord(value);
      })
      .catch((err: Error) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [id]);

  return {
    catalog: catalog.data,
    catalogError: catalog.error,
    id,
    setId,
    record,
    error,
    peaks: record ? peakIndices(record) : [],
  };
}
