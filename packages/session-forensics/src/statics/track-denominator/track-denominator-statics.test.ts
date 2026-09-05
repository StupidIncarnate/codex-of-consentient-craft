import { trackDenominatorStatics } from './track-denominator-statics';

describe('trackDenominatorStatics', () => {
  describe('full value', () => {
    it('VALID: {} => mirrors the orchestrator eligibility table exactly', () => {
      expect(trackDenominatorStatics).toStrictEqual({
        mirrorOf:
          'packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts',
        byTrack: {
          codeweaverSignoff: {
            flowTypes: ['runtime', 'operational'],
            unitKinds: ['terminal', 'branch', 'observable'],
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test', 'reading'],
          },
          flowriderSignoff: {
            flowTypes: ['runtime'],
            unitKinds: ['terminal', 'branch', 'observable'],
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test'],
          },
          siegemasterSignoff: {
            flowTypes: ['runtime', 'operational'],
            unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
            observableOrigins: [
              'spec',
              'chaoswhisperer',
              'codeweaver',
              'flowrider',
              'siegemaster',
              'operator',
            ],
            verificationMethods: ['test'],
          },
        },
      });
    });
  });
});
