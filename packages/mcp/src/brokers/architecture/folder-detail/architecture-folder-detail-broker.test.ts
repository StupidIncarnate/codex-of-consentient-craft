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
      expect(result).toMatch(/# brokers\/ Folder Type/u);
      expect(result).toMatch(/## Purpose/u);
      expect(result).toMatch(/## File Structure/u);
      expect(result).toMatch(/## Naming Conventions/u);
      expect(result).toMatch(/## Import Rules/u);
    });

    it('VALID: {folderType: "brokers"} => includes required files and features sections', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'brokers' as never,
      });

      expect(result).toMatch(/## Required Files/u);
      expect(result).toMatch(/## Special Features/u);
      expect(result).toMatch(/## Critical Constraints/u);
    });
  });

  describe('contracts folder type', () => {
    it('VALID: {folderType: "contracts"} => returns complete contracts documentation with title and purpose', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'contracts' as never,
      });

      expect(result).toMatch(/# contracts\/ Folder Type/u);
      expect(result).toMatch(/## Purpose/u);
    });
  });

  describe('guards folder type', () => {
    it('VALID: {folderType: "guards"} => returns complete guards documentation with title and purpose', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'guards' as never,
      });

      expect(result).toMatch(/# guards\/ Folder Type/u);
      expect(result).toMatch(/## Purpose/u);
    });
  });

  describe('statics folder type', () => {
    it('VALID: {folderType: "statics"} => returns complete statics documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'statics' as never,
      });

      expect(result).toMatch(/# statics\/ Folder Type/u);
      expect(result).toMatch(/## Purpose/u);
      expect(result).toMatch(/Immutable configuration values and constants/u);
    });
  });

  describe('startup folder type', () => {
    it('VALID: {folderType: "startup"} => returns complete startup documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'startup' as never,
      });

      expect(result).toMatch(/# startup\/ Folder Type/u);
      expect(result).toMatch(/## Purpose/u);
      expect(result).toMatch(/Application initialization and configuration/u);
    });
  });

  describe('unknown folder type', () => {
    it('VALID: {folderType: "unknown-type"} => returns error message', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'unknown-type' as never,
      });

      expect(result).toMatch(/# Unknown Folder Type: unknown-type/u);
      expect(result).toMatch(/No configuration found for this folder type/u);
    });
  });
});
