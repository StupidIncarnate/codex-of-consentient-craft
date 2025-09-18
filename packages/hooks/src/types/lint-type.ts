export type LintMessage = {
  line: number;
  column: number;
  message: string;
  severity: number; // 1 = warn, 2 = error
  ruleId?: string;
};

export type LintResult = {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
};

export type ViolationDetail = {
  ruleId: string;
  line: number;
  column: number;
  message: string;
};

export type ViolationCount = {
  ruleId: string;
  count: number;
  details: ViolationDetail[];
};

export type ViolationComparison = {
  hasNewViolations: boolean;
  newViolations: ViolationCount[];
  message?: string;
};
