import { NormalizedStreamLineContentItemStub } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item.stub';
import { NormalizedStreamLineStub } from '../../contracts/normalized-stream-line/normalized-stream-line.stub';
import { contentItemAgentIdAtIndexTransformer } from './content-item-agent-id-at-index-transformer';

describe('contentItemAgentIdAtIndexTransformer', (): void => {
  it('VALID: {entry with agentId stamped on content[0]} => returns the agentId string', (): void => {
    const item = NormalizedStreamLineContentItemStub({
      type: 'tool_use',
      id: 'toolu_01',
      name: 'Task',
      agentId: 'toolu_01',
    } as Parameters<typeof NormalizedStreamLineContentItemStub>[0]);
    const entry = NormalizedStreamLineStub({
      message: { role: 'assistant', content: [item] },
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdAtIndexTransformer({ entry, index: 0 });

    expect(result).toBe('toolu_01');
  });

  it('EMPTY: {missing agentId} => returns undefined', (): void => {
    const item = NormalizedStreamLineContentItemStub({
      type: 'tool_use',
      id: 'toolu_02',
      name: 'Task',
    } as Parameters<typeof NormalizedStreamLineContentItemStub>[0]);
    const entry = NormalizedStreamLineStub({
      message: { role: 'assistant', content: [item] },
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdAtIndexTransformer({ entry, index: 0 });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {entry without message} => returns undefined', (): void => {
    const entry = NormalizedStreamLineStub({
      message: undefined,
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdAtIndexTransformer({ entry, index: 0 });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {non-object entry} => returns undefined', (): void => {
    const result = contentItemAgentIdAtIndexTransformer({ entry: null, index: 0 });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {index out of range} => returns undefined', (): void => {
    const entry = NormalizedStreamLineStub({
      message: { role: 'assistant', content: [] },
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdAtIndexTransformer({ entry, index: 5 });

    expect(result).toBe(undefined);
  });
});
