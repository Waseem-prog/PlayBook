import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

// Loads data from an API call and re-runs when `deps` change.
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

// Wraps a mutating API call: shows a toast on success/failure and tracks busy state.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, successMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      if (successMessage) toast.success(successMessage);
      return { ok: true, result };
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      return { ok: false, error: err };
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
