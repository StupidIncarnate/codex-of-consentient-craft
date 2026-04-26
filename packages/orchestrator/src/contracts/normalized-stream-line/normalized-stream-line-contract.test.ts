import { normalizedStreamLineContract } from './normalized-stream-line-contract';
import { NormalizedStreamLineStub } from './normalized-stream-line.stub';

describe('normalizedStreamLineContract', (): void => {
  it('VALID: {default stub} => parses successfully', (): void => {
    const parsed = NormalizedStreamLineStub();

    expect(parsed.type).toBe('assistant');
    expect(parsed.message?.role).toBe('assistant');
  });

  it('VALID: {extra unknown fields} => preserved via passthrough', (): void => {
    const result = normalizedStreamLineContract.parse({
      type: 'assistant',
      message: { role: 'assistant', content: [] },
      uuid: 'extra-uuid-not-in-schema',
    });

    expect((result as { uuid?: unknown }).uuid).toBe('extra-uuid-not-in-schema');
  });

  it('VALID: {parentToolUseId null} => allowed as nullable', (): void => {
    const result = normalizedStreamLineContract.parse({
      type: 'assistant',
      parentToolUseId: null,
    });

    expect(result.parentToolUseId).toBe(null);
  });

  it('VALID: {empty object} => parses with all optional fields absent', (): void => {
    const result = normalizedStreamLineContract.parse({});

    expect(result.type).toBe(undefined);
  });

  it('ERROR: {non-object root} => parse throws', (): void => {
    expect((): unknown => normalizedStreamLineContract.parse('not-an-object')).toThrow(
      /Expected object/u,
    );
  });
});
