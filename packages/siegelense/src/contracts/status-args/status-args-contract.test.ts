import { statusArgsContract } from './status-args-contract';
import { StatusArgsStub } from './status-args.stub';

describe('statusArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId: null, human: false} => the fleet-JSON default parses', () => {
      const args = StatusArgsStub({ instanceId: null, human: false });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: null, human: false });
    });

    it('VALID: {instanceId: "inst_7f3a9c21", human: true} => the single-instance human form parses', () => {
      const args = StatusArgsStub({ instanceId: 'inst_7f3a9c21', human: true });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', human: true });
    });

    it('VALID: {instanceId: null, branch: "feat/my-branch", since: "1h", human: true} => branch and since filters parse', () => {
      const args = StatusArgsStub({
        instanceId: null,
        branch: 'feat/my-branch',
        since: '1h',
        human: true,
      });

      const result = statusArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: null,
        branch: 'feat/my-branch',
        since: '1h',
        human: true,
      });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId, because .nullable() is not .optional()', () => {
      const result = statusArgsContract.safeParse({ human: false });

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

    it('INVALID: {missing human} => raises exactly one issue, scoped to human', () => {
      const result = statusArgsContract.safeParse({ instanceId: null });

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

    it('INVALID: {instanceId: "not-an-instance-id"} => throws for a malformed instance id', () => {
      expect(() =>
        statusArgsContract.parse({ instanceId: 'not-an-instance-id', human: false }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {since: "2h"} => throws for invalid enum value', () => {
      expect(() =>
        statusArgsContract.parse({
          instanceId: null,
          since: '2h' as never,
          human: false,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {extra key "verbose"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        statusArgsContract.parse({
          instanceId: null,
          human: false,
          verbose: true,
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
