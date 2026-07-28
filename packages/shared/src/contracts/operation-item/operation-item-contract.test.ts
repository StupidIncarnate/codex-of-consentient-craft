import { operationItemContract } from './operation-item-contract';
import { OperationItemStub } from './operation-item.stub';

describe('operationItemContract', () => {
  describe('valid items', () => {
    it('VALID: {role: codeweaver, status: pending} => parses with locked defaulting to false', () => {
      const item = OperationItemStub();

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'pending',
        locked: false,
        flowIds: [],
      });
    });

    it('VALID: {flowIds omitted} => defaults to empty, so a foundational item serving the whole spec is representable', () => {
      const item = OperationItemStub();

      expect(item.flowIds).toStrictEqual([]);
    });

    it('VALID: {flowIds: two flows} => parses the non-binding pointer at the flows the item lands on', () => {
      const item = OperationItemStub({
        text: 'web: the queue bar, the send, and comment display',
        flowIds: ['send-queued-comment-batch', 'view-persisted-comments'],
      });

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'web: the queue bar, the send, and comment display',
        status: 'pending',
        locked: false,
        flowIds: ['send-queued-comment-batch', 'view-persisted-comments'],
      });
    });

    it('VALID: {role: ward, wardMode: changed, locked: true} => parses ward item', () => {
      const item = OperationItemStub({
        role: 'ward',
        text: 'ward (changed)',
        status: 'in_progress',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        text: 'ward (changed)',
        status: 'in_progress',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });
    });

    it('VALID: {status: complete, text: pt 2 continuation} => parses continuation item', () => {
      const item = OperationItemStub({
        text: 'pt 2: core: config load+validate adapter',
        status: 'complete',
      });

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'pt 2: core: config load+validate adapter',
        status: 'complete',
        locked: false,
        flowIds: [],
      });
    });
  });

  describe('invalid items', () => {
    it('INVALID: {status: partial} => throws validation error', () => {
      expect(() => {
        return operationItemContract.parse({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'partial',
        });
      }).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {role: pathseeker} => throws validation error', () => {
      expect(() => {
        return operationItemContract.parse({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          role: 'pathseeker',
          text: 'plan the quest',
          status: 'pending',
        });
      }).toThrow(/invalid_enum_value/u);
    });

    it('EMPTY: {text: ""} => throws validation error', () => {
      expect(() => {
        return OperationItemStub({ text: '' as never });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {wardMode: partial-run} => throws validation error', () => {
      expect(() => {
        return OperationItemStub({ wardMode: 'partial-run' as never });
      }).toThrow(/invalid_enum_value/u);
    });
  });
});
