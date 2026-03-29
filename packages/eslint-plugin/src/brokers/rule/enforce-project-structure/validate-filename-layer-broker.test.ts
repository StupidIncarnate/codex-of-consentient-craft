import { validateFilenameLayerBroker } from './validate-filename-layer-broker';
import { validateFilenameLayerBrokerProxy } from './validate-filename-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateFilenameLayerBroker', () => {
  describe('valid filenames with correct suffix', () => {
    it('VALID: broker file with -broker.ts suffix => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: contract file with -contract.ts suffix => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: transformer file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/transformers/format-date/format-date-transformer.ts',
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: guard file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'guards' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/guards/has-permission/has-permission-guard.ts',
        firstFolder,
        folderConfig: folderConfigStatics.guards,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: error file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: widget file with .tsx => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: flow file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'flows' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/flows/login/login-flow.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.flows,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: startup file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('proxy files', () => {
    it('VALID: proxy file with .proxy.ts suffix => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: proxy file with .proxy.tsx suffix => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.proxy.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('layer files with correct suffix', () => {
    it('VALID: layer broker file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename:
          '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: layer widget file => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/user-card/avatar-layer-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        isLayerFile: true,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('missing suffix', () => {
    it('INVALID: broker missing -broker.ts => reports invalidFileSuffixWithLayer', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffixWithLayer',
        data: { expected: '-broker.ts', folderType: firstFolder },
      });
    });

    it('INVALID: contract missing -contract.ts => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-contract.ts or .stub.ts', folderType: firstFolder },
      });
    });

    it('INVALID: transformer missing -transformer.ts => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/transformers/format-date/format-date.ts',
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-transformer.ts', folderType: firstFolder },
      });
    });

    it('INVALID: guard missing -guard.ts => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'guards' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/guards/has-permission/has-permission.ts',
        firstFolder,
        folderConfig: folderConfigStatics.guards,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-guard.ts', folderType: firstFolder },
      });
    });

    it('INVALID: error missing -error.ts => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-error.ts', folderType: firstFolder },
      });
    });

    it('INVALID: widget missing -widget.tsx => reports invalidFileSuffixWithLayer', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffixWithLayer',
        data: { expected: '-widget.tsx or -widget.ts', folderType: firstFolder },
      });
    });

    it('INVALID: flow missing -flow.tsx => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'flows' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/flows/user/user.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.flows,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-flow.ts or -flow.tsx', folderType: firstFolder },
      });
    });

    it('INVALID: adapter missing -adapter.ts => reports invalidFileSuffix', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/eslint/rule/eslint-rule.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-adapter.ts', folderType: firstFolder },
      });
    });
  });

  describe('non-kebab-case filename', () => {
    it('INVALID: PascalCase filename in brokers => reports invalidFilenameCaseWithLayer', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/UserFetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFilenameCaseWithLayer',
        data: { actual: 'UserFetch-broker', expected: 'user-fetch-broker', ext: 'ts' },
      });
    });

    it('INVALID: snake_case filename in brokers => reports invalidFilenameCaseWithLayer', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user_fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'invalidFilenameCaseWithLayer',
        data: { actual: 'user_fetch-broker', expected: 'user-fetch-broker', ext: 'ts' },
      });
    });
  });

  describe('multiple Level 3 errors', () => {
    it('INVALID: adapter with wrong suffix and non-kebab name => reports both suffix and case errors', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/eslint/rule-tester/eslintRuleTester.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidFileSuffix',
        data: { expected: '-adapter.ts', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'invalidFilenameCase',
        data: {
          actual: 'eslintRuleTester-adapter',
          expected: 'eslint-rule-tester-adapter',
          ext: 'ts',
        },
      });
    });

    it('INVALID: broker with wrong suffix and PascalCase name => reports both suffix and case errors', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/UserFetch.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        isLayerFile: false,
      });

      expect(result).toBe(false);
      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidFileSuffixWithLayer',
        data: { expected: '-broker.ts', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'invalidFilenameCaseWithLayer',
        data: { actual: 'UserFetch-broker', expected: 'user-fetch-broker', ext: 'ts' },
      });
    });
  });

  describe('assets and migrations skip validation', () => {
    it('VALID: assets (empty exportSuffix and exportCase) => returns true', () => {
      validateFilenameLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'assets' });

      const result = validateFilenameLayerBroker({
        node,
        context,
        filename: '/project/src/assets/images/logo.png',
        firstFolder,
        folderConfig: folderConfigStatics.assets,
        isLayerFile: false,
      });

      expect(result).toBe(true);
      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
