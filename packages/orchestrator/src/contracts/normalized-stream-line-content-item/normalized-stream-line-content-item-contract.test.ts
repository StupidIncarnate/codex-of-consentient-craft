import { normalizedStreamLineContentItemContract } from './normalized-stream-line-content-item-contract';
import { NormalizedStreamLineContentItemStub } from './normalized-stream-line-content-item.stub';

describe('normalizedStreamLineContentItemContract', (): void => {
  it('VALID: {default text stub} => parses with text fields', (): void => {
    const item = NormalizedStreamLineContentItemStub();

    expect(item).toStrictEqual({
      type: 'text',
      text: 'Hello world',
    });
  });

  it('VALID: {tool_use shape} => parses with name+input+id', (): void => {
    const item = normalizedStreamLineContentItemContract.parse({
      type: 'tool_use',
      name: 'Task',
      id: 'toolu_01X',
      input: { question: 'why?' },
    });

    expect(item).toStrictEqual({
      type: 'tool_use',
      name: 'Task',
      id: 'toolu_01X',
      input: { question: 'why?' },
    });
  });

  it('VALID: {extra unknown fields} => preserved via passthrough', (): void => {
    const item = normalizedStreamLineContentItemContract.parse({
      type: 'text',
      foo: 'bar',
    });

    expect((item as { foo?: unknown }).foo).toBe('bar');
  });

  it('VALID: {empty object} => parses with all optional', (): void => {
    const item = normalizedStreamLineContentItemContract.parse({});

    expect(item.type).toBe(undefined);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => normalizedStreamLineContentItemContract.parse(42)).toThrow(
      /Expected object/u,
    );
  });
});
