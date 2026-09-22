import { killArgsContract } from './kill-args-contract';
import { KillArgsStub } from './kill-args.stub';

describe('killArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId: "inst_7f3a9c21"} => parses with isJson: false by default', () => {
      const args = KillArgsStub({ instanceId: 'inst_7f3a9c21' });

      const result = killArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', isJson: false });
    });

    it('VALID: {instanceId, isJson: true} => parses with isJson: true', () => {
      const args = KillArgsStub({ instanceId: 'inst_7f3a9c21', isJson: true });

      const result = killArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', isJson: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId', () => {
      const result = killArgsContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['instanceId'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {instanceId: "not-an-instance-id"} => throws for a malformed instance id', () => {
      expect(() => killArgsContract.parse({ instanceId: 'not-an-instance-id' })).toThrow(
        /Instance id must look like/u,
      );
    });

    it('INVALID: {extra key "force"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        killArgsContract.parse({
          instanceId: 'inst_7f3a9c21',
          force: true,
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
