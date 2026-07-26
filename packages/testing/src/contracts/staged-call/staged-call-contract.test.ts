import { stagedCallContract } from './staged-call-contract';
import { StagedCallStub } from './staged-call.stub';

describe('stagedCallContract', () => {
  describe('valid records', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const record = StagedCallStub();

      const result = stagedCallContract.parse(record);

      expect(result).toStrictEqual({
        args: [],
        impl: expect.any(Function),
        once: false,
        consumed: false,
      });
    });

    it('VALID: {args, once: true, consumed: true} => parses successfully', () => {
      const record = StagedCallStub({ args: ['/a/quest.json'], once: true, consumed: true });

      const result = stagedCallContract.parse(record);

      expect(result).toStrictEqual({
        args: ['/a/quest.json'],
        impl: expect.any(Function),
        once: true,
        consumed: true,
      });
    });
  });

  describe('invalid records', () => {
    it('INVALID: null => throws validation error', () => {
      expect(() => {
        return stagedCallContract.parse(null);
      }).toThrow(/Expected object/u);
    });

    it('INVALID: undefined => throws validation error', () => {
      expect(() => {
        return stagedCallContract.parse(undefined);
      }).toThrow(/Required/u);
    });

    it('INVALID: {impl: "not-a-function"} => throws validation error', () => {
      expect(() => {
        return stagedCallContract.parse({
          args: [],
          impl: 'not-a-function',
          once: false,
          consumed: false,
        });
      }).toThrow(/Expected function/u);
    });
  });
});
