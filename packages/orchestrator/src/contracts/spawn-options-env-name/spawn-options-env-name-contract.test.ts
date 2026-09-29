import { spawnOptionsEnvNameContract } from './spawn-options-env-name-contract';
import { SpawnOptionsEnvNameStub } from './spawn-options-env-name.stub';

describe('spawnOptionsEnvNameContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS"} => parses successfully', () => {
      const key = SpawnOptionsEnvNameStub({ value: 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS' });

      const result = spawnOptionsEnvNameContract.parse(key);

      expect(result).toBe('CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => spawnOptionsEnvNameContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
