'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Rosary, RosaryProgress, RosaryStatus } from '@/lib/rosary/types';

export type SyncState = 'idle' | 'saving' | 'saved' | 'pending';

type Payload = RosaryProgress & { status: RosaryStatus };

const DEBOUNCE_MS = 800;

function storageKey(id: string) {
  return `rosary:progress:${id}`;
}

function readCache(id: string): Payload | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as Payload) : null;
  } catch {
    return null;
  }
}

/**
 * Holds the rosary's progress locally and pushes it to the server in the
 * background. Prayer is never blocked by the network: everything is kept in
 * localStorage and replayed when the connection comes back.
 */
export function useRosarySync(rosary: Rosary) {
  const [progress, setProgress] = useState<RosaryProgress>(rosary.progress);
  const [status, setStatus] = useState<RosaryStatus>(rosary.status);
  const [sync, setSync] = useState<SyncState>('idle');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const dirty = useRef(false);
  const latest = useRef<Payload>({ ...rosary.progress, status: rosary.status });

  // A cached copy that is further along than the server wins: it means the
  // last session ended offline.
  useEffect(() => {
    const cached = readCache(rosary.id);
    if (cached && cached.done.length > rosary.progress.done.length) {
      setProgress({ step: cached.step, done: cached.done, writings: cached.writings });
      setStatus(cached.status);
      latest.current = cached;
      dirty.current = true;
      void flush();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosary.id]);

  const flush = useCallback(async () => {
    if (inFlight.current || !dirty.current) return;
    inFlight.current = true;
    setSync('saving');

    const payload = latest.current;
    try {
      const response = await fetch(`/api/rosaries/${rosary.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok && response.status !== 409) throw new Error(String(response.status));
      dirty.current = latest.current !== payload;
      setSync(dirty.current ? 'pending' : 'saved');
    } catch {
      setSync('pending');
    } finally {
      inFlight.current = false;
    }
  }, [rosary.id]);

  const schedule = useCallback(
    (next: Payload, immediate = false) => {
      latest.current = next;
      dirty.current = true;
      try {
        localStorage.setItem(storageKey(rosary.id), JSON.stringify(next));
      } catch {
        // Private browsing or a full quota: the server copy is still the record.
      }
      if (timer.current) clearTimeout(timer.current);
      if (immediate) void flush();
      else timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush, rosary.id],
  );

  // Retry whenever the network or the tab comes back.
  useEffect(() => {
    const retry = () => {
      if (dirty.current) void flush();
    };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);
    const interval = setInterval(retry, 15_000);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', retry);
      clearInterval(interval);
    };
  }, [flush]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const done = useMemo(() => new Set(progress.done), [progress.done]);

  const update = useCallback(
    (patch: Partial<RosaryProgress>, options?: { immediate?: boolean; status?: RosaryStatus }) => {
      setProgress((current) => {
        const next: RosaryProgress = { ...current, ...patch };
        const nextStatus = options?.status ?? status;
        schedule({ ...next, status: nextStatus }, options?.immediate);
        return next;
      });
      if (options?.status) setStatus(options.status);
    },
    [schedule, status],
  );

  const finish = useCallback(async (): Promise<boolean> => {
    setStatus('completed');
    latest.current = { ...latest.current, status: 'completed' };
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);

    setSync('saving');
    try {
      const response = await fetch(`/api/rosaries/${rosary.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(latest.current),
      });
      if (!response.ok) throw new Error(String(response.status));
      dirty.current = false;
      setSync('saved');
      try {
        localStorage.removeItem(storageKey(rosary.id));
      } catch {
        /* nothing to clean up */
      }
      return true;
    } catch {
      setSync('pending');
      return false;
    }
  }, [rosary.id]);

  return { progress, done, status, sync, update, finish };
}
