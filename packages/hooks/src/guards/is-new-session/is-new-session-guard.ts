/**
 * PURPOSE: Determines if a session is new based on transcript file size
 *
 * USAGE:
 * const fileSize = 500; // bytes
 * const isNew = isNewSessionGuard({ fileSize });
 * // Returns true if file size is smaller than 1KB or undefined (file doesn't exist)
 */
const SMALL_FILE_SIZE_THRESHOLD = 1024; // 1KB threshold for new session detection

export const isNewSessionGuard = ({ fileSize }: { fileSize?: number }): boolean => {
  // No file size provided or 0 bytes = new session
  if (fileSize === undefined || fileSize === 0) {
    return true;
  }

  // If transcript is very small (< 1KB), likely a new session
  return fileSize < SMALL_FILE_SIZE_THRESHOLD;
};
