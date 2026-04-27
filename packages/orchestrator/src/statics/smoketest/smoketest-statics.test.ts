import { smoketestStatics } from './smoketest-statics';

describe('smoketestStatics', () => {
  it('VALID: {smoketestStatics} => exposes expected fixed identifiers', () => {
    expect(smoketestStatics).toStrictEqual({
      questId: '00000000-0000-0000-0000-000000000000',
      defaultTimeoutMs: 60000,
      orchestrationCaseTimeoutMs: 300000,
    });
  });
});
