import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { hasNewEscapeHatches, getNewEscapeHatchMessage } from './process-escape-hatchisms';
import type {
  WriteToolInput,
  MultiEditToolInput,
  ToolInput,
  PreToolUseHookData,
  PostToolUseHookData,
  HookData,
  EslintMessage,
  EslintResult,
} from '../types/hooks';

type SpawnResult = { code: number; stdout: string; stderr: string };

const DEBUG = process.env.DEBUG === 'true';

const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
} as const;

const TIMEOUTS = {
  ESLINT: 30000, // 30 seconds
  TYPESCRIPT_CHECK: 30000, // 30 seconds
} as const;

function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.error(...args);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function spawnPromise(options: {
  command: string;
  args: string[];
  cwd?: string;
  stdin?: string;
  timeout?: number;
}): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(options.command, options.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || process.cwd(),
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout =
      options?.timeout &&
      setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        reject(new Error(`Process timed out after ${options.timeout}ms`));
      }, options.timeout);

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (timeout) clearTimeout(timeout);
      if (!timedOut) {
        resolve({ code: code || 0, stdout, stderr });
      }
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      if (!timedOut) {
        resolve({ code: 1, stdout: '', stderr: error.message });
      }
    });

    if (options.stdin) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    }
  });
}

async function getFullFileContent(toolInput: ToolInput): Promise<string | null> {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (!filePath) {
    return null;
  }

  // For Write tool, we already have the full content
  if ('content' in toolInput) {
    return toolInput.content;
  }

  try {
    // Read the existing file content
    const existingContent = await readFile(filePath, 'utf-8');

    // For Edit tool, apply the single edit
    if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
      const editInput = toolInput;
      if (editInput.replace_all) {
        // Use global regex replace for replaceAll functionality
        const regex = new RegExp(escapeRegex(editInput.old_string), 'g');
        return existingContent.replace(regex, editInput.new_string);
      } else {
        return existingContent.replace(editInput.old_string, editInput.new_string);
      }
    }

    // For MultiEdit tool, apply all edits sequentially
    if ('edits' in toolInput) {
      const multiEditInput = toolInput as MultiEditToolInput;
      let content = existingContent;

      for (const edit of multiEditInput.edits) {
        if (edit.replace_all) {
          // Use global regex replace for replaceAll functionality
          const regex = new RegExp(escapeRegex(edit.old_string), 'g');
          content = content.replace(regex, edit.new_string);
        } else {
          content = content.replace(edit.old_string, edit.new_string);
        }
      }

      return content;
    }
  } catch (error) {
    // If file doesn't exist (new file), we can't determine the content
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // For Write tool with new files, use the content
      if ('content' in toolInput) {
        return (toolInput as WriteToolInput).content;
      }
      // For Edit/MultiEdit on non-existent files, we can't proceed
      return null;
    }
    // For other errors, propagate them
    throw error;
  }

  return null;
}

function isEslintMessage(obj: unknown): obj is EslintMessage {
  if (!obj || typeof obj !== 'object') return false;
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.line === 'number' &&
    typeof msg.message === 'string' &&
    typeof msg.severity === 'number' &&
    (msg.ruleId === undefined || typeof msg.ruleId === 'string')
  );
}

function isEslintResult(obj: unknown): obj is EslintResult {
  if (!obj || typeof obj !== 'object') return false;
  const result = obj as Record<string, unknown>;
  return (
    Array.isArray(result.messages) &&
    result.messages.every(isEslintMessage) &&
    (result.output === undefined || typeof result.output === 'string')
  );
}

function parseEslintOutput(output: string): EslintResult[] {
  try {
    const jsonMatch = output.match(/\[{[\s\S]*}]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (Array.isArray(parsed) && parsed.every(isEslintResult)) {
      return parsed;
    }
    return [];
  } catch (e) {
    debug('Failed to parse Lint output:', e);
    return [];
  }
}

async function lintContent(
  filePath: string,
  content: string,
): Promise<{ fixedContent: string; fixResults: EslintResult[] }> {
  debug('Processing file:', filePath);

  if (!content) {
    debug('No content to lint');
    return { fixedContent: '', fixResults: [] };
  }

  // Run ESLint through stdin with --fix-dry-run
  const fixResult = await spawnPromise({
    command: 'npm',
    args: [
      'run',
      'lint',
      '--',
      '--stdin',
      '--stdin-filename',
      filePath,
      '--fix-dry-run',
      '--format',
      'json',
    ],
    stdin: content,
    timeout: TIMEOUTS.ESLINT,
  }).catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to spawn lint process: ${errorMessage}`);
    return { code: 1, stdout: '', stderr: errorMessage };
  });

  debug('Lint fix exit code:', fixResult.code);
  debug('Lint fix stdout:', fixResult.stdout);
  debug('Lint fix stderr:', fixResult.stderr);

  // Check for crashes
  if (fixResult.stderr.includes('Oops! Something went wrong!')) {
    console.error('Lint crashed during linting:');
    console.error(fixResult.stderr);
    process.exit(2);
  }

  // Check if file is lintable
  if (
    fixResult.stderr.includes('No files matching') ||
    fixResult.stderr.includes('Ignore pattern') ||
    (fixResult.code === 0 && !parseEslintOutput(fixResult.stdout).length)
  ) {
    debug('File is not lintable, skipping');
    return { fixedContent: content, fixResults: [] };
  }

  // Parse the results
  const fixResults = parseEslintOutput(fixResult.stdout);

  // Check for TypeScript project errors (happens with new files)
  if (fixResults.length > 0 && fixResults[0].messages) {
    const hasParserProjectError = fixResults[0].messages.some(
      (msg) => msg.message && msg.message.includes('parserOptions.project'),
    );
    if (hasParserProjectError) {
      debug('File not in TypeScript project yet, skipping');
      return { fixedContent: content, fixResults: [] };
    }
  }

  // Return the fixed content (if any)
  return {
    fixedContent: fixResults[0]?.output || content,
    fixResults: fixResults,
  };
}

async function lintContentWithFiltering(filePath: string, content: string): Promise<void> {
  debug('Processing file with TypeScript rule filtering:', filePath);

  // First, get the fixed content and results
  const { fixResults } = await lintContent(filePath, content);

  // Check if there are any remaining errors after fixing
  if (fixResults.length > 0 && fixResults[0].messages) {
    let errors = fixResults[0].messages.filter((msg) => msg.severity === 2);

    // Filter out @typescript-eslint errors in pre-hook mode
    errors = errors.filter((error) => {
      const ruleId = error.ruleId || '';
      return !ruleId.startsWith('@typescript-eslint/');
    });

    if (errors.length > 0) {
      const errorSummary = `[PreToolUse Hook] ESLint found ${errors.length} error(s) in ${filePath}:\n`;
      const errorDetails = errors
        .slice(0, 10)
        .map((error) => {
          const ruleInfo = error.ruleId ? ` [${error.ruleId}]` : '';
          return `  Line ${error.line}: ${error.message}${ruleInfo}`;
        })
        .join('\n');

      console.error(errorSummary + errorDetails);
      process.exit(2);
    }
  }

  process.exit(0);
}

async function runTypeScriptCheck(
  filePath: string,
): Promise<{ hasErrors: boolean; errors: string }> {
  try {
    const result = await spawnPromise({
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
}

async function handlePostToolUse(hookData: PostToolUseHookData): Promise<void> {
  const toolInput = hookData.tool_input;
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (!filePath) {
    debug('No file path provided');
    process.exit(0);
  }

  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      debug('File does not exist, skipping checks');
      process.exit(0);
    }

    // First run TypeScript check (only for TS files)
    const isTypescriptFile = FILE_EXTENSIONS.TYPESCRIPT.some((ext) => filePath.endsWith(ext));

    if (isTypescriptFile) {
      const tscResult = await runTypeScriptCheck(filePath);
      if (tscResult.hasErrors) {
        console.error(`[PostToolUse Hook] TypeScript found errors in ${filePath}:`);
        console.error(tscResult.errors);
        process.exit(2);
      }
    }

    // Then run ESLint directly on the file with --fix and JSON output
    const eslintResult = await spawnPromise({
      command: 'npx',
      args: ['eslint', '--fix', '--format', 'json', filePath],
      timeout: TIMEOUTS.ESLINT,
    });

    debug('ESLint exit code:', eslintResult.code);
    debug('ESLint stdout:', eslintResult.stdout);
    debug('ESLint stderr:', eslintResult.stderr);

    // Parse the results
    const results = parseEslintOutput(eslintResult.stdout);

    if (results.length > 0 && results[0].messages) {
      const errors = results[0].messages.filter((msg) => msg.severity === 2);

      if (errors.length > 0) {
        const errorSummary = `[PostToolUse Hook] ESLint found ${errors.length} error(s) in ${filePath}:\n`;
        const errorDetails = errors
          .slice(0, 10)
          .map((error) => {
            const ruleInfo = error.ruleId ? ` [${error.ruleId}]` : '';
            return `  Line ${error.line}: ${error.message}${ruleInfo}`;
          })
          .join('\n');

        console.error(errorSummary + errorDetails);
        process.exit(2);
      }
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error running ESLint: ${errorMessage}`);
    process.exit(1);
  }
}

interface ContentChange {
  oldContent: string;
  newContent: string;
}

async function getContentChanges(toolInput: ToolInput): Promise<ContentChange[]> {
  const changes: ContentChange[] = [];
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  // For Write tool, need to check against existing file content
  if ('content' in toolInput && filePath) {
    let oldContent = '';
    try {
      // Try to read existing file content
      oldContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - new file case
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    changes.push({ oldContent, newContent: toolInput.content });
  }
  // For Edit tool, we have explicit old and new strings
  else if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
    changes.push({ oldContent: toolInput.old_string, newContent: toolInput.new_string });
  }
  // For MultiEdit tool, check the full file content before and after all edits
  else if ('edits' in toolInput && filePath) {
    let oldContent = '';
    try {
      // Try to read existing file content
      oldContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - new file case
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // Get the full file content after applying all edits
    const newContent = await getFullFileContent(toolInput);
    if (newContent !== null) {
      changes.push({ oldContent, newContent });
    }
  }

  return changes;
}

async function handlePreToolUse(hookData: PreToolUseHookData): Promise<void> {
  const toolInput = hookData.tool_input;
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (!filePath) {
    debug('No file path provided');
    process.exit(0);
  }

  // Check for newly introduced escape hatches
  const contentChanges = await getContentChanges(toolInput);
  for (const change of contentChanges) {
    // Check if new content introduces escape hatches that weren't in old content
    if (hasNewEscapeHatches(change.oldContent, change.newContent, filePath)) {
      console.error('[PreToolUse Hook] New escape hatches detected:');
      console.error(getNewEscapeHatchMessage(change.oldContent, change.newContent, filePath));
      process.exit(2);
    }
  }

  // Get the full file content after applying edits for linting
  const content = await getFullFileContent(toolInput);

  if (!content) {
    debug('No content to lint');
    process.exit(0);
  }

  // Run linting with TypeScript rule filtering
  await lintContentWithFiltering(filePath, content);
}

function main(): void {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    void (async () => {
      try {
        const hookData = JSON.parse(inputData) as HookData;
        debug('Hook data:', JSON.stringify(hookData, null, 2));

        if (hookData.hook_event_name === 'PostToolUse' && 'tool_name' in hookData) {
          await handlePostToolUse(hookData);
        } else if (hookData.hook_event_name === 'PreToolUse' && 'tool_name' in hookData) {
          await handlePreToolUse(hookData);
        } else {
          console.error(`Unknown or unsupported hook event: ${hookData.hook_event_name}`);
          process.exit(1);
        }
      } catch (parseError) {
        console.error(
          `Hook parsing error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        process.exit(1);
      }
    })();
  });
}

if (require.main === module) {
  main();
}

export {
  lintContent,
  parseEslintOutput,
  getFullFileContent,
  handlePostToolUse,
  handlePreToolUse,
  getContentChanges,
};
