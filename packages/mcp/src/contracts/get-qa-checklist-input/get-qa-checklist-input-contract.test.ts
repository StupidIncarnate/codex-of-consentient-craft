import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { getQaChecklistInputContract } from './get-qa-checklist-input-contract';
import { GetQaChecklistInputStub } from './get-qa-checklist-input.stub';

// The DENOMINATOR tuple the shared contract builds its enum from — three roles over two sign-off
// fields. Hardcoding two here is the mistake this input shipped with: `groundstomper` was silently
// absent, so the one session that needed to name itself could not.
const DENOMINATOR_TRACKS = signoffTracksStatics.denominators;

// The member of that tuple that is NOT a sign-off field name. A track-scoped input keyed on the
// field enum would reject exactly this value.
const FIELDLESS_TRACKS = DENOMINATOR_TRACKS.filter(
  (track) => !signoffTracksStatics.fields.some((field) => field === track),
);

describe('getQaChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getQaChecklistInputContract.parse(GetQaChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });

    it('VALID: {questId, flowId} => parses the flow-scoped form', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', flowId: 'login-flow' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', flowId: 'login-flow' });
    });

    it.each(DENOMINATOR_TRACKS)(
      'VALID: {questId, track: %s} => parses the track-scoped form',
      (track) => {
        expect(
          getQaChecklistInputContract.parse(
            GetQaChecklistInputStub({ questId: 'add-auth', track }),
          ),
        ).toStrictEqual({ questId: 'add-auth', track });
      },
    );

    it.each(FIELDLESS_TRACKS)(
      'VALID: {questId, track: %s} => parses, even though no sign-off field carries that name',
      (track) => {
        expect(
          getQaChecklistInputContract.parse(
            GetQaChecklistInputStub({ questId: 'add-auth', track }),
          ),
        ).toStrictEqual({ questId: 'add-auth', track });
      },
    );

    it('VALID: {questId, packageNames} => parses the item-sliced form', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', packageNames: ['ui-app', 'api-service'] }),
        ),
      ).toStrictEqual({ questId: 'add-auth', packageNames: ['ui-app', 'api-service'] });
    });

    it('EMPTY: {packageNames: []} => parses, an item declaring no slice narrows nothing', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', packageNames: [] }),
        ),
      ).toStrictEqual({ questId: 'add-auth', packageNames: [] });
    });

    it('VALID: {questId, flowId, track, packageNames} => parses every scope together', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({
            questId: 'add-auth',
            flowId: 'login-flow',
            track: 'groundstomper',
            packageNames: ['ui-app'],
          }),
        ),
      ).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
        track: 'groundstomper',
        packageNames: ['ui-app'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {flowId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: 'add-auth', flowId: '' })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {track: "blightwarden"} => throws, because blightwarden signs no verification unit', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', track: 'blightwarden' } as never),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {track: "flowriderSignoff"} => throws, the FIELD name is not a denominator name', () => {
      expect(() =>
        getQaChecklistInputContract.parse({
          questId: 'add-auth',
          track: 'flowriderSignoff',
        } as never),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {packageNames: [""]} => throws, an empty package name narrows to nothing silently', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', packageNames: [''] } as never),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {packageNames: "ui-app"} => throws, the slice is a list even at one member', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', packageNames: 'ui-app' } as never),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', stage: 'spec' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
