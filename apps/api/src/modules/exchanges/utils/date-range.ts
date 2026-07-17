export interface DateChunk {
  from: Date;
  to: Date;
}

/**
 * Splits [from, to] into consecutive chunks no wider than maxWindowMs — every
 * exchange's history endpoint caps how far apart startTime/endTime can be,
 * so a wide user-selected range has to be walked in pieces.
 */
export function chunkRange(from: Date, to: Date, maxWindowMs: number): DateChunk[] {
  const chunks: DateChunk[] = [];
  let chunkStart = from.getTime();
  const end = to.getTime();

  while (chunkStart < end) {
    const chunkEnd = Math.min(chunkStart + maxWindowMs, end);
    chunks.push({ from: new Date(chunkStart), to: new Date(chunkEnd) });
    chunkStart = chunkEnd;
  }

  return chunks;
}
