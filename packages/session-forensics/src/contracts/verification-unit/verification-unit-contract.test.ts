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
          codeweaver: 'confirmed',
          siegemaster: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          nodeId: 'transcript-panel',
          addedBy: 'siegemaster',
          verificationMethod: 'reading',
          trackVerdicts: {
            codeweaver: 'confirmed',
            siegemaster: 'confirmed',
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
          codeweaver: 'confirmed',
          flowrider: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'send-message-with-images',
          kind: 'branch',
          unitId: 'edge-attach-fails-to-error',
          nodeId: 'compose-node',
          trackVerdicts: {
            codeweaver: 'confirmed',
            flowrider: 'confirmed',
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
          siegemaster: 'confirmed',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowType: 'operational',
          kind: 'off-map',
          unitId: 'unhandled-rejection',
          packages: [],
          trackVerdicts: {
            siegemaster: 'confirmed',
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
          codeweaver: 'confirmed',
          flowrider: 'unconfirmable',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          trackVerdicts: {
            codeweaver: 'confirmed',
            flowrider: 'unconfirmable',
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
          codeweaver: 'confirmed',
          flowrider: 'confirmed',
          siegemaster: 'confirmed',
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
            codeweaver: 'confirmed',
            flowrider: 'confirmed',
            siegemaster: 'confirmed',
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
          codeweaver: 'confirmed',
          flowrider: 'confirmed',
          siegemaster: 'confirmed',
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
            codeweaver: 'confirmed',
            flowrider: 'confirmed',
            siegemaster: 'confirmed',
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

    it('INVALID: {trackVerdicts.codeweaver: nonsense} => throws', () => {
      expect(() =>
        VerificationUnitStub({
          trackVerdicts: { codeweaver: 'nonsense' as never },
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
