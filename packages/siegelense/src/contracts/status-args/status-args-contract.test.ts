import { statusArgsContract } from './status-args-contract';
import { StatusArgsStub } from './status-args.stub';

describe('statusArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId: null, isJson: true} => the fleet-JSON default parses', () => {
      const args = StatusArgsStub({ instanceId: null, isJson: true });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: null, isJson: true });
    });

    it('VALID: {instanceId: "inst_7f3a9c21", isJson: false} => the single-instance human form parses', () => {
      const args = StatusArgsStub({ instanceId: 'inst_7f3a9c21', isJson: false });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', isJson: false });
    });

    it('VALID: {instanceId: null, branch: "feat/my-branch", since: "1h", isJson: false} => branch and since filters parse', () => {
      const args = StatusArgsStub({
        instanceId: null,
        branch: 'feat/my-branch',
        since: '1h',
        isJson: false,
      });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: null,
        branch: 'feat/my-branch',
        since: '1h',
        isJson: false,
      });
    });

    it('VALID: {instanceId: null, since: "beginning", isJson: false} => beginning parses', () => {
      const args = StatusArgsStub({
        instanceId: null,
        since: 'beginning',
        isJson: false,
      });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: null,
        since: 'beginning',
        isJson: false,
      });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId, because .nullable() is not .optional()', () => {
      const result = statusArgsContract.safeParse({ isJson: true });

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

    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = statusArgsContract.safeParse({ instanceId: null });

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

    it('INVALID: {instanceId: "not-an-instance-id"} => throws for a malformed instance id', () => {
      expect(() =>
        statusArgsContract.parse({ instanceId: 'not-an-instance-id', isJson: true }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {since: "2h"} => throws for invalid enum value', () => {
      expect(() =>
        statusArgsContract.parse({
          instanceId: null,
          since: '2h' as never,
          isJson: true,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {extra key "verbose"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        statusArgsContract.parse({
          instanceId: null,
          isJson: true,
          verbose: true,
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
