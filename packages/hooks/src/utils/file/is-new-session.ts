import { fsStat } from '../../adapters/fs/fs-stat';
import { fsExistsSync } from '../../adapters/fs/fs-exists-sync';
import { filePathContract } from '../../contracts/file-path/file-path-contract';

const SMALL_FILE_SIZE_THRESHOLD = 1024; // 1KB threshold for new session detection

export const isNewSession = async ({
  transcriptPath,
}: {
  transcriptPath: string;
}): Promise<boolean> => {
  try {
    const parsedPath = filePathContract.parse(transcriptPath);
    if (!fsExistsSync({ filePath: parsedPath })) {
      return true; // No transcript = new session
    }

    const stats = await fsStat({ filePath: parsedPath });
    const fileSize = stats.size;

    // If transcript is very small (< 1KB), likely a new session
    // You could also check content or timestamp
    return fileSize < SMALL_FILE_SIZE_THRESHOLD;
  } catch {
    return true; // Error reading = treat as new
  }
};
