import { cleanupArgsContract } from './cleanup-args-contract';
import { CleanupArgsStub } from './cleanup-args.stub';

describe('cleanupArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {human: false} => the JSON default parses', () => {
      const args = CleanupArgsStub({ human: false });

      const result = cleanupArgsContract.parse(args);

      expect(result).toStrictEqual({ human: false });
    });

    it('VALID: {human: true} => the human-table form parses', () => {
      const args = CleanupArgsStub({ human: true });

      const result = cleanupArgsContract.parse(args);

      expect(result).toStrictEqual({ human: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing human} => raises exactly one issue, scoped to human', () => {
      const result = cleanupArgsContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['human'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instanceId"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        cleanupArgsContract.parse({
          human: false,
          instanceId: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
