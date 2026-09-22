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
    it('INVALID: {track: flowrider, flowType: operational} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowrider', unit })).toBe(false);
    });

    it('VALID: {track: codeweaver, flowType: operational} => codeweaver owes it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaver', unit })).toBe(true);
    });

    it('VALID: {track: siegemaster, flowType: operational} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({
        flowType: 'operational',
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemaster', unit })).toBe(true);
    });
  });

  describe('unit kind exclusion — an off-map unit', () => {
    it('VALID: {track: siegemaster, kind: off-map} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'siegemaster', unit })).toBe(true);
    });

    it('INVALID: {track: codeweaver, kind: off-map} => codeweaver does not owe it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'codeweaver', unit })).toBe(false);
    });

    it('INVALID: {track: flowrider, kind: off-map} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({ kind: 'off-map' });

      expect(isTrackOwedUnitGuard({ track: 'flowrider', unit })).toBe(false);
    });
  });

  describe('observable provenance exclusion — a siegemaster-authored observable', () => {
    it('VALID: {track: siegemaster, addedBy: siegemaster} => siegemaster owes it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemaster', unit })).toBe(true);
    });

    it('INVALID: {track: codeweaver, addedBy: siegemaster} => codeweaver does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaver', unit })).toBe(false);
    });

    it('INVALID: {track: flowrider, addedBy: siegemaster} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'siegemaster',
        verificationMethod: 'test',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowrider', unit })).toBe(false);
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
    it('VALID: {track: codeweaver, verificationMethod: reading} => codeweaver owes it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'codeweaver', unit })).toBe(true);
    });

    it('INVALID: {track: flowrider, verificationMethod: reading} => flowrider does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'flowrider', unit })).toBe(false);
    });

    it('INVALID: {track: siegemaster, verificationMethod: reading} => siegemaster does not owe it', () => {
      const unit = VerificationUnitStub({
        kind: 'observable',
        addedBy: 'spec',
        verificationMethod: 'reading',
      });

      expect(isTrackOwedUnitGuard({ track: 'siegemaster', unit })).toBe(false);
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
      expect(isTrackOwedUnitGuard({ track: 'codeweaver' })).toBe(false);
    });
  });
});
