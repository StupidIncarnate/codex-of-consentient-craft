import { statusQueryContract } from './status-query-contract';
import { StatusQueryStub } from './status-query.stub';

describe('statusQueryContract', () => {
  describe('valid queries', () => {
    it('VALID: {instanceId: null} => the status {} fleet form parses', () => {
      const query = StatusQueryStub({ instanceId: null });

      const result = statusQueryContract.parse(query);

      expect(result).toStrictEqual({ instanceId: null });
    });

    it('VALID: {instanceId: "inst_7f3a9c21"} => the status { instance } single-instance form parses', () => {
      const query = StatusQueryStub({ instanceId: 'inst_7f3a9c21' });

      const result = statusQueryContract.parse(query);

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21' });
    });
  });

  describe('invalid queries', () => {
    it('INVALID: {missing instanceId} => throws Required, because .nullable() is not .optional()', () => {
      expect(() => statusQueryContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: "not-an-instance-id"} => throws for a malformed instance id', () => {
      expect(() => statusQueryContract.parse({ instanceId: 'not-an-instance-id' })).toThrow(
        /Instance id must look like/u,
      );
    });

    it('INVALID: {extra key "reason"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        statusQueryContract.parse({
          instanceId: null,
          reason: 'done testing',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
