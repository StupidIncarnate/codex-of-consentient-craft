import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { resolve } from '#gateway/node/path';
import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { EditToolInputStub } from '../contracts/edit-tool-input/edit-tool-input.stub';
import { WriteToolInputStub } from '../contracts/write-tool-input/write-tool-input.stub';

import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

const PACKAGE_DIR = resolve(__dirname, '../..');

// The warm-up loads eslint.config.js (tsx transpiles every rule from source) and builds the first
// TypeScript program: 6.7s alone, 21s with twelve such workers on a twelve-core box. A whole-repo
// integration run (1790696433684-3047) crossed ward's 30s hook limit and failed all 11 tests.
const WARMUP_TIMEOUT_MS = 120_000;

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using _lint-testbed (NOT _test-workspace or .test-tmp which are ESLint-ignored)
const BASE_DIR = FilePathStub({
  value: `${PACKAGE_DIR}/src/_lint-testbed/post-edit-tests`,
});

describe('post-edit-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  // The warm-up payload is a real lint round-trip, and that is the point: a READY worker has only
  // imported the flow, while `require(eslint.config.js)` and ESLint's first TypeScript program are
  // lazy and cost seconds. Measured before this landed: first test 6371ms, every later one
  // 224-366ms, for the same work. jest runs beforeAll outside the window it charges to a test, so
  // paying it here is what makes ward's slow-test gate read test bodies. See the harness header.
  beforeAll(async () => {
    const warmupTestbed = installTestbedCreateBroker({
      baseName: 'warmup',
      baseDir: BASE_DIR,
    });

    const warmupContent = `export const warm = ({ a }: { a: boolean }): boolean => a;\n`;

    warmupTestbed.writeFile({
      relativePath: 'example.info.ts',
      content: warmupContent,
    });

    await persistentRunner.start({
      hookName: 'start-post-edit-hook',
      warmupHookData: PostToolUseHookStub({
        cwd: PACKAGE_DIR,
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: `${warmupTestbed.guildPath}/example.info.ts`,
          content: warmupContent,
        }),
      }),
    });

    warmupTestbed.cleanup();
  }, WARMUP_TIMEOUT_MS);

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
        baseName: baseName,
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.info.ts`;

      const hookData = PostToolUseHookStub({
        cwd: PACKAGE_DIR,
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      testbed.writeFile({
        relativePath: 'example.info.ts',
        content: fileContent,
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
        baseName: baseName,
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.info.ts`;

      testbed.writeFile({
        relativePath: 'example.info.ts',
        content: initialContent,
      });

      const hookData = PostToolUseHookStub({
        cwd: PACKAGE_DIR,
        tool_name: 'Edit',
        tool_input: EditToolInputStub({
          file_path: filePath,
          old_string: initialContent,
          new_string: newContent,
        }),
      });

      testbed.writeFile({
        relativePath: 'example.info.ts',
        content: newContent,
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toMatch(stderrPattern);
    });
  });

  describe('with invalid hook data', () => {
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
    ])('$scenario', async ({ input, stderrPattern }) => {
      const result = await persistentRunner.runHookRaw({ rawInput: input });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      }).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(stderrPattern),
      });
    });
  });

  describe('auto-fix behavior', () => {
    it('VALID: {content: multiple fixable violations} => auto-fixes all and writes to disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'autofix-multiple',
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
        cwd: PACKAGE_DIR,
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      testbed.writeFile({
        relativePath: 'multi.info.ts',
        content: fileContent,
      });

      // Run the hook
      const result = await persistentRunner.runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: 'multi.info.ts',
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
        baseName: 'non-fixable-colocation',
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
        cwd: PACKAGE_DIR,
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      testbed.writeFile({
        relativePath: 'example-broker.ts',
        content: fileContent,
      });

      // Run the hook
      const result = await persistentRunner.runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: 'example-broker.ts',
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
        baseName: 'non-ts-file',
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
        cwd: PACKAGE_DIR,
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Actually write the file so hook can check it
      testbed.writeFile({
        relativePath: 'README.md',
        content: fileContent,
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
        baseName: 'non-existent-edit',
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/does-not-exist.ts`;

      const hookData = PostToolUseHookStub({
        cwd: PACKAGE_DIR,
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
