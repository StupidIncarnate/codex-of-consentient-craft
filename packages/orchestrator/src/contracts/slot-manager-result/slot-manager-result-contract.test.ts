import { WorkItemIdStub } from '../work-item-id/work-item-id.stub';
import { slotManagerResultContract } from './slot-manager-result-contract';
import { SlotManagerResultIncompleteStub, SlotManagerResultStub } from './slot-manager-result.stub';

describe('slotManagerResultContract', () => {
  describe('completed: true', () => {
    it('VALID: {completed: true} => parses successfully', () => {
      const result = slotManagerResultContract.parse({
        completed: true,
      });

      expect(result).toStrictEqual({
        completed: true,
      });
    });

    it('VALID: {SlotManagerResultStub()} => creates completed result', () => {
      const result = SlotManagerResultStub();

      expect(result).toStrictEqual({
        completed: true,
      });
    });
  });

  describe('completed: false', () => {
    it('VALID: {completed: false, incompleteIds, failedIds} => parses successfully', () => {
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const result = slotManagerResultContract.parse({
        completed: false,
        incompleteIds: [workItemId],
        failedIds: [],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: ['work-item-1'],
        failedIds: [],
      });
    });

    it('VALID: {completed: false, empty arrays} => parses with empty arrays', () => {
      const result = slotManagerResultContract.parse({
        completed: false,
        incompleteIds: [],
        failedIds: [],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: [],
        failedIds: [],
      });
    });

    it('VALID: {SlotManagerResultIncompleteStub()} => creates incomplete result', () => {
      const result = SlotManagerResultIncompleteStub();

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: ['work-item-0'],
        failedIds: [],
      });
    });

    it('VALID: {completed: false, with failedIds} => parses successfully', () => {
      const failedId = WorkItemIdStub({ value: 'failed-item-1' });
      const result = slotManagerResultContract.parse({
        completed: false,
        incompleteIds: [],
        failedIds: [failedId],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: [],
        failedIds: ['failed-item-1'],
      });
    });
  });

  describe('invalid cases', () => {
    it('INVALID_COMPLETED: {missing completed} => throws discriminator error', () => {
      expect(() => slotManagerResultContract.parse({})).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID_COMPLETED: {completed: "invalid"} => throws discriminator error', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: 'invalid' as never,
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID_INCOMPLETE_IDS: {completed: false, missing incompleteIds} => throws required error', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
          failedIds: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_FAILED_IDS: {completed: false, missing failedIds} => throws required error', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
          incompleteIds: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
