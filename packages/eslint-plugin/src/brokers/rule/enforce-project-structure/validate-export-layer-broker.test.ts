import { validateExportLayerBroker } from './validate-export-layer-broker';
import { validateExportLayerBrokerProxy } from './validate-export-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { CollectedExportStub } from '../../../contracts/collected-export/collected-export.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateExportLayerBroker', () => {
  describe('valid exports', () => {
    it('does not report for correct broker export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'userFetchBroker' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for correct contract export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'userContract' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for correct error export (PascalCase)', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: IdentifierStub({ value: 'ValidationError' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for correct widget export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'ButtonWidget' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for startup with correct PascalCase export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'StartApp' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for startup with 0 exports', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports: [],
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for value export alongside type-only export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'userFetchBroker' }),
          isTypeOnly: false,
        }),
        CollectedExportStub({ name: IdentifierStub({ value: 'HelperType' }), isTypeOnly: true }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report for correct proxy export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'httpGetAdapterProxy' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('missing suffix', () => {
    it('reports invalidExportSuffix and filenameMismatch for broker without Broker suffix', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'userFetch' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Broker', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'userFetch', expectedName: 'userFetchBroker' },
      });
    });

    it('reports invalidExportSuffix and filenameMismatch for contract without Contract suffix', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'user' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Contract', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'user', expectedName: 'userContract' },
      });
    });
  });

  describe('wrong case', () => {
    it('reports invalidExportCase and filenameMismatch for PascalCase broker', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'UserFetchBroker' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'camelCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'UserFetchBroker', expectedName: 'userFetchBroker' },
      });
    });

    it('reports invalidExportCase and filenameMismatch for PascalCase contract', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'UserContract' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'camelCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'UserContract', expectedName: 'userContract' },
      });
    });

    it('reports invalidExportCase and filenameMismatch for camelCase error class', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: IdentifierStub({ value: 'validationError' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'PascalCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'validationError', expectedName: 'ValidationError' },
      });
    });

    it('reports invalidExportCase and filenameMismatch for camelCase widget', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'buttonWidget' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'PascalCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'buttonWidget', expectedName: 'ButtonWidget' },
      });
    });
  });

  describe('name mismatch', () => {
    it('reports filenameMismatch for wrong export name', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'dataSyncBroker' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'dataSyncBroker', expectedName: 'userFetchBroker' },
      });
    });

    it('reports filenameMismatch for wrong widget name', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'widgets' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'InputWidget' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'InputWidget', expectedName: 'ButtonWidget' },
      });
    });
  });

  describe('wrong suffix for folder type', () => {
    it('reports invalidExportSuffix and filenameMismatch for Transformer suffix in brokers', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'userFetchTransformer' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Broker', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'userFetchTransformer', expectedName: 'userFetchBroker' },
      });
    });

    it('reports invalidExportSuffix and filenameMismatch for Broker suffix in transformers', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'formatDateBroker' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/transformers/format-date/format-date-transformer.ts',
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Transformer', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'formatDateBroker', expectedName: 'formatDateTransformer' },
      });
    });
  });

  describe('all three Level 4 errors', () => {
    it('reports suffix, case, and name mismatch for PascalCase wrong-suffix wrong-name in brokers', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'WrongNameTransformer' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(3);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Broker', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'camelCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(3, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'WrongNameTransformer', expectedName: 'userFetchBroker' },
      });
    });

    it('reports suffix, case, and name mismatch for camelCase broker suffix in errors', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'wrongNameBroker' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(3);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Error', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'PascalCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(3, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'wrongNameBroker', expectedName: 'ValidationError' },
      });
    });
  });

  describe('missing expected export', () => {
    it('reports missingExpectedExport for 0 value exports in non-startup folder', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports: [],
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'userFetchBroker', actualCount: '0' },
      });
    });

    it('reports missingExpectedExport for type-only export in contracts (no value export)', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'User' }), isTypeOnly: true }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'userContract', actualCount: '0' },
      });
    });

    it('reports missingExpectedExport for type-only export in statics', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'statics' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'Config' }), isTypeOnly: true }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/statics/config/config-statics.ts',
        firstFolder,
        folderConfig: folderConfigStatics.statics,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'configStatics', actualCount: '0' },
      });
    });

    it('reports missingExpectedExport for adapter with type-only export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'Rule' }), isTypeOnly: true }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/eslint/rule/eslint-rule-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'eslintRuleAdapter', actualCount: '0' },
      });
    });
  });

  describe('multiple value exports', () => {
    it('reports multipleValueExports for 2 value exports in brokers', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'userFetchBroker' }),
          isTypeOnly: false,
        }),
        CollectedExportStub({ name: IdentifierStub({ value: 'helper' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'multipleValueExports',
        data: {
          expectedName: 'userFetchBroker',
          actualCount: '2',
          exportNames: 'userFetchBroker, helper',
        },
      });
    });

    it('reports multipleValueExports for 2 class exports in errors', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'errors' });
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: IdentifierStub({ value: 'ValidationError' }),
          isTypeOnly: false,
        }),
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: IdentifierStub({ value: 'OtherError' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
        folderConfig: folderConfigStatics.errors,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'multipleValueExports',
        data: {
          expectedName: 'ValidationError',
          actualCount: '2',
          exportNames: 'ValidationError, OtherError',
        },
      });
    });

    it('reports multipleValueExports for startup with 2 exports', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'StartApp' }), isTypeOnly: false }),
        CollectedExportStub({ name: IdentifierStub({ value: 'StartServer' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'multipleValueExports',
        data: { expectedName: 'StartApp', actualCount: '2', exportNames: 'StartApp, StartServer' },
      });
    });
  });

  describe('startup specific cases', () => {
    it('reports invalidExportCase and filenameMismatch for camelCase startup export', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'startApp' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'PascalCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'startApp', expectedName: 'StartApp' },
      });
    });

    it('reports filenameMismatch for wrong startup name', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'startup' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'StartServer' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'StartServer', expectedName: 'StartApp' },
      });
    });
  });

  describe('proxy export validation', () => {
    it('reports invalidExportSuffix and filenameMismatch for proxy missing Proxy suffix', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'httpGetAdapter' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Proxy', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'httpGetAdapter', expectedName: 'httpGetAdapterProxy' },
      });
    });

    it('reports filenameMismatch for proxy with wrong name', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'transformers' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'wrongNameProxy' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/transformers/format-date/format-date-transformer.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.transformers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'wrongNameProxy', expectedName: 'formatDateTransformerProxy' },
      });
    });
  });

  describe('adapter export validation', () => {
    it('reports invalidExportSuffix and filenameMismatch for adapter without Adapter suffix', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({ name: IdentifierStub({ value: 'axiosGet' }), isTypeOnly: false }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Adapter', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'axiosGet', expectedName: 'axiosGetAdapter' },
      });
    });

    it('reports invalidExportCase and filenameMismatch for PascalCase adapter', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'AxiosGetAdapter' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportCase',
        data: { expected: 'camelCase', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'AxiosGetAdapter', expectedName: 'axiosGetAdapter' },
      });
    });

    it('reports filenameMismatch for adapter with wrong name', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.Program });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const collectedExports = [
        CollectedExportStub({
          name: IdentifierStub({ value: 'fetchDataAdapter' }),
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
        folderConfig: folderConfigStatics.adapters,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'fetchDataAdapter', expectedName: 'axiosGetAdapter' },
      });
    });
  });
});
