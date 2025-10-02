import type { EslintMessage, EslintResult } from '../../../types/eslint-type';
import {
  childProcessSpawnPromise,
  type SpawnResult,
} from '../../../adapters/child-process/child-process-spawn-promise';
import { eslintOutputParseTransformer } from '../../../transformers/eslint-output-parse/eslint-output-parse-transformer';
import { debugDebug } from '../../../adapters/debug/debug-debug';

const log = debugDebug({ namespace: 'questmaestro:eslint-utils' });

const ESLINT_TIMEOUT_MS = 30000; // 30 seconds
const ESLINT_CRASH_EXIT_CODE = 2;
const SPAWN_ERROR_EXIT_CODE = 1;
const SUCCESS_EXIT_CODE = 0;

interface LintContentResult {
  fixedContent: string;
  fixResults: EslintResult[];
}

const hasParserProjectError = (messages: EslintMessage[]): boolean =>
  messages.some((message) => message.message.includes('parserOptions.project'));

const isFileLintable = ({
  fixResult,
  parsedOutput,
}: {
  fixResult: SpawnResult;
  parsedOutput: EslintResult[];
}): boolean => {
  const hasNoFilesMatch = fixResult.stderr.includes('No files matching');
  const hasIgnorePattern = fixResult.stderr.includes('Ignore pattern');
  const hasNoOutput = fixResult.code === SUCCESS_EXIT_CODE && parsedOutput.length === 0;

  return !hasNoFilesMatch && !hasIgnorePattern && !hasNoOutput;
};

export const eslintLintContentBroker = async ({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}): Promise<LintContentResult> => {
  log('Processing file:', filePath);

  if (content.length === 0) {
    log('No content to lint');
    return { fixedContent: '', fixResults: [] };
  }

  // Run ESLint through stdin with --fix-dry-run
  const fixResult = await childProcessSpawnPromise({
    command: 'npx',
    args: ['eslint', '--stdin', '--stdin-filename', filePath, '--fix-dry-run', '--format', 'json'],
    stdin: content,
    timeout: ESLINT_TIMEOUT_MS,
  }).catch((unknownError: unknown): SpawnResult => {
    const errorMessage =
      unknownError instanceof Error ? unknownError.message : String(unknownError);
    process.stderr.write(`Failed to spawn lint process: ${errorMessage}\n`);
    return { code: SPAWN_ERROR_EXIT_CODE, stdout: '', stderr: errorMessage };
  });

  log('Lint fix exit code:', fixResult.code);
  log('Lint fix stdout:', fixResult.stdout);
  log('Lint fix stderr:', fixResult.stderr);

  // Check for crashes - ESLint typically crashes with exit code 2 and stderr output
  const stderrTrimmed = fixResult.stderr.trim();
  if (fixResult.code === ESLINT_CRASH_EXIT_CODE && stderrTrimmed.length > 0) {
    process.stderr.write('Lint crashed during linting:\n');
    process.stderr.write(`${fixResult.stderr}\n`);
    throw new Error('ESLint crashed during linting');
  }

  // Parse the results
  const fixResults = eslintOutputParseTransformer({ output: fixResult.stdout });

  // Check if file is lintable
  if (!isFileLintable({ fixResult, parsedOutput: fixResults })) {
    log('File is not lintable, skipping');
    return { fixedContent: content, fixResults: [] };
  }

  // Check for TypeScript project errors (happens with new files)
  const [firstResult] = fixResults;
  if (firstResult?.messages !== undefined) {
    if (hasParserProjectError(firstResult.messages)) {
      log('File not in TypeScript project yet, skipping');
      return { fixedContent: content, fixResults: [] };
    }
  }

  // Return the fixed content (if any)
  return {
    fixedContent: fixResults[0]?.output ?? content,
    fixResults,
  };
};
