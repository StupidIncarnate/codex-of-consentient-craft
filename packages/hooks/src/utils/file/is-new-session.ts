import { stat } from 'fs/promises';
import { existsSync } from 'fs';

export const isNewSession = async ({ transcriptPath }: { transcriptPath: string }) => {
  try {
    if (!existsSync(transcriptPath)) {
      return true; // No transcript = new session
    }

    const stats = await stat(transcriptPath);
    const fileSize = stats.size;

    // If transcript is very small (< 1KB), likely a new session
    // You could also check content or timestamp
    return fileSize < 1024;
  } catch {
    return true; // Error reading = treat as new
  }
};
