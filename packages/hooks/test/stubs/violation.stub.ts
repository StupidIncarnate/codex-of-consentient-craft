import type {
  ViolationCount,
  ViolationDetail,
  LintMessage,
  LintResult,
} from '../../src/types/lint-type';

export const ViolationDetailStub = (overrides: Partial<ViolationDetail> = {}): ViolationDetail => ({
  ruleId: '@typescript-eslint/no-explicit-any',
  line: 1,
  column: 15,
  message: 'Unexpected any. Specify a different type.',
  ...overrides,
});

export const ViolationCountStub = (overrides: Partial<ViolationCount> = {}): ViolationCount => ({
  ruleId: '@typescript-eslint/no-explicit-any',
  count: 1,
  details: [ViolationDetailStub()],
  ...overrides,
});

export const LintMessageStub = (overrides: Partial<LintMessage> = {}): LintMessage => ({
  line: 1,
  column: 15,
  message: 'Unexpected any. Specify a different type.',
  severity: 2,
  ruleId: '@typescript-eslint/no-explicit-any',
  ...overrides,
});

export const LintResultStub = (overrides: Partial<LintResult> = {}): LintResult => ({
  filePath: '/test/file.ts',
  messages: [LintMessageStub()],
  errorCount: 1,
  warningCount: 0,
  ...overrides,
});
