import { violationsCheckNewBroker } from './violations-check-new-broker';
import { violationsCheckNewBrokerProxy } from './violations-check-new-broker.proxy';
import { writeToolInputContract } from '../../../contracts/write-tool-input/write-tool-input-contract';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { editToolInputContract } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import type { Linter } from 'eslint';
import { preEditLintConfigContract } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { LintMessageStub } from '../../../contracts/lint-message/lint-message.stub';
import { LintResultStub } from '../../../contracts/lint-result/lint-result.stub';
import { ViolationCountStub } from '../../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../../contracts/violation-detail/violation-detail.stub';
import { ContentChangeStub } from '../../tool-input/get-content-changes/content-change.stub';
import { ViolationComparisonStub } from '../../../contracts/violation-comparison/violation-comparison.stub';

describe('violationsCheckNewBroker', () => {
  const mockCwd = '/test/project';
  const mockFilePath = '/test/project/src/file.ts';
  const mockHookConfig = preEditLintConfigContract.parse({
    rules: ['@typescript-eslint/no-explicit-any'],
  });
  const mockEslintConfig: Linter.Config = { rules: {} };
  const mockFilteredConfig: Linter.Config = { rules: {} };

  describe('input validation', () => {
    it('EMPTY: {toolInput: no file_path} => returns no new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const toolInput = WriteToolInputStub({ content: 'test', file_path: '' });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });

    it('EMPTY: {toolInput: empty file_path} => returns no new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: '',
        content: 'test',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });

    it('EMPTY: {contentChanges: empty array} => returns no new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      proxy.setupEmptyContentChanges();

      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'test',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });

    it('VALID: {oldContent === newContent} => returns no new violations without running lint', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const contentChange = ContentChangeStub({
        oldContent: 'const x = 1;',
        newContent: 'const x = 1;',
      });

      proxy.setupIdenticalContent({
        contentChange,
        hookConfig: mockHookConfig,
        eslintConfig: mockEslintConfig,
        filteredConfig: mockFilteredConfig,
      });

      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'test',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });
  });

  describe('successful linting workflow', () => {
    it('VALID: {oldContent: clean, newContent: clean} => returns no new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const contentChange = ContentChangeStub({
        oldContent: 'const x = 1;',
        newContent: 'const y = 2;',
      });

      const expectedComparison = ViolationComparisonStub({
        hasNewViolations: false,
        newViolations: [],
      });

      proxy.setupSuccess({
        contentChanges: [contentChange],
        hookConfig: mockHookConfig,
        eslintConfig: mockEslintConfig,
        filteredConfig: mockFilteredConfig,
        oldResults: [],
        newResults: [],
        comparison: expectedComparison,
      });

      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'const y = 2;',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
    });

    it('INVALID: {oldContent: clean, newContent: has violations} => returns new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const contentChange = ContentChangeStub({
        oldContent: 'const x: string = "test";',
        newContent: 'const x: any = "test";',
      });

      const newResults = [
        LintResultStub({
          filePath: mockFilePath,
          messages: [
            LintMessageStub({
              line: 1,
              column: 10,
              message: 'Unexpected any. Specify a different type.',
              severity: 2,
              ruleId: '@typescript-eslint/no-explicit-any',
            }),
          ],
          errorCount: 1,
          warningCount: 0,
        }),
      ];

      const expectedComparison = ViolationComparisonStub({
        hasNewViolations: true,
        newViolations: [
          ViolationCountStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            count: 1,
            details: [
              ViolationDetailStub({
                ruleId: '@typescript-eslint/no-explicit-any',
                line: 1,
                column: 10,
                message: 'Unexpected any. Specify a different type.',
              }),
            ],
          }),
        ],
        message: '🛑 New code quality violations detected',
      });

      proxy.setupSuccess({
        contentChanges: [contentChange],
        hookConfig: mockHookConfig,
        eslintConfig: mockEslintConfig,
        filteredConfig: mockFilteredConfig,
        oldResults: [],
        newResults,
        comparison: expectedComparison,
      });

      const toolInput = editToolInputContract.parse({
        file_path: mockFilePath,
        old_string: 'const x: string = "test";',
        new_string: 'const x: any = "test";',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
    });

    it('VALID: {oldContent: has violations, newContent: same violations} => returns no new violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const contentChange = ContentChangeStub({
        oldContent: 'const x: any = "test";',
        newContent: 'const x: any = "updated";',
      });

      const lintResult = LintResultStub({
        filePath: mockFilePath,
        messages: [
          LintMessageStub({
            line: 1,
            column: 10,
            message: 'Unexpected any. Specify a different type.',
            severity: 2,
            ruleId: '@typescript-eslint/no-explicit-any',
          }),
        ],
        errorCount: 1,
        warningCount: 0,
      });

      const expectedComparison = ViolationComparisonStub({
        hasNewViolations: false,
        newViolations: [],
      });

      proxy.setupSuccess({
        contentChanges: [contentChange],
        hookConfig: mockHookConfig,
        eslintConfig: mockEslintConfig,
        filteredConfig: mockFilteredConfig,
        oldResults: [lintResult],
        newResults: [lintResult],
        comparison: expectedComparison,
      });

      const toolInput = editToolInputContract.parse({
        file_path: mockFilePath,
        old_string: 'const x: any = "test";',
        new_string: 'const x: any = "updated";',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
    });
  });

  describe('default cwd handling', () => {
    it('VALID: {cwd: undefined} => uses process.cwd() as default', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      const contentChange = ContentChangeStub({
        oldContent: 'const x = 1;',
        newContent: 'const y = 2;',
      });

      const expectedComparison = ViolationComparisonStub({
        hasNewViolations: false,
        newViolations: [],
      });

      proxy.setupSuccess({
        contentChanges: [contentChange],
        hookConfig: mockHookConfig,
        eslintConfig: mockEslintConfig,
        filteredConfig: mockFilteredConfig,
        oldResults: [],
        newResults: [],
        comparison: expectedComparison,
      });

      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'const y = 2;',
      });

      const result = await violationsCheckNewBroker({ toolInput });

      expect(result).toStrictEqual(expectedComparison);
    });
  });
});
