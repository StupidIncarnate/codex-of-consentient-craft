import type { Rule } from 'eslint';

export const RuleContextStub = (props: Partial<Rule.RuleContext> = {}): Rule.RuleContext => {
  const baseContext = {
    id: 'test-rule',
    options: [],
    settings: {},
    parserPath: '',
    languageOptions: {},
    filename: '/test/file.ts',
    physicalFilename: '/test/file.ts',
    cwd: '/test',
    report: jest.fn(),
    ...props,
  };

  return baseContext as Rule.RuleContext;
};
