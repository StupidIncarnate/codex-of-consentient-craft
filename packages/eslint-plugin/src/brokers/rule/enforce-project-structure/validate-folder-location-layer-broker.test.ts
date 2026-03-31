import { validateFolderLocationLayerBroker } from './validate-folder-location-layer-broker';
import { validateFolderLocationLayerBrokerProxy } from './validate-folder-location-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

const allowedFolders = Object.keys(folderConfigStatics);

describe('validateFolderLocationLayerBroker', () => {
  describe('valid known folder types', () => {
    it('VALID: brokers folder => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: contracts folder => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: transformers folder => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('layer files in allowed folder types', () => {
    it('VALID: layer file in brokers => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: layer file in widgets => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: layer file in responders => returns true', () => {
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
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('forbidden folders', () => {
    it('INVALID: utils/ folder => reports forbiddenFolder and returns false', () => {
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

    it('INVALID: lib/ folder => reports forbiddenFolder', () => {
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

    it('INVALID: helpers/ folder => reports forbiddenFolder', () => {
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

    it('INVALID: services/ folder => reports forbiddenFolder', () => {
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

    it('INVALID: types/ folder => reports forbiddenFolder', () => {
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
    it('INVALID: unknown-folder => reports unknownFolder and returns false', () => {
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
    it('INVALID: layer file in guards/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in transformers/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in adapters/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in contracts/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in statics/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in state/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in bindings/ => reports layerFilesNotAllowed', () => {
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

    it('INVALID: layer file in middleware/ => reports layerFilesNotAllowed', () => {
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
