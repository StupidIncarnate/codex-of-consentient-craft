export type RuleConfig = {
  rule: string;
  displayName?: string;
  message?: string | ((hookData: unknown) => string);
};

export type PreEditLintConfig = {
  rules: (string | RuleConfig)[];
};

export type QuestmaestroHooksConfig = {
  preEditLint?: PreEditLintConfig;
};
