import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';

describe('fsStatAdapter', () => {
  it('VALID: {filepath: existing jsonl} => returns stats with mtimeMs', async () => {
    const proxy = fsStatAdapterProxy();
    const filepath = PathSegmentStub({ value: '/home/u/.claude/projects/-x/sess.jsonl' });
    proxy.returns({ stats: { mtimeMs: 1708473600000 } });

    const result = await fsStatAdapter({ filepath });

    expect(result).toStrictEqual({ mtimeMs: 1708473600000 });
  });

  it('ERROR: {filepath: missing} => throws error', async () => {
    const proxy = fsStatAdapterProxy();
    const filepath = PathSegmentStub({ value: '/missing/file.jsonl' });
    proxy.throws({ error: new Error('ENOENT') });

    await expect(fsStatAdapter({ filepath })).rejects.toThrow(/ENOENT/u);
  });
});
