import { installTestbedCreateBroker } from './install-testbed-create-broker';
import { installTestbedCreateBrokerProxy } from './install-testbed-create-broker.proxy';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';

describe('installTestbedCreateBroker', () => {
  describe('testbed creation', () => {
    it('VALID: creates testbed with required pre-install files', () => {
      installTestbedCreateBrokerProxy();
      const baseName = BaseNameStub({ value: 'test-install' });

      const testbed = installTestbedCreateBroker({ baseName });
      testbed.cleanup();

      expect(testbed.projectPath).toMatch(/^\/tmp\/test-install-[a-f0-9]{8}$/u);
    });
  });

  describe('file operations', () => {
    it('VALID: testbed has writeFile and readFile methods', () => {
      installTestbedCreateBrokerProxy();

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'test-write' }),
      });

      testbed.cleanup();

      expect(typeof testbed.writeFile).toBe('function');
      expect(typeof testbed.readFile).toBe('function');
    });
  });

  describe('config file getters', () => {
    it('VALID: getClaudeSettings returns null when settings.json does not exist', () => {
      installTestbedCreateBrokerProxy();

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'test-settings' }),
      });

      const result = testbed.getClaudeSettings();
      testbed.cleanup();

      expect(result).toBeNull();
    });

    it('VALID: getMcpConfig returns null when .mcp.json does not exist', () => {
      installTestbedCreateBrokerProxy();

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'test-mcp' }),
      });

      const result = testbed.getMcpConfig();
      testbed.cleanup();

      expect(result).toBeNull();
    });

    it('VALID: getDungeonmasterConfig returns null when .dungeonmaster does not exist', () => {
      installTestbedCreateBrokerProxy();

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'test-config' }),
      });

      const result = testbed.getDungeonmasterConfig();
      testbed.cleanup();

      expect(result).toBeNull();
    });

    it('VALID: getEslintConfig returns null when eslint.config.js does not exist', () => {
      installTestbedCreateBrokerProxy();

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'test-eslint' }),
      });

      const result = testbed.getEslintConfig();
      testbed.cleanup();

      expect(result).toBeNull();
    });
  });
});
