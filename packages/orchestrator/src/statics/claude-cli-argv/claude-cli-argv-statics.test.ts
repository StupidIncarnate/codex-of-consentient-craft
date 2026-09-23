import { claudeCliArgvStatics } from './claude-cli-argv-statics';

describe('claudeCliArgvStatics', () => {
  it('VALID: exported value => pins the Linux single-argv ceiling and the $ARGUMENTS message budget', () => {
    expect(claudeCliArgvStatics).toStrictEqual({
      limits: { maxArgBytes: 131_072 },
      budgets: { userMessageBytes: 50_000 },
    });
  });

  it('VALID: budgets.userMessageBytes => leaves room under limits.maxArgBytes for a template to occupy', () => {
    expect(claudeCliArgvStatics.budgets.userMessageBytes).toBeLessThan(
      claudeCliArgvStatics.limits.maxArgBytes,
    );
  });
});
