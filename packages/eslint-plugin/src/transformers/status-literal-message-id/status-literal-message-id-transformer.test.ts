import { statusLiteralMessageIdTransformer } from './status-literal-message-id-transformer';

describe('statusLiteralMessageIdTransformer', () => {
  it('VALID: {kind: "quest"} => returns "questStatusLiteral"', () => {
    expect(statusLiteralMessageIdTransformer({ kind: 'quest' })).toBe('questStatusLiteral');
  });

  it('VALID: {kind: "workItem"} => returns "workItemStatusLiteral"', () => {
    expect(statusLiteralMessageIdTransformer({ kind: 'workItem' })).toBe('workItemStatusLiteral');
  });

  it('VALID: {kind: "ambiguous"} => returns "ambiguousStatusLiteral"', () => {
    expect(statusLiteralMessageIdTransformer({ kind: 'ambiguous' })).toBe('ambiguousStatusLiteral');
  });
});
