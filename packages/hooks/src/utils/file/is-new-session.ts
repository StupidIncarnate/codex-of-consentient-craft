import { stat } from 'fs/promises';
import { existsSync } from 'fs';

const SMALL_FILE_SIZE_THRESHOLD = 1024; // 1KB threshold for new session detection

export const isNewSession = async ({
  transcriptPath,
}: {
  transcriptPath: string;
}): Promise<boolean> => {
  try {
    if (!existsSync(transcriptPath)) {
      return true; // No transcript = new session
    }

    const stats = await stat(transcriptPath);
    const fileSize = stats.size;

    // If transcript is very small (< 1KB), likely a new session
    // You could also check content or timestamp
    return fileSize < SMALL_FILE_SIZE_THRESHOLD;
  } catch {
    return true; // Error reading = treat as new
  }
};
