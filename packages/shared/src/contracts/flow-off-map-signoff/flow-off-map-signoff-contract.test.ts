import { flowOffMapSignoffContract } from './flow-off-map-signoff-contract';
import { FlowOffMapSignoffStub } from './flow-off-map-signoff.stub';
import { SignoffStub } from '../signoff/signoff.stub';

describe('flowOffMapSignoffContract', () => {
  describe('family with both tracks signed', () => {
    it('VALID: {both sign-offs present} => parses the complete entry with each track on its own field', () => {
      expect(
        FlowOffMapSignoffStub({
          flowriderSignoff: SignoffStub(),
          siegemasterSignoff: SignoffStub({
            evidence: 'two concurrent sends produced one row, not two',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            at: '2026-01-02T00:00:00.000Z',
          }),
        }),
      ).toStrictEqual({
        id: 'concurrency',
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
        siegemasterSignoff: {
          verdict: 'confirmed',
          evidence: 'two concurrent sends produced one row, not two',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        },
      });
    });
  });

  describe('family with one track signed', () => {
    it('VALID: {flowrider only} => keeps the siegemaster field absent rather than nulled', () => {
      expect(
        FlowOffMapSignoffStub({ id: 're-entry', flowriderSignoff: SignoffStub() }),
      ).toStrictEqual({
        id: 're-entry',
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
      });
    });

    it('VALID: {siegemaster only} => keeps the flowrider field absent rather than nulled', () => {
      expect(
        FlowOffMapSignoffStub({
          id: 'staleness',
          siegemasterSignoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'the cache TTL is 24h and this session cannot advance the clock',
            question: 'can the TTL be injected so a stale read is reachable in a walk?',
          }),
        }),
      ).toStrictEqual({
        id: 'staleness',
        siegemasterSignoff: {
          verdict: 'unconfirmable',
          evidence: 'the cache TTL is 24h and this session cannot advance the clock',
          question: 'can the TTL be injected so a stale read is reachable in a walk?',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('family with no track signed', () => {
    it('EMPTY: {both sign-offs absent} => parses to the bare family id, the shape an unstarted family carries', () => {
      expect(FlowOffMapSignoffStub()).toStrictEqual({ id: 'concurrency' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "timezones"} => throws, because the id is a probe family and the family list is closed', () => {
      expect(() => FlowOffMapSignoffStub({ id: 'timezones' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {id missing entirely} => throws, because a Record-shaped entry with no id would be merged wholesale', () => {
      expect(() => flowOffMapSignoffContract.parse({ flowriderSignoff: SignoffStub() })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {flowriderSignoff with an empty evidence string} => throws', () => {
      expect(() =>
        flowOffMapSignoffContract.parse({
          id: 'concurrency',
          flowriderSignoff: {
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
