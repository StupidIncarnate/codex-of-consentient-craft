import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { EditToolInputStub } from '../contracts/edit-tool-input/edit-tool-input.stub';
import { WriteToolInputStub } from '../contracts/write-tool-input/write-tool-input.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';
import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using _lint-testbed (NOT _test-workspace or .test-tmp which are ESLint-ignored)
const BASE_DIR = FilePathStub({
  value: `${process.cwd()}/src/_lint-testbed/post-edit-tests`,
});

describe('post-edit-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-post-edit-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  describe('with Write tool', () => {
    it.each([
      {
        scenario: 'VALID: {content: clean TypeScript code} => returns exit code 0',
        baseName: 'clean-write',
        fileContent: `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => a || b;\n`,
        stderrPattern: /All violations auto-fixed successfully/iu,
      },
      {
        scenario: 'VALID: {content: with console.log} => reports violation but exits with 0',
        baseName: 'console-log-write',
        fileContent: `export const test = (): void => {\n  console.log('test');\n};\n`,
        stderrPattern: /Unexpected console statement/iu,
      },
      {
        scenario: 'EMPTY: {content: empty file} => returns exit code 0',
        baseName: 'empty-write',
        fileContent: '',
        stderrPattern: /All violations auto-fixed successfully/iu,
      },
    ])('$scenario', async ({ baseName, fileContent, stderrPattern }) => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: baseName }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.info.ts`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example.info.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toMatch(stderrPattern);
    });
  });

  describe('with Edit tool', () => {
    it.each([
      {
        scenario: 'VALID: {old_string: clean code, new_string: clean code} => returns exit code 0',
        baseName: 'clean-edit',
        initialContent: `export const oldFunction = (): boolean => true;\n`,
        newContent: `export const newFunction = (): boolean => false;\n`,
        stderrPattern: /All violations auto-fixed successfully/iu,
      },
      {
        scenario: 'VALID: {new_string: adds console.log} => reports violation but exits with 0',
        baseName: 'add-console-edit',
        initialContent: `export const test = (): void => {};\n`,
        newContent: `export const test = (): void => {\n  console.log('debug');\n};\n`,
        stderrPattern: /Unexpected console statement/iu,
      },
    ])('$scenario', async ({ baseName, initialContent, newContent, stderrPattern }) => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: baseName }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.info.ts`;

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example.info.ts' }),
        content: FileContentStub({ value: initialContent }),
      });

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Edit',
        tool_input: EditToolInputStub({
          file_path: filePath,
          old_string: initialContent,
          new_string: newContent,
        }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example.info.ts' }),
        content: FileContentStub({ value: newContent }),
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toMatch(stderrPattern);
    });
  });

  describe('with invalid hook data', () => {
    const runner = hookRunnerHarness();

    it.each([
      {
        scenario: 'INVALID_INPUT: {invalid JSON} => exits with 1',
        input: 'not valid json',
        stderrPattern: /Hook error/iu,
      },
      {
        scenario: 'INVALID_INPUT: {missing required fields} => exits with 1',
        input: JSON.stringify({ invalid: 'data' }),
        stderrPattern: /Unsupported hook event/iu,
      },
    ])('$scenario', ({ input, stderrPattern }) => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-post-edit-hook',
        input: input as never,
      });

      expect({
        status: rawResult.status,
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
      }).toStrictEqual({
        status: 1,
        stdout: '',
        stderr: expect.stringMatching(stderrPattern),
      });
    });
  });

  describe('auto-fix behavior', () => {
    it('VALID: {content: multiple fixable violations} => auto-fixes all and writes to disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'autofix-multiple' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/multi.info.ts`;

      // Write code with multiple fixable violations
      const fileContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => {
  return a || b;
};

export const subtract=({a,b}:{a:boolean;b:boolean}):boolean=>{
return a&&b;
};`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'multi.info.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = await persistentRunner.runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'multi.info.ts' }),
      });

      testbed.cleanup();

      // Both functions should be auto-fixed
      const expectedFixedContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => a || b;

export const subtract = ({ a, b }: { a: boolean; b: boolean }): boolean => a && b;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Hook should exit successfully with auto-fix success message
      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: 'All violations auto-fixed successfully\n',
      });
    });

    it('EDGE: {content: implementation without test} => reports colocation error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-fixable-colocation' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example-broker.ts`;

      // Write implementation file without test - violates colocation (non-fixable)
      const fileContent = `/**
 * PURPOSE: Example broker for testing colocation violations
 *
 * USAGE:
 * const result = await exampleBroker({ data: 'test' });
 * // Returns processed data
 */
export const exampleBroker = async ({ data }: { data: string }): Promise<string> => data;
`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example-broker.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = await persistentRunner.runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'example-broker.ts' }),
      });

      testbed.cleanup();

      // File content should have only formatting fixes (prettier adds trailing newline)
      // Colocation violation is not auto-fixable
      expect(fileContentAfterHook).toStrictEqual(fileContent);

      // Hook should exit successfully (never blocks) but report colocation violation
      // stdout contains JSON block with decision/reason; stderr contains the violation message
      const colocationStdoutPattern =
        /^\{"decision":"block","reason":"🛑 New code quality violations detected:.+"\}$/su;
      const colocationStderrPattern =
        /^🛑 New code quality violations detected:\n.+must have a colocated test file.+Create example-broker\.test\.ts.+\n$/su;

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(colocationStdoutPattern),
        stderr: expect.stringMatching(colocationStderrPattern),
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {tool_input: non-TypeScript file} => returns exit code 0', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-ts-file' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/README.md`;

      const fileContent = `# TypeScript Guide

Here are some examples with console.log:

\`\`\`typescript
function test(): void {
  console.log('test');
}
\`\`\``;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Actually write the file so hook can check it
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'README.md' }),
        content: FileContentStub({ value: fileContent }),
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        // Post-edit hook may output auto-fix messages to stderr
        stderr: expect.stringMatching(/^(?:.*All violations auto-fixed successfully.*|)$/su),
      });
    });

    it('EDGE: {file_path: non-existent file} => returns exit code 0', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-existent-edit' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/does-not-exist.ts`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Edit',
        tool_input: EditToolInputStub({
          file_path: filePath,
          old_string: 'old',
          new_string: 'new',
        }),
      });

      // Don't create the file - testing non-existent scenario

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        // Post-edit hook may output ESLint error about missing file
        stderr: expect.stringMatching(
          /^(?:.*ESLint error.*|.*All violations auto-fixed successfully.*|)$/su,
        ),
      });
    });
  });
});
