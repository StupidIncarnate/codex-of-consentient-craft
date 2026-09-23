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
        trackMarks: {
          codeweaver: 'met',
          siegemaster: 'met',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          nodeId: 'transcript-panel',
          addedBy: 'siegemaster',
          verificationMethod: 'reading',
          trackMarks: {
            codeweaver: 'met',
            siegemaster: 'met',
          },
        }),
      );
    });

    it('VALID: {verificationMethod: human-check} => returns the branded unit', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'looks-right-to-a-person',
        nodeId: 'transcript-panel',
        packages: ['web'],
        verificationMethod: 'human-check',
        trackMarks: {},
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          unitId: 'looks-right-to-a-person',
          nodeId: 'transcript-panel',
          verificationMethod: 'human-check',
          trackMarks: {},
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
        trackMarks: {
          codeweaver: 'met',
          flowrider: 'met',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'send-message-with-images',
          kind: 'branch',
          unitId: 'edge-attach-fails-to-error',
          nodeId: 'compose-node',
          trackMarks: {
            codeweaver: 'met',
            flowrider: 'met',
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
        trackMarks: {
          siegemaster: 'met',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowType: 'operational',
          kind: 'off-map',
          unitId: 'unhandled-rejection',
          packages: [],
          trackMarks: {
            siegemaster: 'met',
          },
        }),
      );
    });

    it('VALID: {trackMarks mixes met and cant-meet} => both keys present, siegemaster key absent', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'check-thumbnail-renders',
        packages: ['web'],
        verificationMethod: 'test',
        trackMarks: {
          codeweaver: 'met',
          flowrider: 'cant-meet',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          trackMarks: {
            codeweaver: 'met',
            flowrider: 'cant-meet',
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
        trackMarks: {
          codeweaver: 'met',
          flowrider: 'met',
          siegemaster: 'met',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'paste-image-into-composer',
          kind: 'terminal',
          unitId: 'composer-shows-thumbnail',
          nodeId: 'composer-node',
          packages: [],
          trackMarks: {
            codeweaver: 'met',
            flowrider: 'met',
            siegemaster: 'met',
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
        trackMarks: {
          codeweaver: 'met',
          flowrider: 'met',
          siegemaster: 'met',
        },
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          flowId: 'paste-image-into-composer',
          kind: 'terminal',
          unitId: 'composer-shows-thumbnail',
          nodeId: 'composer-node',
          verificationMethod: 'test',
          trackMarks: {
            codeweaver: 'met',
            flowrider: 'met',
            siegemaster: 'met',
          },
        }),
      );
    });
  });

  describe('empty trackMarks', () => {
    it('EMPTY: {trackMarks: {}} => every track key absent', () => {
      const result = verificationUnitContract.parse({
        flowId: 'render-images-in-transcript',
        flowType: 'runtime',
        kind: 'observable',
        unitId: 'check-thumbnail-renders',
        packages: ['web'],
        verificationMethod: 'test',
        trackMarks: {},
      });

      expect(result).toStrictEqual(
        VerificationUnitStub({
          trackMarks: {},
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

    it('INVALID: {trackMarks.codeweaver: nonsense} => throws', () => {
      expect(() =>
        VerificationUnitStub({
          trackMarks: { codeweaver: 'nonsense' as never },
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
