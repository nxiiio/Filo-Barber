import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";

interface RemoteState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

export function useRemote<T>(load: (() => Promise<T>) | null, deps: unknown[]): RemoteState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(load !== null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!load) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason : new ApiError(0, "UNKNOWN", "Ocurrió un error inesperado"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...deps, version]);

  return { data, error, loading, reload };
}
