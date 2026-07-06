import { validateExternalImportLayerBroker } from './validate-external-import-layer-broker';
import { validateExternalImportLayerBrokerProxy } from './validate-external-import-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateExternalImportLayerBroker', () => {
  describe('allowed imports', () => {
    it('VALID: {@types subpath} => returns true, no report', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType: FolderTypeStub({ value: 'brokers' }),
        allowedImports: folderConfigStatics.brokers.allowedImports,
        importSource: '@dungeonmaster/shared/@types',
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {specific-package allowlist match} => returns true, no report', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType: FolderTypeStub({ value: 'brokers' }),
        allowedImports: folderConfigStatics.brokers.allowedImports,
        importSource: '@dungeonmaster/orchestrator',
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {cross-package subpath of an allowed folder type} => returns true, no report', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType: FolderTypeStub({ value: 'brokers' }),
        allowedImports: folderConfigStatics.brokers.allowedImports,
        importSource: '@acme/domain/contracts',
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare external package in a node_modules folder} => returns true, no report', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType: FolderTypeStub({ value: 'adapters' }),
        allowedImports: folderConfigStatics.adapters.allowedImports,
        importSource: 'lodash',
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('forbidden imports', () => {
    it('INVALID: {cross-package subpath of a disallowed folder type} => reports forbiddenImport', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });
      const folderType = FolderTypeStub({ value: 'brokers' });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType,
        allowedImports: folderConfigStatics.brokers.allowedImports,
        importSource: '@acme/domain/flows',
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenImport',
        data: {
          folderType,
          importedFolder: 'flows',
          allowed: folderConfigStatics.brokers.allowedImports.join(', '),
        },
      });
    });

    it('INVALID: {bare external package with no node_modules access} => reports forbiddenExternalImport', () => {
      validateExternalImportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ImportDeclaration });
      const folderType = FolderTypeStub({ value: 'brokers' });

      const result = validateExternalImportLayerBroker({
        node,
        context,
        folderType,
        allowedImports: folderConfigStatics.brokers.allowedImports,
        importSource: 'lodash',
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenExternalImport',
        data: { folderType, packageName: 'lodash' },
      });
    });
  });
});
