import type { EslintMessage } from '../../types/eslint-type';
import { ProcessUtil, type SpawnResult } from '../process/process-util';
import { eslintUtilParseOutput } from './eslint-util-parse-output';
import debug from 'debug';

const log = debug('questmaestro:eslint-utils');

const TIMEOUTS = {
  ESLINT: 30000, // 30 seconds
} as const;

export const eslintUtilLintContent = async ({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}) => {
  log('Processing file:', filePath);

  if (!content) {
    log('No content to lint');
    return { fixedContent: '', fixResults: [] };
  }

  // Run ESLint through stdin with --fix-dry-run
  const fixResult = await ProcessUtil.spawnPromise({
    command: 'npx',
    args: ['eslint', '--stdin', '--stdin-filename', filePath, '--fix-dry-run', '--format', 'json'],
    stdin: content,
    timeout: TIMEOUTS.ESLINT,
  }).catch((error): SpawnResult => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to spawn lint process: ${errorMessage}`);
    return { code: 1, stdout: '', stderr: errorMessage };
  });

  log('Lint fix exit code:', fixResult.code);
  log('Lint fix stdout:', fixResult.stdout);
  log('Lint fix stderr:', fixResult.stderr);

  // Check for crashes - ESLint typically crashes with exit code 2 and stderr output
  if (fixResult.code === 2 && fixResult.stderr.trim()) {
    console.error('Lint crashed during linting:');
    console.error(fixResult.stderr);
    throw new Error('ESLint crashed during linting');
  }

  // Check if file is lintable
  if (
    fixResult.stderr.includes('No files matching') ||
    fixResult.stderr.includes('Ignore pattern') ||
    (fixResult.code === 0 && !eslintUtilParseOutput({ output: fixResult.stdout }).length)
  ) {
    log('File is not lintable, skipping');
    return { fixedContent: content, fixResults: [] };
  }

  // Parse the results
  const fixResults = eslintUtilParseOutput({ output: fixResult.stdout });

  // Check for TypeScript project errors (happens with new files)
  if (fixResults.length > 0 && fixResults[0].messages) {
    const hasParserProjectError = fixResults[0].messages.some(
      (msg: EslintMessage) => msg.message && msg.message.includes('parserOptions.project'),
    );
    if (hasParserProjectError) {
      log('File not in TypeScript project yet, skipping');
      return { fixedContent: content, fixResults: [] };
    }
  }

  // Return the fixed content (if any)
  return {
    fixedContent: fixResults[0]?.output || content,
    fixResults: fixResults,
  };
};
