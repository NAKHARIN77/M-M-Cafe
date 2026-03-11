import type { Server as SocketIOServer } from 'socket.io';
import type { RealtimeEvents } from '@/lib/realtime/events';

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  return globalThis.__io ?? null;
}

export function emitGlobal<E extends keyof RealtimeEvents>(event: E, payload: RealtimeEvents[E]) {
  const io = getIO();
  if (!io) return;
  io.emit(event as string, payload);
}

export function emitToAdmins<E extends keyof RealtimeEvents>(
  event: E,
  payload: RealtimeEvents[E]
) {
  const io = getIO();
  if (!io) return;
  io.to('admins').emit(event as string, payload);
}

export function emitToUser<E extends keyof RealtimeEvents>(
  userId: string,
  event: E,
  payload: RealtimeEvents[E]
) {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit(event as string, payload);
}

