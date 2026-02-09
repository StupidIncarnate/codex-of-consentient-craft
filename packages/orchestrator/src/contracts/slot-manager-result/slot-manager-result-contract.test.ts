import { slotManagerResultContract } from './slot-manager-result-contract';
import { SlotManagerResultStub } from './slot-manager-result.stub';

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

  describe('invalid cases', () => {
    it('INVALID_COMPLETED: {missing completed} => throws invalid literal', () => {
      expect(() => slotManagerResultContract.parse({})).toThrow(/Invalid literal value/u);
    });

    it('INVALID_COMPLETED: {completed: false} => throws invalid literal', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID_COMPLETED: {completed: "invalid"} => throws invalid literal', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: 'invalid' as never,
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
