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
