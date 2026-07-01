import { TaskNotificationChatEntryStub } from '@dungeonmaster/shared/contracts';

import { chatEntryGroupContract } from './chat-entry-group-contract';
import { SingleGroupStub, SubagentChainGroupStub } from './chat-entry-group.stub';

describe('chatEntryGroupContract', () => {
  describe('single group', () => {
    it('VALID: {kind: single, entry: user} => parses to identical single-group structure', () => {
      const stub = SingleGroupStub();

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('subagent chain group', () => {
    it('VALID: {kind: subagent-chain, innerGroups: [SingleGroup, SingleGroup]} => parses to identical chain structure', () => {
      const stub = SubagentChainGroupStub();

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });

    it('VALID: {innerGroups: [SubagentChainGroup]} => parses to identical nested chain structure', () => {
      const inner = SubagentChainGroupStub({ agentId: 'agent-002' });
      const outer = SubagentChainGroupStub({ innerGroups: [inner] });

      expect(chatEntryGroupContract.parse(outer)).toStrictEqual(outer);
    });

    it('VALID: 3-level nested chain => parses to identical depth-3 structure', () => {
      const depth3 = SubagentChainGroupStub({ agentId: 'agent-003' });
      const depth2 = SubagentChainGroupStub({ agentId: 'agent-002', innerGroups: [depth3] });
      const depth1 = SubagentChainGroupStub({ agentId: 'agent-001', innerGroups: [depth2] });

      expect(chatEntryGroupContract.parse(depth1)).toStrictEqual(depth1);
    });

    it('VALID: {innerGroups: []} => parses to chain structure with empty innerGroups', () => {
      const stub = SubagentChainGroupStub({ innerGroups: [] });

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });

    it('VALID: {taskToolUse: null} => parses to identical chain structure with null taskToolUse', () => {
      const stub = SubagentChainGroupStub({ taskToolUse: null });

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });

    it('VALID: {taskNotification: TaskNotificationEntry} => parses chain with non-null taskNotification', () => {
      const stub = SubagentChainGroupStub({ taskNotification: TaskNotificationChatEntryStub() });

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });

    it('VALID: {contextTokens: 29448} => parses chain with non-null contextTokens', () => {
      const stub = SubagentChainGroupStub({ contextTokens: 29448 });

      expect(chatEntryGroupContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {kind: "unknown"} => throws validation error', () => {
      expect(() => {
        chatEntryGroupContract.parse({ kind: 'unknown' });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {kind: "single", missing entry} => throws validation error', () => {
      expect(() => {
        chatEntryGroupContract.parse({ kind: 'single' });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {kind: "subagent-chain", agentId: ""} => throws validation error', () => {
      expect(() => {
        chatEntryGroupContract.parse({
          kind: 'subagent-chain',
          agentId: '',
          description: 'Run tests',
          taskToolUse: null,
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
          innerGroups: [],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {kind: "subagent-chain", missing innerGroups} => throws validation error', () => {
      expect(() => {
        chatEntryGroupContract.parse({
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse: null,
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        });
      }).toThrow(/Invalid input/u);
    });
  });
});
