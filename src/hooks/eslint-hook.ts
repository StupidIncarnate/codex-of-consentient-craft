#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';

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

type HookData = PreToolUseHookData | PostToolUseHookData;

type EslintMessage = {
  line: number;
  message: string;
  severity: number;
};

type EslintResult = {
  messages: EslintMessage[];
  output?: string;
};

const DEBUG = process.env.DEBUG === 'true';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: false,
  validate: false,
};

for (const arg of args) {
  if (arg === '--fix') {
    options.fix = true;
  } else if (arg === '--validate') {
    options.validate = true;
  }
}

// Default to validate mode if no option specified
if (!options.fix && !options.validate) {
  options.validate = true;
}

function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.error(...args);
  }
}

function extractContentFromToolInput(toolInput: ToolInput): string | null {
  if ('content' in toolInput) {
    // Write tool
    return toolInput.content;
  }

  if ('new_string' in toolInput && !('edits' in toolInput)) {
    // Edit tool
    return toolInput.new_string;
  }

  if ('edits' in toolInput) {
    const multiEditInput = toolInput as MultiEditToolInput;
    if (multiEditInput.edits.length > 0) {
      // MultiEdit tool - return the final state after all edits
      // Note: This is a simplification - in reality we'd need to apply all edits sequentially
      const lastEdit = multiEditInput.edits[multiEditInput.edits.length - 1];
      if (lastEdit) {
        return lastEdit.new_string;
      }
    }
  }

  return null;
}

async function runEslintCommand(
  command: string[],
  content: string,
  _filePath: string,
  env: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const eslintProcess = spawn('npm', ['run', command[0], '--', ...command.slice(1)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

    eslintProcess.stdout.on('data', (data) => {
      stdout += data;
    });

    eslintProcess.stderr.on('data', (data) => {
      stderr += data;
    });

    eslintProcess.on('close', (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });

    eslintProcess.on('error', (error) => {
      console.error(`Failed to spawn lint process: ${error.message}`);
      resolve({ code: 1, stdout: '', stderr: error.message });
    });

    eslintProcess.stdin.write(content);
    eslintProcess.stdin.end();
  });
}

function parseEslintOutput(output: string): EslintResult[] {
  try {
    const jsonMatch = output.match(/\[{[\s\S]*}\]/);
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
  shouldFix: boolean,
): Promise<string | void> {
  debug('Processing file:', filePath, 'fix mode:', shouldFix);

  if (!content) {
    debug('No content to lint');
    if (shouldFix) {
      return ''; // Return empty string for fix mode
    }
    process.exit(0);
  }

  if (shouldFix) {
    // In fix mode, just run lint with --fix and let it do its job
    const fixResult = await runEslintCommand(
      ['lint', '--stdin', '--stdin-filename', filePath, '--fix', '--format', 'json'],
      content,
      filePath,
      { ESLINT_STDIN: 'true' },
    );

    debug('Lint fix exit code:', fixResult.code);

    // Check if file is lintable
    if (
      fixResult.stderr.includes('No files matching') ||
      fixResult.stderr.includes('Ignore pattern') ||
      (fixResult.code === 0 && !parseEslintOutput(fixResult.stdout).length)
    ) {
      debug('File is not lintable, skipping');
      return content; // Return original content for non-lintable files
    }

    // Return the fixed content (if any) for the post hook to write back
    const fixResults = parseEslintOutput(fixResult.stdout);
    return fixResults[0]?.output || content;
  } else {
    // Pre-hook validation mode
    // First, try to fix the content
    const fixResult = await runEslintCommand(
      ['lint', '--stdin', '--stdin-filename', filePath, '--fix-dry-run', '--format', 'json'],
      content,
      filePath,
      { ESLINT_STDIN: 'true' },
    );

    debug('Lint fix exit code:', fixResult.code);
    debug('Lint stderr:', fixResult.stderr);
    debug('Lint stdout:', fixResult.stdout);

    // Extract fixed content if available
    let contentToValidate = content;
    const fixResults = parseEslintOutput(fixResult.stdout);
    if (fixResults[0]?.output) {
      contentToValidate = fixResults[0].output;
      debug('Content was auto-fixed');
    }

    // Check if Lint considers this file lintable
    if (
      fixResult.stderr.includes('No files matching') ||
      fixResult.stderr.includes('Ignore pattern') ||
      (fixResult.code === 0 && !fixResults.length)
    ) {
      debug('File is not lintable, skipping');
      process.exit(0);
    }

    // Now validate the fixed content
    const validateResult = await runEslintCommand(
      ['lint', '--stdin', '--stdin-filename', filePath, '--format', 'json'],
      contentToValidate,
      filePath,
      { LINT_NEXT: '0', ESLINT_STDIN: 'true' },
    );

    debug('Lint validation exit code:', validateResult.code);

    if (validateResult.code !== 0) {
      // Check for crashes
      if (validateResult.stderr.includes('Oops! Something went wrong!')) {
        console.error('Lint crashed during linting:');
        console.error(validateResult.stderr);
        process.exit(2);
      }

      const lintResults = parseEslintOutput(validateResult.stdout);
      const errors = lintResults[0]?.messages?.filter((msg) => msg.severity === 2) || [];

      if (errors.length > 0) {
        const errorSummary = `Lint found ${errors.length} error(s) in ${filePath}:\n`;
        const errorDetails = errors
          .slice(0, 3)
          .map((error) => `  Line ${error.line}: ${error.message}`)
          .join('\n');

        console.error(errorSummary + errorDetails);
        process.exit(2);
      }
    }

    process.exit(0);
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
    // Read the actual file content from disk
    const content = await readFile(filePath, 'utf-8');
    const fixedContent = await lintContent(filePath, content, true);

    if (fixedContent && fixedContent !== content) {
      // Write the fixed content back to the file
      await writeFile(filePath, fixedContent, 'utf-8');
      debug('Fixed content written back to file');
    }

    process.exit(0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      debug('File does not exist:', filePath);
      process.exit(0);
    }

    // Check if this is a process.exit error from lintContent
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Process exited with code 0')) {
      // This means lintContent determined the file is not lintable
      process.exit(0);
    }

    console.error(`Error reading/writing file: ${errorMessage}`);
    process.exit(1);
  }
}

async function handlePreToolUse(hookData: PreToolUseHookData): Promise<void> {
  const toolInput = hookData.tool_input;
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';
  const content = extractContentFromToolInput(toolInput);

  if (!filePath) {
    debug('No file path provided');
    process.exit(0);
  }

  if (!content) {
    debug('No content to lint');
    process.exit(0);
  }

  await lintContent(filePath, content, false);
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

        if (options.fix) {
          // Fix mode - used as PostToolUse hook
          await handlePostToolUse(hookData as PostToolUseHookData);
        } else {
          // Validate mode - used as PreToolUse hook
          await handlePreToolUse(hookData as PreToolUseHookData);
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
  extractContentFromToolInput,
  handlePostToolUse,
  handlePreToolUse,
};
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
