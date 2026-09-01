import { flowOffMapSignoffContract } from './flow-off-map-signoff-contract';
import { FlowOffMapSignoffStub } from './flow-off-map-signoff.stub';
import { SignoffStub } from '../signoff/signoff.stub';

describe('flowOffMapSignoffContract', () => {
  describe('family signed', () => {
    it('VALID: {siegemasterSignoff present} => parses the complete entry', () => {
      expect(
        FlowOffMapSignoffStub({
          siegemasterSignoff: SignoffStub({
            evidence: 'two concurrent sends produced one row, not two',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            at: '2026-01-02T00:00:00.000Z',
          }),
        }),
      ).toStrictEqual({
        id: 'concurrency',
        siegemasterSignoff: {
          verdict: 'confirmed',
          evidence: 'two concurrent sends produced one row, not two',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        },
      });
    });

    it('VALID: {unconfirmable siegemasterSignoff} => keeps the question beside the evidence', () => {
      expect(
        FlowOffMapSignoffStub({
          id: 'staleness',
          siegemasterSignoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'the cache TTL is 24h and this session cannot advance the clock',
            toSettle: 'Inject the TTL so a stale read is reachable, then walk it.',
          }),
        }),
      ).toStrictEqual({
        id: 'staleness',
        siegemasterSignoff: {
          verdict: 'unconfirmable',
          evidence: 'the cache TTL is 24h and this session cannot advance the clock',
          toSettle: 'Inject the TTL so a stale read is reachable, then walk it.',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('family with no track signed', () => {
    it('EMPTY: {sign-off absent} => parses to the bare family id, the shape an unstarted family carries', () => {
      expect(FlowOffMapSignoffStub()).toStrictEqual({ id: 'concurrency' });
    });
  });

  describe('tracks with no column here', () => {
    it('VALID: {flowriderSignoff supplied} => stripped, because off-map is siegemaster-only and no other track can fill one', () => {
      expect(
        flowOffMapSignoffContract.parse({
          id: 'concurrency',
          flowriderSignoff: SignoffStub(),
        }),
      ).toStrictEqual({ id: 'concurrency' });
    });

    it('VALID: {codeweaverSignoff supplied} => stripped for the same reason', () => {
      expect(
        flowOffMapSignoffContract.parse({
          id: 'perf',
          codeweaverSignoff: SignoffStub(),
        }),
      ).toStrictEqual({ id: 'perf' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "timezones"} => throws, because the id is a probe family and the family list is closed', () => {
      expect(() => FlowOffMapSignoffStub({ id: 'timezones' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {id missing entirely} => throws, because a Record-shaped entry with no id would be merged wholesale', () => {
      expect(() => flowOffMapSignoffContract.parse({ siegemasterSignoff: SignoffStub() })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {siegemasterSignoff with an empty evidence string} => throws', () => {
      expect(() =>
        flowOffMapSignoffContract.parse({
          id: 'concurrency',
          siegemasterSignoff: {
            verdict: 'confirmed',
            evidence: '',
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            at: '2026-01-01T00:00:00.000Z',
          },
        }),
      ).toThrow(/String must contain at least 1 character/u);
    });
  });
});
