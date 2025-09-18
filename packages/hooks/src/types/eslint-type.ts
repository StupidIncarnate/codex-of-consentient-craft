export type EslintMessage = {
  line: number;
  message: string;
  severity: number;
  ruleId?: string;
};

export type EslintResult = {
  messages: EslintMessage[];
  output?: string;
};

export type FullFileContentChanges = {
  [filePath: string]: string;
};
