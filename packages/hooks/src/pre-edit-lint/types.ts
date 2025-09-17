export interface LintMessage {
  line: number;
  column: number;
  message: string;
  severity: number; // 1 = warn, 2 = error
  ruleId?: string;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
}

export interface ViolationDetail {
  ruleId: string;
  line: number;
  column: number;
  message: string;
}

export interface ViolationCount {
  ruleId: string;
  count: number;
  details: ViolationDetail[];
}

export interface ViolationComparison {
  hasNewViolations: boolean;
  newViolations: ViolationCount[];
  message?: string;
}

export interface RuleConfig {
  rule: string;
  displayName?: string;
  message?: string | ((hookData: unknown) => string);
}

export interface PreEditLintConfig {
  rules: (string | RuleConfig)[];
}

export interface QuestmaestroHooksConfig {
  preEditLint?: PreEditLintConfig;
}
