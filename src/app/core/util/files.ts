/**
 * Pure file/blob helpers for KuboDrive. No Angular, no side effects — safe to
 * call from browser code after the user has selected a file.
 */

/**
 * Split a File or Blob into non-overlapping chunks of at most `chunkSize` bytes.
 * The last chunk may be smaller. Uses `Blob.slice`, so the original file is not
 * fully loaded into memory.
 *
 * @example sliceFile(new File(['hello'], 'x.txt'), 2) // 3 blobs of 2,2,1 bytes
 */
export function sliceFile(file: File, chunkSize: number): Blob[] {
  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  const chunks: Blob[] = [];
  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
  }
  return chunks;
}
