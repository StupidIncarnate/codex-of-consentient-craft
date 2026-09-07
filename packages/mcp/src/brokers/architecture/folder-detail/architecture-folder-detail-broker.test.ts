import { architectureFolderDetailBroker } from './architecture-folder-detail-broker';
import { architectureFolderDetailBrokerProxy } from './architecture-folder-detail-broker.proxy';

describe('architectureFolderDetailBroker', () => {
  describe('brokers folder type', () => {
    it('VALID: {folderType: "brokers"} => returns complete broker documentation with title and purpose', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'brokers' as never,
      });

      // Verify key sections are present
      expect(result).toMatch(/^# brokers\/ Folder Type$/mu);
      expect(result).toMatch(/^## Purpose$/mu);
      expect(result).toMatch(/^## File Structure$/mu);
      expect(result).toMatch(/^## Naming Conventions$/mu);
      expect(result).toMatch(/^## Import Rules$/mu);
    });

    it('VALID: {folderType: "brokers"} => includes required files and features sections', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'brokers' as never,
      });

      expect(result).toMatch(/^## Required Files$/mu);
      expect(result).toMatch(/^## Special Features$/mu);
      expect(result).toMatch(/^## Critical Constraints$/mu);
    });
  });

  describe('contracts folder type', () => {
    it('VALID: {folderType: "contracts"} => returns complete contracts documentation with title and purpose', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'contracts' as never,
      });

      expect(result).toMatch(/^# contracts\/ Folder Type$/mu);
      expect(result).toMatch(/^## Purpose$/mu);
    });
  });

  describe('guards folder type', () => {
    it('VALID: {folderType: "guards"} => returns complete guards documentation with title and purpose', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'guards' as never,
      });

      expect(result).toMatch(/^# guards\/ Folder Type$/mu);
      expect(result).toMatch(/^## Purpose$/mu);
    });
  });

  describe('statics folder type', () => {
    it('VALID: {folderType: "statics"} => returns complete statics documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'statics' as never,
      });

      expect(result).toMatch(/^# statics\/ Folder Type$/mu);
      expect(result).toMatch(/^## Purpose$/mu);
      expect(result).toMatch(
        /^Immutable configuration values and constants\. Single source of truth for magic numbers, limits, and unchanging data\.$/mu,
      );
    });
  });

  describe('startup folder type', () => {
    it('VALID: {folderType: "startup"} => returns complete startup documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'startup' as never,
      });

      expect(result).toMatch(/^# startup\/ Folder Type$/mu);
      expect(result).toMatch(/^## Purpose$/mu);
      expect(result).toMatch(
        /^Application initialization and configuration\. Entry points, server startup, CLI commands\.$/mu,
      );
    });
  });

  describe('companion filenames', () => {
    it('VALID: {folderType: "brokers"} => test and proxy carry the implementation .ts extension', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'brokers' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** Yes\n\n- Implementation: `{name}-broker.ts`\n\n- Test: `{name}-broker.test.ts`\n\n- Proxy: `{name}-broker.proxy.ts`\n\n\n',
      );
    });

    it('VALID: {folderType: "widgets"} => test and proxy carry the implementation .tsx extension', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'widgets' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** Yes\n\n- Implementation: `{name}-widget.tsx`\n\n- Test: `{name}-widget.test.tsx`\n\n- Proxy: `{name}-widget.proxy.tsx`\n\n\n',
      );
    });

    it('VALID: {folderType: "flows"} => names an integration test and no proxy', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'flows' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** No\n\n- Implementation: `{name}-flow.ts`\n\n- Test: `{name}-flow.integration.test.ts`\n\n\n',
      );
    });

    it('VALID: {folderType: "startup"} => names an integration test and no proxy', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'startup' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** No\n\n- Implementation: `{name}.ts`\n\n- Test: `{name}.integration.test.ts`\n\n\n',
      );
    });

    it('VALID: {folderType: "contracts"} => names the stub file the tests must import', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'contracts' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** No\n\n- Implementation: `{name}-contract.ts`\n\n- Test: `{name}-contract.test.ts`\n\n- Stub: `{name}.stub.ts`\n\n\n',
      );
    });

    it('EMPTY: {folderType: "assets"} => names no test file at all', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'assets' as never,
      });
      const section = result.slice(
        result.indexOf('## Required Files'),
        result.indexOf('## Special Features'),
      );

      expect(section).toBe(
        '## Required Files\n\n**Proxy Required:** No\n\n- Implementation: `{name}`\n\n\n',
      );
    });
  });

  describe('unknown folder type', () => {
    it('VALID: {folderType: "unknown-type"} => returns error message', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'unknown-type' as never,
      });

      expect(result).toMatch(/^# Unknown Folder Type: unknown-type$/mu);
      expect(result).toMatch(/^No configuration found for this folder type\.$/mu);
    });
  });
});
