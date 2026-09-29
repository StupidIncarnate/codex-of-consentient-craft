import { sessionDefaultIdBumpTransformer } from './session-default-id-bump-transformer';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

describe('sessionDefaultIdBumpTransformer', () => {
  describe('a default id', () => {
    it('VALID: {id: "seed-session-1", by: 1} => returns "seed-session-2"', () => {
      const result = sessionDefaultIdBumpTransformer({
        id: SessionIdStub({ value: 'seed-session-1' }),
        by: 1,
      });

      expect(result).toBe('seed-session-2');
    });

    it('VALID: {id: "seed-session-9", by: 3} => returns "seed-session-12"', () => {
      const result = sessionDefaultIdBumpTransformer({
        id: SessionIdStub({ value: 'seed-session-9' }),
        by: 3,
      });

      expect(result).toBe('seed-session-12');
    });
  });

  describe('an id not matching the default shape', () => {
    it('VALID: {id: "my-custom-session", by: 1} => returns it unchanged', () => {
      const result = sessionDefaultIdBumpTransformer({
        id: SessionIdStub({ value: 'my-custom-session' }),
        by: 1,
      });

      expect(result).toBe('my-custom-session');
    });
  });
});
