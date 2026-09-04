import { isTrackOwedUnitGuard } from './is-track-owed-unit-guard';
import { VerificationUnitStub } from '../../contracts/verification-unit/verification-unit.stub';
import { trackDenominatorStatics } from '../../statics/track-denominator/track-denominator-statics';

type Track = keyof typeof trackDenominatorStatics.byTrack;

const ALL_TRACKS = Object.keys(trackDenominatorStatics.byTrack) as readonly Track[];

describe('isTrackOwedUnitGuard', () => {
  describe('baseline: spec observable proven by a test', () => {
    it.each(ALL_TRACKS)('VALID: {track: %s} => is owed', (track) => {
      const unit = VerificationUnitStub({
        flowType: 'runtime',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track, unit })).toBe(true);
    });
  });

  describe('flow type exclusion — an operational flow observable', () => {
    it('INVALID: {track: flowriderSignoff, flowType: operational} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowriderSignoff', unit })).toBe(false);
    });

    it('VALID: {track: codeweaverSignoff, flowType: operational} => codeweaver owes it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaverSignoff', unit })).toBe(true);
    });

    it('VALID: {track: siegemasterSignoff, flowType: operational} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemasterSignoff', unit })).toBe(true);
    });
  });

  describe('unit kind exclusion — an off-map unit', () => {
    it('VALID: {track: siegemasterSignoff, kind: off-map} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'siegemasterSignoff', unit })).toBe(true);
    });

    it('INVALID: {track: codeweaverSignoff, kind: off-map} => codeweaver does not owe it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'codeweaverSignoff', unit })).toBe(false);
    });

    it('INVALID: {track: flowriderSignoff, kind: off-map} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'flowriderSignoff', unit })).toBe(false);
    });
  });

  describe('observable provenance exclusion — a siegemaster-authored observable', () => {
    it('VALID: {track: siegemasterSignoff, addedBy: siegemaster} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemasterSignoff', unit })).toBe(true);
    });

    it('INVALID: {track: codeweaverSignoff, addedBy: siegemaster} => codeweaver does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaverSignoff', unit })).toBe(false);
    });

    it('INVALID: {track: flowriderSignoff, addedBy: siegemaster} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowriderSignoff', unit })).toBe(false);
    });
  });

  describe('observable provenance — addedBy omitted defaults to spec', () => {
    it.each(ALL_TRACKS)(
      'EDGE: {track: %s, addedBy omitted} => treated as spec, is owed',
      (track) => {
        const unit = VerificationUnitStub({ kind: 'observable', verificationMethod: 'test' });

        expect(isTrackOwedUnitGuard({ track, unit })).toBe(true);
      },
    );
  });

  describe('verification method exclusion — a verifyByReading observable', () => {
    it('VALID: {track: codeweaverSignoff, verificationMethod: reading} => codeweaver owes it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaverSignoff', unit })).toBe(true);
    });

    it('INVALID: {track: flowriderSignoff, verificationMethod: reading} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowriderSignoff', unit })).toBe(false);
    });

    it('INVALID: {track: siegemasterSignoff, verificationMethod: reading} => siegemaster does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemasterSignoff', unit })).toBe(false);
    });
  });

  describe('non-observable units bypass provenance and method checks', () => {
    it.each(ALL_TRACKS)(
      'VALID: {track: %s, kind: terminal, addedBy omitted} => is owed',
      (track) => {
        const unit = VerificationUnitStub({ kind: 'terminal' });

        expect(isTrackOwedUnitGuard({ track, unit })).toBe(true);
      },
    );

    it.each(ALL_TRACKS)('VALID: {track: %s, kind: branch} => is owed', (track) => {
      const unit = VerificationUnitStub({ kind: 'branch' });

      expect(isTrackOwedUnitGuard({ track, unit })).toBe(true);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {track: undefined} => returns false', () => {
      const unit = VerificationUnitStub();

      expect(isTrackOwedUnitGuard({ unit })).toBe(false);
    });

    it('EMPTY: {unit: undefined} => returns false', () => {
      expect(isTrackOwedUnitGuard({ track: 'codeweaverSignoff' })).toBe(false);
    });
  });
});
