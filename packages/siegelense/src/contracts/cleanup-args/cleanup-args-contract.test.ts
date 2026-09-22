import { cleanupArgsContract } from './cleanup-args-contract';
import { CleanupArgsStub } from './cleanup-args.stub';

describe('cleanupArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {isJson: false} => the default human form parses', () => {
      const args = CleanupArgsStub();

      const result = cleanupArgsContract.parse(args);

      expect(result).toStrictEqual({ isJson: false });
    });

    it('VALID: {isJson: true} => the explicit JSON form parses', () => {
      const args = CleanupArgsStub({ isJson: true });

      const result = cleanupArgsContract.parse(args);

      expect(result).toStrictEqual({ isJson: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = cleanupArgsContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['isJson'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instanceId"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        cleanupArgsContract.parse({
          isJson: true,
          instanceId: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
