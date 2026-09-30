import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { validateFolderLocationLayerBroker } from './validate-folder-location-layer-broker';
import { validateFolderLocationLayerBrokerProxy } from './validate-folder-location-layer-broker.proxy';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

const allowedFolders = Object.keys(folderConfigStatics);

describe('validateFolderLocationLayerBroker', () => {
  describe('valid known folder types', () => {
    it('VALID: brokers folder => returns true', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'transformers';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'widgets';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'responders';

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

    it('VALID: layer file in bindings => returns true', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'bindings';

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.bindings,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: layer file in contracts => returns true', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: layer file in transformers => returns true', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'transformers';

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: layer file in statics => returns true', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'statics';

      const result = validateFolderLocationLayerBroker({
        node,
        context,
        firstFolder,
        folderConfig: folderConfigStatics.statics,
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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'utils';

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
        data: { folder: firstFolder, suggestion: 'guards or transformers' },
      });
    });

    it('INVALID: lib/ folder => reports forbiddenFolder', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'lib';

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

    it('INVALID: helpers/ folder => reports forbiddenFolder', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'helpers';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'services';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'types';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'unknown-folder';

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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'guards';

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

    it('INVALID: layer file in state/ => reports layerFilesNotAllowed', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'state';

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

    it('INVALID: layer file in middleware/ => reports layerFilesNotAllowed', () => {
      validateFolderLocationLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'middleware';

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
