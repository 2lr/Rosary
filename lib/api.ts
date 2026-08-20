import { NextResponse } from 'next/server';
import { Unauthorized } from '@/lib/auth/guard';

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(code: string, status = 400): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

/** Wraps a route handler so thrown auth errors and crashes become clean JSON. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Unauthorized) return fail('unauthorized', 401);
    console.error('[api]', error);
    return fail('server_error', 500);
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
