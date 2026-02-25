import { DEFAULT_BUFFER_SIZE } from './constants.js';

export function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function allocBuffer(size, fallback = DEFAULT_BUFFER_SIZE) {
  const normalized = Number.isFinite(size) ? Math.floor(size) : fallback;
  return Buffer.alloc(Math.max(1, normalized));
}

export function readCString(buffer) {
  const end = buffer.indexOf(0);
  return buffer.toString('utf8', 0, end >= 0 ? end : undefined);
}
