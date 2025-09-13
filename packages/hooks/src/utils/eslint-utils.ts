import type { EslintMessage, EslintResult } from '../types';
import { ProcessUtils, type SpawnResult } from './process-utils';
import debug from 'debug';

const log = debug('questmaestro:eslint-utils');

const TIMEOUTS = {
  ESLINT: 30000, // 30 seconds
  TYPESCRIPT_CHECK: 30000, // 30 seconds
} as const;

export const EslintUtils = {
  isEslintMessage: (obj: unknown): obj is EslintMessage => {
    if (!obj || typeof obj !== 'object') return false;
    const msg = obj as Record<string, unknown>;
    return (
      typeof msg.line === 'number' &&
      typeof msg.message === 'string' &&
      typeof msg.severity === 'number' &&
      (msg.ruleId === undefined || typeof msg.ruleId === 'string')
    );
  },

  isEslintResult: (obj: unknown): obj is EslintResult => {
    if (!obj || typeof obj !== 'object') return false;
    const result = obj as Record<string, unknown>;
    return (
      Array.isArray(result.messages) &&
      result.messages.every((msg: unknown) => EslintUtils.isEslintMessage(msg)) &&
      (result.output === undefined || typeof result.output === 'string')
    );
  },

  parseEslintOutput: ({ output }: { output: string }) => {
    try {
      // TODO: ARCHITECTURAL CONCERN - Bracket counting algorithm has limitations:
      // 1. Doesn't properly parse JSON string boundaries - treats brackets inside
      //    string values as array brackets (e.g. {"message": "Error [line 5]"})
      // 2. Works by luck because JSON.parse() validates candidates and fails gracefully
      // 3. Could be inefficient with deeply nested or malformed JSON
      // 4. More robust solution would be a proper JSON tokenizer/parser
      // Current implementation works well for ESLint output but consider refactoring
      // if used for general JSON parsing or performance becomes an issue.

      // Find potential JSON array starting positions
      let startIndex = 0;

      while (true) {
        const arrayStart = output.indexOf('[', startIndex);
        if (arrayStart === -1) break;

        // Try to find the matching closing bracket
        let bracketCount = 0;
        let endIndex = arrayStart;

        for (let i = arrayStart; i < output.length; i++) {
          if (output[i] === '[') bracketCount++;
          else if (output[i] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i;
              break;
            }
          }
        }

        if (bracketCount === 0) {
          // Found a complete array, try to parse it
          const candidate = output.substring(arrayStart, endIndex + 1);
          try {
            const parsed = JSON.parse(candidate) as unknown;
            if (Array.isArray(parsed)) {
              // Filter to keep only valid EslintResult items
              const validResults = parsed.filter((item: unknown) =>
                EslintUtils.isEslintResult(item),
              );

              // If we found any valid results, return them
              if (validResults.length > 0) {
                return validResults;
              }
            }
          } catch {
            // Continue searching if this candidate fails to parse
          }
        }

        startIndex = arrayStart + 1;
      }

      return [] as EslintResult[];
    } catch (e) {
      log('Failed to parse Lint output:', e);
      return [] as EslintResult[];
    }
  },

  lintContent: async ({ filePath, content }: { filePath: string; content: string }) => {
    log('Processing file:', filePath);

    if (!content) {
      log('No content to lint');
      return { fixedContent: '', fixResults: [] };
    }

    // Run ESLint through stdin with --fix-dry-run
    const fixResult = await ProcessUtils.spawnPromise({
      command: 'npx',
      args: [
        'eslint',
        '--stdin',
        '--stdin-filename',
        filePath,
        '--fix-dry-run',
        '--format',
        'json',
      ],
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
      (fixResult.code === 0 && !EslintUtils.parseEslintOutput({ output: fixResult.stdout }).length)
    ) {
      log('File is not lintable, skipping');
      return { fixedContent: content, fixResults: [] };
    }

    // Parse the results
    const fixResults = EslintUtils.parseEslintOutput({ output: fixResult.stdout });

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
  },

  lintContentWithFiltering: async ({
    filePath,
    content,
  }: {
    filePath: string;
    content: string;
  }) => {
    log('Processing file with TypeScript rule filtering:', filePath);

    // First, get the fixed content and results
    const { fixResults } = await EslintUtils.lintContent({ filePath, content });

    // Check if there are any remaining errors after fixing
    if (fixResults.length > 0 && fixResults[0].messages) {
      let errors = fixResults[0].messages.filter((msg: EslintMessage) => msg.severity === 2);

      // Filter out @typescript-eslint errors in pre-hook mode
      errors = errors.filter((error: EslintMessage) => {
        const ruleId = error.ruleId || '';
        return !ruleId.startsWith('@typescript-eslint/');
      });

      if (errors.length > 0) {
        const errorSummary = `[PreToolUse Hook] ESLint found ${errors.length} error(s) in ${filePath}:\n`;
        const errorDetails = errors
          .slice(0, 10)
          .map((error: EslintMessage) => {
            const ruleInfo = error.ruleId ? ` [${error.ruleId}]` : '';
            return `  Line ${error.line}: ${error.message}${ruleInfo}`;
          })
          .join('\n');

        console.error(errorSummary + errorDetails);
        process.exit(2);
      }
    }

    process.exit(0);
  },

  runTypeScriptCheck: async ({ filePath }: { filePath: string }) => {
    try {
      const result = await ProcessUtils.spawnPromise({
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
  },
};
