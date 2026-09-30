import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { validateFolderDepthLayerBroker } from './validate-folder-depth-layer-broker';
import { validateFolderDepthLayerBrokerProxy } from './validate-folder-depth-layer-broker.proxy';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateFolderDepthLayerBroker', () => {
  describe('correct folder depth', () => {
    it('VALID: brokers at depth 2 => returns true', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: contracts at depth 1 => returns true', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: startup at depth 0 => returns true', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: responders at depth 2 => returns true', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'responders';

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/responders/auth/login/auth-login-responder.ts',
        firstFolder,
        folderConfig: folderConfigStatics.responders,
      });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('invalid folder depth', () => {
    it('INVALID: responders at depth 0 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'responders';

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

    it('INVALID: responders at depth 1 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'responders';

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

    it('INVALID: guards at depth 2 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'guards';

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

    it('INVALID: contracts at depth 2 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';

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

    it('INVALID: startup at depth 1 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';

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

    it('INVALID: brokers at depth 0 => reports invalidFolderDepth', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

      const result = validateFolderDepthLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/axios-get-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
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
          pattern: folderConfigStatics.brokers.folderPattern,
        },
      });
    });
  });

  describe('non-kebab-case folder names', () => {
    it('INVALID: PascalCase folder segment => reports invalidFilenameCase', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

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

    it('INVALID: snake_case folder segment => reports invalidFilenameCase', () => {
      validateFolderDepthLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

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
