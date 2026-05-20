import {
  PreToolUseHookStub,
  PostToolUseHookStub,
} from '../../contracts/claude-settings/claude-settings.stub';
import { upsertDungeonmasterHookListTransformer } from './upsert-dungeonmaster-hook-list-transformer';

describe('upsertDungeonmasterHookListTransformer', () => {
  it('VALID: {existing has third-party + dungeonmaster, fresh has new dungeonmaster} => third-party kept, old dungeonmaster dropped, fresh appended', () => {
    const thirdParty = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'their-hook' }],
    });
    const oldDm = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-old' }],
    });
    const newDm = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-new' }],
    });

    const result = upsertDungeonmasterHookListTransformer({
      existing: [thirdParty, oldDm],
      fresh: [newDm],
    });

    expect(result).toStrictEqual([thirdParty, newDm]);
  });

  it('VALID: {existing empty, fresh has entries} => returns just fresh', () => {
    const newDm = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
    });

    const result = upsertDungeonmasterHookListTransformer({
      existing: [],
      fresh: [newDm],
    });

    expect(result).toStrictEqual([newDm]);
  });

  it('VALID: {existing has only third-party, fresh empty} => returns just existing', () => {
    const thirdParty = PreToolUseHookStub({
      hooks: [{ type: 'command', command: 'their-hook' }],
    });

    const result = upsertDungeonmasterHookListTransformer({
      existing: [thirdParty],
      fresh: [],
    });

    expect(result).toStrictEqual([thirdParty]);
  });

  it('EMPTY: {existing empty, fresh empty} => returns empty array', () => {
    const result = upsertDungeonmasterHookListTransformer({ existing: [], fresh: [] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {PostToolUse: existing has dungeonmaster, fresh has new} => fresh replaces dungeonmaster entry', () => {
    const oldDm = PostToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-old-post' }],
    });
    const newDm = PostToolUseHookStub({
      hooks: [{ type: 'command', command: 'dungeonmaster-post-ask-question' }],
    });

    const result = upsertDungeonmasterHookListTransformer({
      existing: [oldDm],
      fresh: [newDm],
    });

    expect(result).toStrictEqual([newDm]);
  });
});
