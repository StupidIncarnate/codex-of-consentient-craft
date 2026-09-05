import { verificationUnitContract } from './verification-unit-contract';
import { VerificationUnitStub } from './verification-unit.stub';

describe('verificationUnitContract', () => {
  describe('valid input', () => {
    it('VALID: {kind: observable, addedBy: siegemaster, verificationMethod: reading} => returns the branded unit', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'check-thumbnail-renders',
        nodeId: 'transcript-panel',
        packages: ['web'],
        addedBy: 'siegemaster',
        verificationMethod: 'reading',
        trackVerdicts: {
          codeweaverSignoff: 'confirmed',
          siegemasterSignoff: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          nodeId: 'transcript-panel',
          addedBy: 'siegemaster',
          verificationMethod: 'reading',
          trackVerdicts: {
            codeweaverSignoff: 'confirmed',
            siegemasterSignoff: 'confirmed',
          },
        }),
      );
    });

    it('VALID: {kind: branch, nodeId present, no addedBy} => returns the branded unit', () => {
      const result = verificationUnitContract.parse({
        flowId: 'send-message-with-images',
        flowType: 'runtime',
        kind: 'branch',
        unitId: 'edge-attach-fails-to-error',
        nodeId: 'compose-node',
        packages: ['web'],
        verificationMethod: 'test',
        trackVerdicts: {
          codeweaverSignoff: 'confirmed',
          flowriderSignoff: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'send-message-with-images',
          kind: 'branch',
          unitId: 'edge-attach-fails-to-error',
          nodeId: 'compose-node',
          trackVerdicts: {
            codeweaverSignoff: 'confirmed',
            flowriderSignoff: 'confirmed',
          },
        }),
      );
    });

    it('VALID: {kind: off-map, nodeId omitted} => returns the branded unit with empty packages', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'operational',
        kind: 'off-map',
        unitId: 'unhandled-rejection',
        verificationMethod: 'test',
        trackVerdicts: {
          siegemasterSignoff: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowType: 'operational',
          kind: 'off-map',
          unitId: 'unhandled-rejection',
          packages: [],
          trackVerdicts: {
            siegemasterSignoff: 'confirmed',
          },
        }),
      );
    });

    it('VALID: {trackVerdicts mixes confirmed and unconfirmable} => both keys present, siegemaster key absent', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'check-thumbnail-renders',
        packages: ['web'],
        verificationMethod: 'test',
        trackVerdicts: {
          codeweaverSignoff: 'confirmed',
          flowriderSignoff: 'unconfirmable',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          trackVerdicts: {
            codeweaverSignoff: 'confirmed',
            flowriderSignoff: 'unconfirmable',
          },
        }),
      );
    });
  });

  describe('defaults', () => {
    it('EDGE: {no packages} => defaults to empty array', () => {
      const result = verificationUnitContract.parse({
        flowId: 'paste-image-into-composer',
        flowType: 'runtime',
        kind: 'terminal',
        unitId: 'composer-shows-thumbnail',
        nodeId: 'composer-node',
        verificationMethod: 'test',
        trackVerdicts: {
          codeweaverSignoff: 'confirmed',
          flowriderSignoff: 'confirmed',
          siegemasterSignoff: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'paste-image-into-composer',
          kind: 'terminal',
          unitId: 'composer-shows-thumbnail',
          nodeId: 'composer-node',
          packages: [],
          trackVerdicts: {
            codeweaverSignoff: 'confirmed',
            flowriderSignoff: 'confirmed',
            siegemasterSignoff: 'confirmed',
          },
        }),
      );
    });

    it('EDGE: {no verificationMethod} => defaults to test', () => {
      const result = verificationUnitContract.parse({
        flowId: 'paste-image-into-composer',
        flowType: 'runtime',
        kind: 'terminal',
        unitId: 'composer-shows-thumbnail',
        nodeId: 'composer-node',
        packages: ['web'],
        trackVerdicts: {
          codeweaverSignoff: 'confirmed',
          flowriderSignoff: 'confirmed',
          siegemasterSignoff: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'paste-image-into-composer',
          kind: 'terminal',
          unitId: 'composer-shows-thumbnail',
          nodeId: 'composer-node',
          verificationMethod: 'test',
          trackVerdicts: {
            codeweaverSignoff: 'confirmed',
            flowriderSignoff: 'confirmed',
            siegemasterSignoff: 'confirmed',
          },
        }),
      );
    });
  });

  describe('empty trackVerdicts', () => {
    it('EMPTY: {trackVerdicts: {}} => every track key absent', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'check-thumbnail-renders',
        packages: ['web'],
        verificationMethod: 'test',
        trackVerdicts: {},
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          trackVerdicts: {},
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: nonsense} => throws', () => {
      expect(() => VerificationUnitStub({ kind: 'nonsense' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {addedBy: nobody} => throws', () => {
      expect(() => VerificationUnitStub({ addedBy: 'nobody' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {trackVerdicts.codeweaverSignoff: nonsense} => throws', () => {
      expect(() =>
        VerificationUnitStub({
          trackVerdicts: { codeweaverSignoff: 'nonsense' as never },
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
