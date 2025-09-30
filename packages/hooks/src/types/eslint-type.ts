export interface EslintMessage {
  line: number;
  message: string;
  severity: number;
  ruleId?: string;
}

export interface EslintResult {
  messages: EslintMessage[];
  output?: string;
}

export type FullFileContentChanges = Record<string, string>;
