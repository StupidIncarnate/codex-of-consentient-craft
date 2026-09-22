import { flowOffMapSignoffContract } from './flow-off-map-signoff-contract';
import { FlowOffMapSignoffStub } from './flow-off-map-signoff.stub';

describe('flowOffMapSignoffContract', () => {
  describe('valid input', () => {
    it('VALID: {default stub} => parses to the bare family id', () => {
      expect(FlowOffMapSignoffStub()).toStrictEqual({ id: 'concurrency' });
    });

    it('VALID: {id: "staleness"} => parses to the specified family id', () => {
      expect(FlowOffMapSignoffStub({ id: 'staleness' })).toStrictEqual({ id: 'staleness' });
    });
  });

  describe('extra keys', () => {
    it('VALID: {extra property supplied} => stripped by schema', () => {
      expect(
        flowOffMapSignoffContract.parse({
          id: 'concurrency',
          extra: 'stripped',
        }),
      ).toStrictEqual({ id: 'concurrency' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "timezones"} => throws, because the id is a probe family and the family list is closed', () => {
      expect(() => FlowOffMapSignoffStub({ id: 'timezones' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {id missing entirely} => throws, because a Record-shaped entry with no id would be merged wholesale', () => {
      expect(() => flowOffMapSignoffContract.parse({})).toThrow(/Required/u);
    });
  });
});
