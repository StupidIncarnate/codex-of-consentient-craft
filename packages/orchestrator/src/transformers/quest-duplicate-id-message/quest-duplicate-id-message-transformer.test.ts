import { FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDuplicateIdMessageTransformer } from './quest-duplicate-id-message-transformer';

describe('questDuplicateIdMessageTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique flow ids} => returns undefined', () => {
      const result = questDuplicateIdMessageTransformer({
        updates: {
          flows: [FlowStub({ id: 'flow-a' }), FlowStub({ id: 'flow-b' })],
        },
      });

      expect(result).toBeUndefined();
    });
  });

  describe('top-level duplicates', () => {
    it('VALID: {duplicate flow ids} => returns error message', () => {
      const result = questDuplicateIdMessageTransformer({
        updates: {
          flows: [FlowStub({ id: 'flow-a' }), FlowStub({ id: 'flow-a' })],
        },
      });

      expect(result).toMatch(/^Duplicate ID "flow-a" in flows/u);
    });
  });

  describe('nested duplicates', () => {
    it('VALID: {duplicate node ids within flow} => returns error with context', () => {
      const node1 = FlowNodeStub({ id: 'login-page', label: 'First' });
      const node2 = FlowNodeStub({ id: 'login-page', label: 'Second' });
      const result = questDuplicateIdMessageTransformer({
        updates: {
          flows: [FlowStub({ id: 'quest-deletion-from-list', nodes: [node1, node2] })],
        },
      });

      expect(result).toMatch(
        /^Duplicate ID "login-page" in flows\[quest-deletion-from-list\]\.nodes/u,
      );
    });
  });

  describe('non-array fields', () => {
    it('VALID: {scalar fields only} => returns undefined', () => {
      const result = questDuplicateIdMessageTransformer({
        updates: { questId: 'test', status: 'created' },
      });

      expect(result).toBeUndefined();
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {updates: {}} => returns undefined', () => {
      const result = questDuplicateIdMessageTransformer({ updates: {} });

      expect(result).toBeUndefined();
    });
  });
});
