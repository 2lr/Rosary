import 'server-only';
import { currentUserId } from './session';
import { findUserById, type User } from '@/lib/db/users';

/** The signed-in user, or null. Never throws on a missing/invalid cookie. */
export async function getCurrentUser(): Promise<User | null> {
  const id = await currentUserId();
  if (!id) return null;
  return findUserById(id);
}

export class Unauthorized extends Error {
  constructor() {
    super('Unauthorized');
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Unauthorized();
  return user;
}
