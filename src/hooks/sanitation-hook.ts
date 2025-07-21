#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { processEscapeHatchisms } from './process-escape-hatchisms';

type WriteToolInput = {
  file_path: string;
  content: string;
};

type EditToolInput = {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
};

type MultiEditToolInput = {
  file_path: string;
  edits: Array<{
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }>;
};

type ToolInput = WriteToolInput | EditToolInput | MultiEditToolInput;

type PreToolUseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: ToolInput;
};

type PostToolUseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: ToolInput;
};

type UserPromptSubmitHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'UserPromptSubmit';
  user_prompt: string;
};

type BaseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
};

type HookData = PreToolUseHookData | PostToolUseHookData | UserPromptSubmitHookData | BaseHookData;

type EslintMessage = {
  line: number;
  message: string;
  severity: number;
  ruleId?: string;
};

type EslintResult = {
  messages: EslintMessage[];
  output?: string;
};

const DEBUG = process.env.DEBUG === 'true';

const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
} as const;

function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.error(...args);
  }
}

type SpawnResult = { code: number; stdout: string; stderr: string };

async function spawnPromise(
  command: string,
  args: string[],
  options?: { cwd?: string; stdin?: string; timeout?: number },
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options?.cwd || process.cwd(),
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

    if (options?.stdin) {
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
        const regex = new RegExp(editInput.old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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
          const regex = new RegExp(edit.old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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

function parseEslintOutput(output: string): EslintResult[] {
  try {
    const jsonMatch = output.match(/\[{[\s\S]*}]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as EslintResult[];
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
  const fixResult = await spawnPromise(
    'npm',
    [
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
    {
      stdin: content,
      timeout: 30000, // 30 second timeout
    },
  ).catch((error) => {
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
    const result = await spawnPromise('npx', ['tsc', '--noEmit', filePath], {
      timeout: 30000, // 30 second timeout
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
    const eslintResult = await spawnPromise(
      'npx',
      ['eslint', '--fix', '--format', 'json', filePath],
      {
        timeout: 30000, // 30 second timeout
      },
    );

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

async function handlePreToolUse(hookData: PreToolUseHookData): Promise<void> {
  const toolInput = hookData.tool_input;
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (!filePath) {
    debug('No file path provided');
    process.exit(0);
  }

  // Get the full file content after applying edits
  const content = await getFullFileContent(toolInput);

  if (!content) {
    debug('No content to lint');
    process.exit(0);
  }

  // Check for escape hatches first
  const escapeHatchCheck = processEscapeHatchisms(content);
  if (escapeHatchCheck.found) {
    console.error(escapeHatchCheck.message);
    process.exit(2);
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

export { lintContent, parseEslintOutput, getFullFileContent, handlePostToolUse, handlePreToolUse };
export type {
  WriteToolInput,
  EditToolInput,
  MultiEditToolInput,
  ToolInput,
  HookData,
  PreToolUseHookData,
  PostToolUseHookData,
  EslintMessage,
  EslintResult,
};
