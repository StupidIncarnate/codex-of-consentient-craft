import { ProcessUtil } from '../process/process-util';

const TIMEOUTS = {
  TYPESCRIPT_CHECK: 30000, // 30 seconds
} as const;

export const runTypescriptCheck = async ({ filePath }: { filePath: string }) => {
  try {
    const result = await ProcessUtil.spawnPromise({
      command: 'npx',
      args: ['tsc', '--noEmit', filePath],
      timeout: TIMEOUTS.TYPESCRIPT_CHECK,
    });

    return {
      hasErrors: result.code !== 0,
      errors: result.stdout || result.stderr,
    };
  } catch (error) {
    return {
      hasErrors: true,
      errors: error instanceof Error ? error.message : String(error),
    };
  }
};
