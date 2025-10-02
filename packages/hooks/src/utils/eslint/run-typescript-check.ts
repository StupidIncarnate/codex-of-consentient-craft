import { ProcessUtil } from '../process/process-util';

const TIMEOUTS = {
  TYPESCRIPT_CHECK: 30000, // 30 seconds
} as const;

interface TypescriptCheckResult {
  hasErrors: boolean;
  errors: string;
}

export const runTypescriptCheck = async ({
  filePath,
}: {
  filePath: string;
}): Promise<TypescriptCheckResult> => {
  try {
    const result = await ProcessUtil.spawnPromise({
      command: 'npx',
      args: ['tsc', '--noEmit', filePath],
      timeout: TIMEOUTS.TYPESCRIPT_CHECK,
    });

    return {
      hasErrors: result.code !== 0,
      errors: result.stdout === '' ? result.stderr : result.stdout,
    };
  } catch (error: unknown) {
    return {
      hasErrors: true,
      errors: error instanceof Error ? error.message : String(error),
    };
  }
};
