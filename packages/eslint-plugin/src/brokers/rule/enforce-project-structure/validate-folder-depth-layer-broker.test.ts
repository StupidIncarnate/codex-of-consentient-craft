import { validateFolderDepthLayerBroker } from './validate-folder-depth-layer-broker';
import { validateFolderDepthLayerBrokerProxy } from './validate-folder-depth-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateFolderDepthLayerBroker', () => {
  describe('correct folder depth', () => {
    it('returns true for brokers at depth 2', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for contracts at depth 1', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for startup at depth 0', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for responders at depth 2', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'responders' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/responders/auth/login/auth-login-responder.ts',
        firstFolder,
        folderConfig: folderConfigStatics.responders,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns true for adapters at depth 2', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('invalid folder depth', () => {
    it('reports invalidFolderDepth for responders at depth 0', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'responders' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/responders/login-responder.ts',
        firstFolder,
        folderConfig: folderConfigStatics.responders,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '2',
          actual: '0',
          pattern: folderConfigStatics.responders.folderPattern,
        },
      });
    });

    it('reports invalidFolderDepth for responders at depth 1', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'responders' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/responders/user/login-responder.ts',
        firstFolder,
        folderConfig: folderConfigStatics.responders,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '2',
          actual: '1',
          pattern: folderConfigStatics.responders.folderPattern,
        },
      });
    });

    it('reports invalidFolderDepth for guards at depth 2', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'guards' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/guards/auth/admin/is-admin-guard.ts',
        firstFolder,
        folderConfig: folderConfigStatics.guards,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '1',
          actual: '2',
          pattern: folderConfigStatics.guards.folderPattern,
        },
      });
    });

    it('reports invalidFolderDepth for contracts at depth 2', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/model/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '1',
          actual: '2',
          pattern: folderConfigStatics.contracts.folderPattern,
        },
      });
    });

    it('reports invalidFolderDepth for startup at depth 1', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/startup/app/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '0',
          actual: '1',
          pattern: folderConfigStatics.startup.folderPattern,
        },
      });
    });

    it('reports invalidFolderDepth for adapters at depth 0', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios-get-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFolderDepth',
        data: {
          folder: firstFolder,
          expected: '2',
          actual: '0',
          pattern: folderConfigStatics.adapters.folderPattern,
        },
      });
    });
  });

  describe('non-kebab-case folder names', () => {
    it('reports invalidFilenameCase for PascalCase folder segment', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/User/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFilenameCase',
        data: {
          actual: 'User',
          expected: 'user',
          ext: 'ts',
        },
      });
    });

    it('reports invalidFilenameCase for snake_case folder segment', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user_data/fetch/user-data-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFilenameCase',
        data: {
          actual: 'user_data',
          expected: 'user-data',
          ext: 'ts',
        },
      });
    });
  });
});
