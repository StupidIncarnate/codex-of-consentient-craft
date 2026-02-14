import { validateFolderLocationLayerBroker } from './validate-folder-location-layer-broker';
import { validateFolderLocationLayerBrokerProxy } from './validate-folder-location-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

const allowedFolders = Object.keys(folderConfigStatics);

describe('validateFolderLocationLayerBroker', () => {
  describe('valid known folder types', () => {
    it('returns true for brokers folder', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for contracts folder', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for transformers folder', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('layer files in allowed folder types', () => {
    it('returns true for layer file in brokers', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for layer file in widgets', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for layer file in responders', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'responders' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.responders,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('forbidden folders', () => {
    it('reports forbiddenFolder for utils/ and returns false', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'utils' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenFolder',
        data: { folder: firstFolder, suggestion: 'adapters or transformers' },
      });
    });

    it('reports forbiddenFolder for lib/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'lib' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenFolder',
        data: { folder: firstFolder, suggestion: 'adapters' },
      });
    });

    it('reports forbiddenFolder for helpers/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'helpers' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.guards,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenFolder',
        data: { folder: firstFolder, suggestion: 'guards or transformers' },
      });
    });

    it('reports forbiddenFolder for services/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'services' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenFolder',
        data: { folder: firstFolder, suggestion: 'brokers' },
      });
    });

    it('reports forbiddenFolder for types/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'types' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'forbiddenFolder',
        data: { folder: firstFolder, suggestion: 'contracts' },
      });
    });
  });

  describe('unknown folder', () => {
    it('reports unknownFolder and returns false', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'unknown-folder' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'unknownFolder',
        data: { folder: firstFolder, allowed: allowedFolders.join(', ') },
      });
    });
  });

  describe('layer files in disallowed folder types', () => {
    it('reports layerFilesNotAllowed for guards/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'guards' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.guards,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for transformers/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for adapters/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for contracts/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for statics/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'statics' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.statics,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for state/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'state' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.state,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for bindings/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'bindings' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.bindings,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });

    it('reports layerFilesNotAllowed for middleware/', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'middleware' });

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.middleware,
        isLayerFile: true,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'layerFilesNotAllowed',
        data: { folderType: firstFolder },
      });
    });
  });
});
