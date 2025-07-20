#!/usr/bin/env node

import { spawn } from 'child_process';

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

function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.error(...args);
  }
}

function detectEscapeHatches(content: string): { found: boolean; message: string } {
  const violations: string[] = [];

  const thinkTypePhrase = `Take a step back, breath for a moment, and think through the issue at a high-level`;
  // Check for 'any' usage
  if (/:\s*any\b/.test(content)) {
    violations.push(
      `Syntax Violation Found ': any' - Use specific types instead. ${thinkTypePhrase}`,
    );
  }
  if (/as\s+any\b/.test(content)) {
    violations.push(
      `Found 'as any' - Type assertions to 'any' bypass type safety. Use proper typing or 'as unknown as SpecificType' if absolutely necessary. ${thinkTypePhrase}`,
    );
  }
  if (/<any>/.test(content)) {
    violations.push(
      `Found '<any>' - This TypeScript assertion bypasses type checking. Define proper types instead. ${thinkTypePhrase}`,
    );
  }

  // Check for TypeScript escape comments
  if (content.includes('@ts-ignore')) {
    violations.push(
      `Found '@ts-ignore' - This suppresses TypeScript errors. Fix the underlying type issue instead. ${thinkTypePhrase}`,
    );
  }
  if (content.includes('@ts-expect-error')) {
    violations.push(
      `Found '@ts-expect-error' - Don't suppress type errors. Fix the root cause. ${thinkTypePhrase}`,
    );
  }
  if (content.includes('@ts-nocheck')) {
    violations.push(
      `Found '@ts-nocheck' - This disables TypeScript checking for the entire file. Remove it and fix type issues. ${thinkTypePhrase}`,
    );
  }

  // Check for ESLint disable comments
  if (/eslint-disable(?:-next-line|-line)?/.test(content)) {
    violations.push(
      `Found 'eslint-disable' - Don't suppress linting. Fix the issue that the linter is reporting. ${thinkTypePhrase}`,
    );
  }

  if (violations.length > 0) {
    const message = [
      '🛑 Code quality escape hatches detected:',
      ...violations.map((v) => `  ❌ ${v}`),
      '',
      'These patterns bypass important safety checks. Please fix the underlying issues instead of suppressing them.',
    ].join('\n');

    return { found: true, message };
  }

  return { found: false, message: '' };
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
    return { fixedContent: '', fixResults: [] }; // Return empty string for empty content
  }

  // Always run fix (using --fix-dry-run for stdin)
  const fixResult = await runEslintCommand(
    ['lint', '--stdin', '--stdin-filename', filePath, '--fix-dry-run', '--format', 'json'],
    content,
    filePath,
    {},
  );

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
    return { fixedContent: content, fixResults: [] }; // Return original content for non-lintable files
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

function handlePostToolUse(hookData: PostToolUseHookData): Promise<void> {
  const errorReason =
    `PostTool streaming seems to fire before typescript has time to process and if you have @typescript-eslint enabled, it throws errors because of that. Disabling post tool for now` +
    JSON.stringify(hookData, null, 2);
  throw new Error(errorReason);
  // const toolInput = hookData.tool_input;
  // const filePath = 'file_path' in toolInput ? toolInput.file_path : '';
  //
  // if (!filePath) {
  //   debug('No file path provided');
  //   process.exit(0);
  // }
  //
  // try {
  //   // Read the actual file content from disk
  //   const content = await readFile(filePath, 'utf-8');
  //   const { fixedContent, fixResults } = await lintContent(filePath, content);
  //
  //   if (fixedContent && fixedContent !== content) {
  //     // Write the fixed content back to the file
  //     await writeFile(filePath, fixedContent, 'utf-8');
  //     debug('Fixed content written back to file');
  //   }
  //
  //   // Check for errors after fixing (including TypeScript errors)
  //   if (fixResults.length > 0 && fixResults[0].messages) {
  //     const errors = fixResults[0].messages.filter((msg) => msg.severity === 2);
  //
  //     if (errors.length > 0) {
  //       const errorSummary = `Lint found ${errors.length} error(s) in ${filePath}:\n`;
  //       const errorDetails = errors
  //         .slice(0, 3)
  //         .map((error) => `  Line ${error.line}: ${error.message}`)
  //         .join('\n');
  //
  //       console.error(errorSummary + errorDetails);
  //       process.exit(2);
  //     }
  //   }
  //
  //   process.exit(0);
  // } catch (error) {
  //   if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
  //     debug('File does not exist:', filePath);
  //     process.exit(0);
  //   }
  //
  //   // Check if this is a process.exit error from lintContent
  //   const errorMessage = error instanceof Error ? error.message : String(error);
  //   if (errorMessage.includes('Process exited with code 0')) {
  //     // This means lintContent determined the file is not lintable
  //     process.exit(0);
  //   }
  //
  //   console.error(`Error reading/writing file: ${errorMessage}`);
  //   process.exit(1);
  // }
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

  // Check for escape hatches first
  const escapeHatchCheck = detectEscapeHatches(content);
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
