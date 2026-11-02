"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fn = useCallback(
    async (...args) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await cb(...args);
        if (requestId === requestIdRef.current) {
          setData(response);
        }
        return response;
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err);
          toast.error(err?.message || "Something went wrong.");
        }
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [cb]
  );

  return { data, loading, error, fn, setData };
};

export default useFetch;