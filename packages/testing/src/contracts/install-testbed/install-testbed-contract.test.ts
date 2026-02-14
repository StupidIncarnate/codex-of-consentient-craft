import { installTestbedContract } from './install-testbed-contract';
import { InstallTestbedStub } from './install-testbed.stub';

describe('installTestbedContract', () => {
  describe('valid data', () => {
    it('VALID: {guildPath: "/tmp/test-123", dungeonmasterPath: "/repo"} => returns InstallTestbedData', () => {
      const result = installTestbedContract.parse({
        guildPath: '/tmp/test-123',
        dungeonmasterPath: '/repo',
      });

      expect(result).toStrictEqual({
        guildPath: '/tmp/test-123',
        dungeonmasterPath: '/repo',
      });
    });
  });

  describe('InstallTestbedStub', () => {
    it('VALID: creates InstallTestbed with default values', () => {
      const result = InstallTestbedStub();

      expect(typeof result.guildPath).toBe('string');
      expect(typeof result.dungeonmasterPath).toBe('string');
      expect(typeof result.cleanup).toBe('function');
      expect(typeof result.writeFile).toBe('function');
      expect(typeof result.readFile).toBe('function');
    });

    it('VALID: creates InstallTestbed with custom guildPath', () => {
      const result = InstallTestbedStub({
        guildPath: '/custom/path',
      });

      expect(result.guildPath).toBe('/custom/path');
    });

    it('VALID: creates InstallTestbed with custom dungeonmasterPath', () => {
      const result = InstallTestbedStub({
        dungeonmasterPath: '/custom/dm',
      });

      expect(result.dungeonmasterPath).toBe('/custom/dm');
    });
  });
});
