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

      expect(result).toStrictEqual({
        guildPath: expect.stringMatching(/^\/tmp\/install-testbed-\d+$/u),
        dungeonmasterPath: '/repo/dungeonmaster',
        cleanup: expect.any(Function),
        writeFile: expect.any(Function),
        readFile: expect.any(Function),
        getClaudeSettings: expect.any(Function),
        getMcpConfig: expect.any(Function),
        getDungeonmasterConfig: expect.any(Function),
        getEslintConfig: expect.any(Function),
        runInitCommand: expect.any(Function),
      });
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
