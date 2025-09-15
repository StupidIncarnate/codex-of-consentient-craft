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

export interface ViolationCount {
  ruleId: string;
  count: number;
}

export interface ViolationComparison {
  hasNewViolations: boolean;
  newViolations: ViolationCount[];
  message?: string;
}

export interface PreEditLintConfig {
  rules: string[];
  messages?: Record<string, string | ((hookData: unknown) => string)>;
  timeout?: number;
  validateRules?: boolean;
}

export interface QuestmaestroHooksConfig {
  preEditLint?: PreEditLintConfig;
}
