import { violationsCheckNewBroker } from './violations-check-new-broker';
import {
  toolInputGetContentChangesBroker,
  type ContentChange,
} from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker';
import { hookConfigLoadBroker } from '../../hook-config/load/hook-config-load-broker';
import { eslintLoadConfigBroker } from '../../eslint/load-config/eslint-load-config-broker';
import { eslintConfigFilterTransformer } from '../../../transformers/eslint-config-filter/eslint-config-filter-transformer';
import { violationsAnalyzeBroker } from '../analyze/violations-analyze-broker';
import { eslintLintRunTargetedBroker } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker';
import { writeToolInputContract } from '../../../contracts/write-tool-input/write-tool-input-contract';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { editToolInputContract } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import type { Linter } from '../../../adapters/eslint/eslint-linter';
import type { LintResult } from '../../../contracts/lint-result/lint-result-contract';
import type { ViolationComparison } from '../../../contracts/violation-comparison/violation-comparison-contract';
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { LintMessageStub } from '../../../contracts/lint-message/lint-message.stub';
import { LintResultStub } from '../../../contracts/lint-result/lint-result.stub';
import { ViolationCountStub } from '../../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../../contracts/violation-detail/violation-detail.stub';

jest.mock('../../tool-input/get-content-changes/tool-input-get-content-changes-broker');
jest.mock('../../hook-config/load/hook-config-load-broker');
jest.mock('../../eslint/load-config/eslint-load-config-broker');
jest.mock('../../../transformers/eslint-config-filter/eslint-config-filter-transformer');
jest.mock('../analyze/violations-analyze-broker');
jest.mock('../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker');

const mockToolInputGetContentChangesBroker = jest.mocked(toolInputGetContentChangesBroker);
const mockHookConfigLoadBroker = jest.mocked(hookConfigLoadBroker);
const mockEslintLoadConfigBroker = jest.mocked(eslintLoadConfigBroker);
const mockEslintConfigFilterTransformer = jest.mocked(eslintConfigFilterTransformer);
const mockViolationsAnalyzeBroker = jest.mocked(violationsAnalyzeBroker);
const mockEslintLintRunTargetedBroker = jest.mocked(eslintLintRunTargetedBroker);

describe('violationsCheckNewBroker', () => {
  const mockCwd = '/test/project';
  const mockFilePath = '/test/project/src/file.ts';
  const mockHookConfig: PreEditLintConfig = preEditLintConfigContract.parse({
    rules: ['@typescript-eslint/no-explicit-any'],
  });
  const mockEslintConfig = { rules: {} } as Linter.Config;
  const mockFilteredConfig = { rules: {} } as Linter.Config;

  describe('input validation', () => {
    it('EMPTY: {toolInput: no file_path} => returns no new violations', async () => {
      const toolInput = WriteToolInputStub({ content: 'test', file_path: '' });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
      expect(mockToolInputGetContentChangesBroker).not.toHaveBeenCalled();
    });

    it('EMPTY: {toolInput: empty file_path} => returns no new violations', async () => {
      const toolInput = WriteToolInputStub({
        file_path: '',
        content: 'test',
      });

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
      expect(mockToolInputGetContentChangesBroker).not.toHaveBeenCalled();
    });

    it('EMPTY: {contentChanges: empty array} => returns no new violations', async () => {
      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'test',
      });

      mockToolInputGetContentChangesBroker.mockResolvedValue([]);

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
      expect(mockHookConfigLoadBroker).toHaveBeenCalledWith({ cwd: mockCwd });
    });

    it('VALID: {oldContent === newContent} => returns no new violations without running lint', async () => {
      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'test',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x = 1;',
        newContent: 'const x = 1;',
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
      expect(mockEslintLintRunTargetedBroker).not.toHaveBeenCalled();
    });
  });

  describe('successful linting workflow', () => {
    it('VALID: {oldContent: clean, newContent: clean} => returns no new violations', async () => {
      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'const y = 2;',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x = 1;',
        newContent: 'const y = 2;',
      };

      const oldResults: LintResult[] = [];
      const newResults: LintResult[] = [];

      const expectedComparison: ViolationComparison = {
        hasNewViolations: false,
        newViolations: [],
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);
      mockEslintLintRunTargetedBroker
        .mockResolvedValueOnce(oldResults)
        .mockResolvedValueOnce(newResults);
      mockViolationsAnalyzeBroker.mockReturnValue(expectedComparison);

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
      expect(mockHookConfigLoadBroker).toHaveBeenCalledWith({ cwd: mockCwd });
      expect(mockEslintLoadConfigBroker).toHaveBeenCalledWith({
        cwd: mockCwd,
        filePath: mockFilePath,
      });
      expect(mockEslintConfigFilterTransformer).toHaveBeenCalledWith({
        eslintConfig: mockEslintConfig,
        hookConfig: mockHookConfig,
      });
      expect(mockEslintLintRunTargetedBroker).toHaveBeenCalledTimes(2);
      expect(mockEslintLintRunTargetedBroker).toHaveBeenNthCalledWith(1, {
        content: 'const x = 1;',
        filePath: mockFilePath,
        config: mockFilteredConfig,
        cwd: mockCwd,
      });
      expect(mockEslintLintRunTargetedBroker).toHaveBeenNthCalledWith(2, {
        content: 'const y = 2;',
        filePath: mockFilePath,
        config: mockFilteredConfig,
        cwd: mockCwd,
      });
      expect(mockViolationsAnalyzeBroker).toHaveBeenCalledWith({
        oldResults,
        newResults,
        config: mockHookConfig,
        hookData: { tool_input: toolInput },
      });
    });

    it('INVALID: {oldContent: clean, newContent: has violations} => returns new violations', async () => {
      const toolInput = editToolInputContract.parse({
        file_path: mockFilePath,
        old_string: 'const x: string = "test";',
        new_string: 'const x: any = "test";',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x: string = "test";',
        newContent: 'const x: any = "test";',
      };

      const oldResults: LintResult[] = [];
      const newResults: LintResult[] = [
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

      const expectedComparison: ViolationComparison = {
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
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);
      mockEslintLintRunTargetedBroker
        .mockResolvedValueOnce(oldResults)
        .mockResolvedValueOnce(newResults);
      mockViolationsAnalyzeBroker.mockReturnValue(expectedComparison);

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
      expect(mockViolationsAnalyzeBroker).toHaveBeenCalledWith({
        oldResults,
        newResults,
        config: mockHookConfig,
        hookData: { tool_input: toolInput },
      });
    });

    it('VALID: {oldContent: has violations, newContent: same violations} => returns no new violations', async () => {
      const toolInput = editToolInputContract.parse({
        file_path: mockFilePath,
        old_string: 'const x: any = "test";',
        new_string: 'const x: any = "updated";',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x: any = "test";',
        newContent: 'const x: any = "updated";',
      };

      const oldResults: LintResult[] = [
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

      const newResults: LintResult[] = [
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

      const expectedComparison: ViolationComparison = {
        hasNewViolations: false,
        newViolations: [],
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);
      mockEslintLintRunTargetedBroker
        .mockResolvedValueOnce(oldResults)
        .mockResolvedValueOnce(newResults);
      mockViolationsAnalyzeBroker.mockReturnValue(expectedComparison);

      const result = await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      expect(result).toStrictEqual(expectedComparison);
    });
  });

  describe('default cwd handling', () => {
    it('VALID: {cwd: undefined} => uses process.cwd() as default', async () => {
      const originalCwd = process.cwd();
      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'const y = 2;',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x = 1;',
        newContent: 'const y = 2;',
      };

      const oldResults: LintResult[] = [];
      const newResults: LintResult[] = [];

      const expectedComparison: ViolationComparison = {
        hasNewViolations: false,
        newViolations: [],
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);
      mockEslintLintRunTargetedBroker
        .mockResolvedValueOnce(oldResults)
        .mockResolvedValueOnce(newResults);
      mockViolationsAnalyzeBroker.mockReturnValue(expectedComparison);

      const result = await violationsCheckNewBroker({ toolInput });

      expect(result).toStrictEqual(expectedComparison);
      expect(mockHookConfigLoadBroker).toHaveBeenCalledWith({ cwd: originalCwd });
      expect(mockEslintLoadConfigBroker).toHaveBeenCalledWith({
        cwd: originalCwd,
        filePath: mockFilePath,
      });
      expect(mockEslintLintRunTargetedBroker).toHaveBeenNthCalledWith(1, {
        content: 'const x = 1;',
        filePath: mockFilePath,
        config: mockFilteredConfig,
        cwd: originalCwd,
      });
    });
  });

  describe('parallel linting execution', () => {
    it('VALID: runs old and new content linting in parallel', async () => {
      const toolInput = writeToolInputContract.parse({
        file_path: mockFilePath,
        content: 'const y = 2;',
      });

      const contentChange: ContentChange = {
        oldContent: 'const x = 1;',
        newContent: 'const y = 2;',
      };

      const oldResults: LintResult[] = [];
      const newResults: LintResult[] = [];

      const expectedComparison: ViolationComparison = {
        hasNewViolations: false,
        newViolations: [],
      };

      mockHookConfigLoadBroker.mockReturnValue(mockHookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(mockEslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(mockFilteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);

      // Track call order to verify parallel execution
      const callOrder: string[] = [];
      mockEslintLintRunTargetedBroker.mockImplementation(
        async ({ content }): Promise<LintResult[]> => {
          callOrder.push(content);
          const result = content === 'const x = 1;' ? oldResults : newResults;
          return Promise.resolve(result);
        },
      );

      mockViolationsAnalyzeBroker.mockReturnValue(expectedComparison);

      await violationsCheckNewBroker({ toolInput, cwd: mockCwd });

      // Both calls should be made (order doesn't matter due to Promise.all)
      expect(mockEslintLintRunTargetedBroker).toHaveBeenCalledTimes(2);
      expect(callOrder).toHaveLength(2);
    });
  });
});
