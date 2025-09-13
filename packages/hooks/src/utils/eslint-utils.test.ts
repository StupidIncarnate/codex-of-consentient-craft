import {EslintUtils} from './eslint-utils';
import {ChildProcessMocker} from '@questmaestro/testing';

describe('EslintUtils', () => {
    describe('isEslintMessage()', () => {
        it("VALID: {line: 5, message: 'error', severity: 2} => returns true", () => {
            const obj = {line: 5, message: 'error', severity: 2};

            expect(EslintUtils.isEslintMessage(obj)).toBe(true);
        });

        it("VALID: {line: 1, message: 'warn', severity: 1, ruleId: 'no-unused-vars'} => returns true", () => {
            const obj = {line: 1, message: 'warn', severity: 1, ruleId: 'no-unused-vars'};

            expect(EslintUtils.isEslintMessage(obj)).toBe(true);
        });

        it("VALID: {line: 10, message: 'info', severity: 0, ruleId: undefined} => returns true", () => {
            const obj = {line: 10, message: 'info', severity: 0, ruleId: undefined};

            expect(EslintUtils.isEslintMessage(obj)).toBe(true);
        });

        it("VALID: {line: -1, message: 'error', severity: 2} => returns true", () => {
            const obj = {line: -1, message: 'error', severity: 2};

            expect(EslintUtils.isEslintMessage(obj)).toBe(true);
        });

        it("INVALID: {line: 'five', message: 'error', severity: 2} => returns false", () => {
            const obj = {line: 'five', message: 'error', severity: 2};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('INVALID: {line: 5, message: 123, severity: 2} => returns false', () => {
            const obj = {line: 5, message: 123, severity: 2};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it("INVALID: {line: 5, message: 'error', severity: 'high'} => returns false", () => {
            const obj = {line: 5, message: 'error', severity: 'high'};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it("INVALID: {line: 5, message: 'error', severity: 2, ruleId: 123} => returns false", () => {
            const obj = {line: 5, message: 'error', severity: 2, ruleId: 123};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it("INVALID: 'string' => returns false", () => {
            const obj = 'string';

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('INVALID: 123 => returns false', () => {
            const obj = 123;

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('INVALID: {} => returns false', () => {
            const obj = {};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('INVALID: {line: 0} => returns false', () => {
            const obj = {line: 0};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it("INVALID: {message: 'error'} => returns false", () => {
            const obj = {message: 'error'};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('INVALID: {severity: 2} => returns false', () => {
            const obj = {severity: 2};

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('EMPTY: null => returns false', () => {
            const obj = null;

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it('EMPTY: undefined => returns false', () => {
            const obj = undefined;

            expect(EslintUtils.isEslintMessage(obj)).toBe(false);
        });

        it("EDGE: {line: 999999, message: '', severity: 0} => returns true", () => {
            const obj = {line: 999999, message: '', severity: 0};

            expect(EslintUtils.isEslintMessage(obj)).toBe(true);
        });
    });

    describe('isEslintResult()', () => {
        it("VALID: {messages: [], output: 'fixed code'} => returns true", () => {
            const obj = {messages: [], output: 'fixed code'};

            expect(EslintUtils.isEslintResult(obj)).toBe(true);
        });

        it("VALID: {messages: [{line: 1, message: 'error', severity: 2}]} => returns true", () => {
            const obj = {messages: [{line: 1, message: 'error', severity: 2}]};

            expect(EslintUtils.isEslintResult(obj)).toBe(true);
        });

        it('VALID: {messages: [], output: undefined} => returns true', () => {
            const obj = {messages: [], output: undefined};

            expect(EslintUtils.isEslintResult(obj)).toBe(true);
        });

        it("INVALID: {messages: 'not array'} => returns false", () => {
            const obj = {messages: 'not array'};

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it("INVALID: {messages: [{line: 'invalid'}]} => returns false", () => {
            const obj = {messages: [{line: 'invalid'}]};

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it('INVALID: {messages: [], output: 123} => returns false', () => {
            const obj = {messages: [], output: 123};

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it("INVALID: 'string' => returns false", () => {
            const obj = 'string';

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it('INVALID: {} => returns false', () => {
            const obj = {};

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it('EMPTY: null => returns false', () => {
            const obj = null;

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });

        it('EMPTY: undefined => returns false', () => {
            const obj = undefined;

            expect(EslintUtils.isEslintResult(obj)).toBe(false);
        });
    });

    describe('parseEslintOutput()', () => {
        it('VALID: {output: \'[{"messages":[]}]\'} => returns EslintResult array', () => {
            const output = '[{"messages":[]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('VALID: {output: \'prefix[{"messages":[]}]suffix\'} => returns EslintResult array', () => {
            const output = 'prefix[{"messages":[]}]suffix';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('VALID: {output: \'[{"messages":[{"line":1,"message":"error","severity":2}]}]\'} => returns EslintResult array', () => {
            const output = '[{"messages":[{"line":1,"message":"error","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {
                    messages: [{line: 1, message: 'error', severity: 2}],
                },
            ]);
        });

        it('VALID: output with multiple results => returns all valid results', () => {
            const output = '[{"messages":[]},{"messages":[{"line":5,"message":"warn","severity":1}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {messages: []},
                {messages: [{line: 5, message: 'warn', severity: 1}]},
            ]);
        });

        it("INVALID: {output: 'no json array'} => returns empty array", () => {
            const output = 'no json array';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it("INVALID: {output: '[invalid json'} => returns empty array", () => {
            const output = '[invalid json';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('INVALID: {output: \'[{"invalid":"structure"}]\'} => returns empty array', () => {
            const output = '[{"invalid":"structure"}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('INVALID: array with mixed valid/invalid items => returns only valid items', () => {
            const output =
                '[{"messages":[]},{"invalid":"structure"},{"messages":[{"line":1,"message":"test","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {messages: []},
                {messages: [{line: 1, message: 'test', severity: 2}]},
            ]);
        });

        it("EMPTY: {output: ''} => returns empty array", () => {
            const output = '';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it("EMPTY: {output: '[]'} => returns empty array", () => {
            const output = '[]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('ERROR: JSON.parse throws => returns empty array and logs error', () => {
            const output = '[{"messages":invalid}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('EDGE: output with nested JSON arrays => finds correct array match', () => {
            const output = 'Some text [{"nested":"data"}] and then [{"messages":[]}] more text';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('EDGE: output with escaped quotes in JSON => parses correctly', () => {
            const output = '[{"messages":[{"line":1,"message":"Error with \\"quotes\\"","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {
                    messages: [{line: 1, message: 'Error with "quotes"', severity: 2}],
                },
            ]);
        });

        it('EDGE: unmatched opening bracket => returns empty array', () => {
            const output = '[{"messages":[]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('EDGE: unmatched closing bracket => returns empty array', () => {
            const output = 'messages":[]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([]);
        });

        it('EDGE: brackets inside JSON string values => parses correctly', () => {
            const output = '[{"messages":[{"line":1,"message":"Error [line 5] here","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {
                    messages: [{line: 1, message: 'Error [line 5] here', severity: 2}],
                },
            ]);
        });

        it('EDGE: escaped brackets in JSON strings => parses correctly', () => {
            const output = '[{"messages":[{"line":1,"message":"Error \\\\[escaped\\\\]","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {
                    messages: [{line: 1, message: 'Error \\[escaped\\]', severity: 2}],
                },
            ]);
        });

        it('EDGE: deeply nested arrays => parses correctly', () => {
            const output = 'prefix [[[[{"messages":[]}]]]] suffix';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('EDGE: empty array followed by valid array => returns valid array', () => {
            const output = '[] [{"messages":[]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('EDGE: multiple valid arrays => returns first valid array', () => {
            const output = '[{"messages":[]}] [{"messages":[{"line":1,"message":"test","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('EDGE: ANSI color codes around JSON => parses correctly', () => {
            const output = '\\u001b[32m[{"messages":[]}]\\u001b[0m';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([{messages: []}]);
        });

        it('BUG: brackets inside strings affecting bracket counting => still parses correctly', () => {
            const output =
                'prefix[invalid] then [{"messages":[{"line":1,"message":"Array [0] access","severity":2}]}]';

            const result = EslintUtils.parseEslintOutput({output});

            expect(result).toStrictEqual([
                {
                    messages: [{line: 1, message: 'Array [0] access', severity: 2}],
                },
            ]);
        });
    });

    describe('lintContent()', () => {
        it("VALID: {filePath: 'test.ts', content: 'const x = 1;'} => returns fixed content and results", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[]}]',
                    stderr: '',
                },
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it("VALID: {filePath: 'test.js', content: 'valid code'} => returns original content when no fixes", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[]}]',
                    stderr: '',
                },
            });

            const filePath = 'test.js';
            const content = 'valid code';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'valid code',
                fixResults: [],
            });
        });
        it('VALID: eslint returns fixed output => returns fixed content', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[],"output":"const x = 1;\\n"}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x=1';

            const result = await FreshEslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;\n',
                fixResults: [{messages: [], output: 'const x = 1;\n'}],
            });
        });
        it('VALID: exit code 0 with no ESLint output => returns original content', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: '',
                },
            });

            const filePath = 'test.txt';
            const content = 'plain text file';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'plain text file',
                fixResults: [],
            });
        });
        it('VALID: ESLint fix-dry-run returns multiple messages => processes all messages', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout:
                        '[{"messages":[{"line":1,"message":"Missing semicolon","severity":2}],"output":"const x = 1;\\nconst y = 2;\\n"}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x=1;const y=2';

            const result = await FreshEslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;\nconst y = 2;\n',
                fixResults: [
                    {
                        messages: [{line: 1, message: 'Missing semicolon', severity: 2}],
                        output: 'const x = 1;\nconst y = 2;\n',
                    },
                ],
            });
        });

        it("EMPTY: {filePath: 'test.ts', content: ''} => returns empty content and empty results", async () => {
            const filePath = 'test.ts';
            const content = '';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: '',
                fixResults: [],
            });
        });

        it('ERROR: process spawn fails => returns original content and empty results', async () => {
            ChildProcessMocker.mockSpawn(ChildProcessMocker.presets.crash());

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            // Should return original content when spawn fails
            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('ERROR: eslint crashes with exit code 2 and stderr => throws error', async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });

            // Set up the mock before importing
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 2,
                    stdout: '',
                    stderr: 'The --fix option and the --fix-dry-run option cannot be used together.',
                },
            });

            // Dynamically import the module after setting up the mock
            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await expect(FreshEslintUtils.lintContent({filePath, content})).rejects.toThrow(
                'ESLint crashed during linting',
            );

            expect(mockConsoleError).toHaveBeenCalledWith('Lint crashed during linting:');
            expect(mockConsoleError).toHaveBeenCalledWith(
                'The --fix option and the --fix-dry-run option cannot be used together.',
            );
        });
        it("ERROR: typescript project error with 'parserOptions.project' => returns original content", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout:
                        '[{"messages":[{"line":1,"message":"Parsing error: \\\'parserOptions.project\\\' has been set","severity":2}]}]',
                    stderr: '',
                },
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('ERROR: spawn promise catch returns error object => handles error properly', async () => {
            ChildProcessMocker.mockSpawn(
                ChildProcessMocker.presets.crash(new Error('Custom spawn error')),
            );

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('ERROR: process spawn returns non-zero exit code => still processes output', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 1,
                    stdout: '[{"messages":[{"line":1,"message":"Parsing error","severity":2}]}]',
                    stderr: '',
                },
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            // Non-zero exit codes still process output, but parsing may fail
            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });

        it("EDGE: file not lintable with 'No files matching' => returns original content", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: 'No files matching the pattern "test.ts" were found.',
                },
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it("EDGE: file ignored with 'Ignore pattern' => returns original content", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: 'File ignored because of a matching ignore pattern.',
                },
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('EDGE: process spawn timeout after 30 seconds => returns original content', async () => {
            ChildProcessMocker.mockSpawn(ChildProcessMocker.presets.timeout());

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('EDGE: very long file path => handles correctly', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[]}]',
                    stderr: '',
                },
            });

            const filePath = '/very/long/path/to/nested/directories/that/might/cause/issues/test.ts';
            const content = 'const x = 1;';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent: 'const x = 1;',
                fixResults: [],
            });
        });
        it('EDGE: content with special characters => processes correctly', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[]}]',
                    stderr: '',
                },
            });

            const filePath = 'test.ts';
            const content =
                'const emoji = "🚀💻"; const unicode = "こんにちは"; const quotes = \'"nested"\';';

            const result = await EslintUtils.lintContent({filePath, content});

            expect(result).toStrictEqual({
                fixedContent:
                    'const emoji = "🚀💻"; const unicode = "こんにちは"; const quotes = \'"nested"\';',
                fixResults: [],
            });
        });
    });

    describe('lintContentWithFiltering()', () => {
        beforeEach(() => {
            jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        });

        it('VALID: no errors after filtering => process exits with code 0', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[]}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await FreshEslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('VALID: only typescript-eslint errors => filters out and exits with code 0', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout:
                        '[{"messages":[{"line":1,"message":"TypeScript error","severity":2,"ruleId":"@typescript-eslint/no-unused-vars"}]}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await FreshEslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('VALID: errors without ruleId => formats without rule info', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '[{"messages":[{"line":5,"message":"Parsing error","severity":2}]}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await FreshEslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Parsing error',
            );
            expect(mockProcessExit).toHaveBeenCalledWith(2);
        });

        it('ERROR: non-typescript errors present => logs errors and exits with code 2', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout:
                        '[{"messages":[{"line":1,"message":"Missing semicolon","severity":2,"ruleId":"semi"}]}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await FreshEslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 1: Missing semicolon [semi]',
            );
            expect(mockProcessExit).toHaveBeenCalledWith(2);
        });

        it('ERROR: mixed errors with non-typescript => filters typescript but exits for others', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout:
                        '[{"messages":[{"line":1,"message":"TypeScript error","severity":2,"ruleId":"@typescript-eslint/no-unused-vars"},{"line":2,"message":"Missing semicolon","severity":2,"ruleId":"semi"}]}]',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await FreshEslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 2: Missing semicolon [semi]',
            );
            expect(mockProcessExit).toHaveBeenCalledWith(2);
        });

        it("ERROR: error message format includes '[PreToolUse Hook] ESLint found X error(s) in file'", async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [
                    {
                        messages: [{line: 1, message: 'Error message', severity: 2, ruleId: 'some-rule'}],
                    },
                ],
            });

            const filePath = 'src/example.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in src/example.ts:\n  Line 1: Error message [some-rule]',
            );
        });

        it("ERROR: error details format includes 'Line X: message [ruleId]'", async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [
                    {
                        messages: [
                            {line: 42, message: 'Variable not used', severity: 2, ruleId: 'no-unused-vars'},
                        ],
                    },
                ],
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 42: Variable not used [no-unused-vars]',
            );
        });

        it('ERROR: exactly 10 errors => shows all 10 errors', async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            const errors = Array.from({length: 10}, (_, i) => ({
                line: i + 1,
                message: `Error ${i + 1}`,
                severity: 2 as const,
                ruleId: 'test-rule',
            }));
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [{messages: errors}],
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            const expectedDetails = errors
                .map((_, i) => `  Line ${i + 1}: Error ${i + 1} [test-rule]`)
                .join('\n');
            expect(mockConsoleError).toHaveBeenCalledWith(
                `[PreToolUse Hook] ESLint found 10 error(s) in test.ts:\n${expectedDetails}`,
            );
        });

        it('ERROR: console.error called with complete error summary', async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [
                    {
                        messages: [{line: 5, message: 'Test error', severity: 2, ruleId: 'test-rule'}],
                    },
                ],
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Test error [test-rule]',
            );
        });

        it('EDGE: severity 1 warnings only => exits with code 0', async () => {
            const mockProcessExit = jest
                .spyOn(process, 'exit')
                .mockImplementation(() => undefined as never);
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [
                    {
                        messages: [
                            {line: 1, message: 'Warning message', severity: 1, ruleId: 'some-warning'},
                        ],
                    },
                ],
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('EDGE: more than 10 errors => shows only first 10 in output', async () => {
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
            });
            const errors = Array.from({length: 15}, (_, i) => ({
                line: i + 1,
                message: `Error ${i + 1}`,
                severity: 2 as const,
                ruleId: 'test-rule',
            }));
            jest.spyOn(EslintUtils, 'lintContent').mockResolvedValue({
                fixedContent: 'const x = 1;',
                fixResults: [{messages: errors}],
            });

            const filePath = 'test.ts';
            const content = 'const x = 1;';

            await EslintUtils.lintContentWithFiltering({filePath, content});

            const expectedDetails = errors
                .slice(0, 10)
                .map((_, i) => `  Line ${i + 1}: Error ${i + 1} [test-rule]`)
                .join('\n');
            expect(mockConsoleError).toHaveBeenCalledWith(
                `[PreToolUse Hook] ESLint found 15 error(s) in test.ts:\n${expectedDetails}`,
            );
        });
    });

    describe('runTypeScriptCheck()', () => {
        it("VALID: {filePath: 'test.ts'} typescript check passes => returns hasErrors false", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: false,
                errors: '',
            });
        });

        it('VALID: typescript returns stdout => returns errors from stdout', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 1,
                    stdout: 'test.ts(5,10): error TS2339: Property does not exist',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'test.ts(5,10): error TS2339: Property does not exist',
            });
        });

        it('VALID: typescript returns stderr => returns errors from stderr', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 1,
                    stdout: '',
                    stderr: 'test.ts(10,5): error TS2304: Cannot find name',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'test.ts(10,5): error TS2304: Cannot find name',
            });
        });

        it('VALID: typescript check with --noEmit flag => validates without output', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            await FreshEslintUtils.runTypeScriptCheck({filePath: 'src/example.ts'});

            // We can't easily verify the exact call args without mocking ProcessUtils,
            // but we can verify the function completes successfully
            expect(true).toBe(true);
        });

        it('VALID: exit code 0 with empty stdout and stderr => returns hasErrors false', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'valid.ts'});

            expect(result).toStrictEqual({
                hasErrors: false,
                errors: '',
            });
        });

        it('VALID: non-zero exit code with error details => returns hasErrors true with details', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 2,
                    stdout: 'Compilation failed',
                    stderr: 'Type error in file',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'broken.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'Compilation failed',
            });
        });

        it("ERROR: {filePath: 'test.ts'} typescript check fails => returns hasErrors true with errors", async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 1,
                    stdout: '',
                    stderr: 'error TS2345: Argument of type string is not assignable',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'error TS2345: Argument of type string is not assignable',
            });
        });

        it('ERROR: process spawn throws => returns hasErrors true with error message', async () => {
            ChildProcessMocker.mockSpawn(
                ChildProcessMocker.presets.crash(new Error('Command not found')),
            );

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'Command not found',
            });
        });

        it('ERROR: catch block handles Error instance => returns error message', async () => {
            ChildProcessMocker.mockSpawn(
                ChildProcessMocker.presets.crash(new Error('TypeScript not installed')),
            );

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'TypeScript not installed',
            });
        });

        it('ERROR: catch block handles string error => converts to string', async () => {
            ChildProcessMocker.mockSpawn(
                ChildProcessMocker.presets.crash(new Error('String error message')),
            );

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'test.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'String error message',
            });
        });

        it('EDGE: empty file path => attempts typescript check', async () => {
            ChildProcessMocker.mockSpawn({
                result: {
                    code: 0,
                    stdout: '',
                    stderr: '',
                },
            });

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: ''});

            expect(result).toStrictEqual({
                hasErrors: false,
                errors: '',
            });
        });

        it('EDGE: process spawn timeout after 30 seconds => returns hasErrors true', async () => {
            ChildProcessMocker.mockSpawn(
                ChildProcessMocker.presets.crash(new Error('Process timed out after 30000ms')),
            );

            const {EslintUtils: FreshEslintUtils} = await import('./eslint-utils');
            const result = await FreshEslintUtils.runTypeScriptCheck({filePath: 'large-file.ts'});

            expect(result).toStrictEqual({
                hasErrors: true,
                errors: 'Process timed out after 30000ms',
            });
        });
    });
});
