/**
 * PURPOSE: Proxy for violations-check-new-broker that mocks all broker dependencies
 *
 * USAGE:
 * const proxy = violationsCheckNewBrokerProxy();
 * proxy.setupSuccess({ oldResults: [], newResults: [], comparison: {...} });
 * const result = await violationsCheckNewBroker({ toolInput, cwd });
 */

import { toolInputGetContentChangesBroker } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker';
import { hookConfigLoadBroker } from '../../hook-config/load/hook-config-load-broker';
import { eslintLoadConfigBroker } from '../../eslint/load-config/eslint-load-config-broker';
import { eslintConfigFilterTransformer } from '../../../transformers/eslint-config-filter/eslint-config-filter-transformer';
import { violationsAnalyzeBroker } from '../analyze/violations-analyze-broker';
import { eslintLintRunTargetedBroker } from '../../eslint/lint-run-targeted/eslint-lint-run-targeted-broker';
import type { ContentChange } from '../../tool-input/get-content-changes/tool-input-get-content-changes-broker';
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import type { LintResult } from '../../../contracts/lint-result/lint-result-contract';
import type { ViolationComparison } from '../../../contracts/violation-comparison/violation-comparison-contract';
import type { Linter } from 'eslint';

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

export const violationsCheckNewBrokerProxy = (): {
  setupSuccess: (params: {
    contentChanges: ContentChange[];
    hookConfig: PreEditLintConfig;
    eslintConfig: Linter.Config;
    filteredConfig: Linter.Config;
    oldResults: LintResult[];
    newResults: LintResult[];
    comparison: ViolationComparison;
  }) => void;
  setupEmptyContentChanges: () => void;
  setupIdenticalContent: (params: {
    contentChange: ContentChange;
    hookConfig: PreEditLintConfig;
    eslintConfig: Linter.Config;
    filteredConfig: Linter.Config;
  }) => void;
} => {
  return {
    setupSuccess: ({
      contentChanges,
      hookConfig,
      eslintConfig,
      filteredConfig,
      oldResults,
      newResults,
      comparison,
    }: {
      contentChanges: ContentChange[];
      hookConfig: PreEditLintConfig;
      eslintConfig: Linter.Config;
      filteredConfig: Linter.Config;
      oldResults: LintResult[];
      newResults: LintResult[];
      comparison: ViolationComparison;
    }): void => {
      mockHookConfigLoadBroker.mockReturnValue(hookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(eslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(filteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue(contentChanges);
      mockEslintLintRunTargetedBroker
        .mockResolvedValueOnce(oldResults)
        .mockResolvedValueOnce(newResults);
      mockViolationsAnalyzeBroker.mockReturnValue(comparison);
    },

    setupEmptyContentChanges: (): void => {
      mockToolInputGetContentChangesBroker.mockResolvedValue([]);
    },

    setupIdenticalContent: ({
      contentChange,
      hookConfig,
      eslintConfig,
      filteredConfig,
    }: {
      contentChange: ContentChange;
      hookConfig: PreEditLintConfig;
      eslintConfig: Linter.Config;
      filteredConfig: Linter.Config;
    }): void => {
      mockHookConfigLoadBroker.mockReturnValue(hookConfig);
      mockEslintLoadConfigBroker.mockResolvedValue(eslintConfig);
      mockEslintConfigFilterTransformer.mockReturnValue(filteredConfig);
      mockToolInputGetContentChangesBroker.mockResolvedValue([contentChange]);
    },
  };
};
