import { devLogToolInputContract } from './dev-log-tool-input-contract';
import { DevLogToolInputStub } from './dev-log-tool-input.stub';

describe('devLogToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully', () => {
      const result = DevLogToolInputStub({});

      expect(result.file_path).toBe(undefined);
    });

    it('VALID: passthrough additional fields => preserves them', () => {
      const result = devLogToolInputContract.parse({ extra: 'stuff' }) as Record<
        PropertyKey,
        unknown
      >;

      expect(result.extra).toBe('stuff');
    });
  });
});
