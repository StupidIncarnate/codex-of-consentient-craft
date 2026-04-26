import { NormalizedStreamLineContentItemStub } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item.stub';
import { NormalizedStreamLineStub } from '../../contracts/normalized-stream-line/normalized-stream-line.stub';
import { contentItemAgentIdAtIndexTransformer } from '../content-item-agent-id-at-index/content-item-agent-id-at-index-transformer';
import { contentItemAgentIdSetAtIndexTransformer } from './content-item-agent-id-set-at-index-transformer';

describe('contentItemAgentIdSetAtIndexTransformer', (): void => {
  it('VALID: {entry with content[0]} => stamps agentId on the original reference', (): void => {
    const item = NormalizedStreamLineContentItemStub({
      type: 'tool_use',
      id: 'toolu_01',
      name: 'Task',
    } as Parameters<typeof NormalizedStreamLineContentItemStub>[0]);
    const entry = NormalizedStreamLineStub({
      message: { role: 'assistant', content: [item] },
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdSetAtIndexTransformer({ entry, index: 0, value: 'agent-x' });

    expect(result).toStrictEqual({ success: true });
    expect(contentItemAgentIdAtIndexTransformer({ entry, index: 0 })).toBe('agent-x');
  });

  it('EMPTY: {entry without message} => returns success:false, no mutation', (): void => {
    const entry = NormalizedStreamLineStub({
      message: undefined,
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdSetAtIndexTransformer({ entry, index: 0, value: 'agent-x' });

    expect(result).toStrictEqual({ success: false });
  });

  it('EMPTY: {non-object entry} => returns success:false', (): void => {
    const result = contentItemAgentIdSetAtIndexTransformer({ entry: null, index: 0, value: 'x' });

    expect(result).toStrictEqual({ success: false });
  });

  it('EMPTY: {index out of range} => returns success:false', (): void => {
    const entry = NormalizedStreamLineStub({
      message: { role: 'assistant', content: [] },
    } as Parameters<typeof NormalizedStreamLineStub>[0]);

    const result = contentItemAgentIdSetAtIndexTransformer({ entry, index: 5, value: 'x' });

    expect(result).toStrictEqual({ success: false });
  });
});
