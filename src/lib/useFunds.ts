"use client";

import { useEffect, useState } from "react";
import { Fund } from "./types";

let cache: Fund[] | null = null;
let inflight: Promise<Fund[]> | null = null;

function load(): Promise<Fund[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/data/funds.json")
      .then((r) => r.json())
      .then((data: Fund[]) => {
        cache = data;
        return data;
      });
  }
  return inflight;
}

export function useFunds(): { funds: Fund[]; loading: boolean } {
  const [funds, setFunds] = useState<Fund[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    load().then((data) => {
      if (active) {
        setFunds(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { funds, loading };
}
