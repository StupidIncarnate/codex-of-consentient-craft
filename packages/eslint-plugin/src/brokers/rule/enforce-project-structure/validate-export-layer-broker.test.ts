import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { validateExportLayerBroker } from './validate-export-layer-broker';
import { validateExportLayerBrokerProxy } from './validate-export-layer-broker.proxy';
import { CollectedExportStub } from '../../../contracts/collected-export/collected-export.stub';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('validateExportLayerBroker', () => {
  describe('valid exports', () => {
    it('VALID: correct broker export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'userFetchBroker',
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

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: correct contract export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';
      const collectedExports = [CollectedExportStub({ name: 'userContract', isTypeOnly: false })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: correct error export (PascalCase) => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'errors';
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: 'ValidationError',
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

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: correct widget export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'widgets';
      const collectedExports = [CollectedExportStub({ name: 'ButtonWidget', isTypeOnly: false })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/widgets/button/button-widget.tsx',
        firstFolder,
        folderConfig: folderConfigStatics.widgets,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: startup with correct PascalCase export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';
      const collectedExports = [CollectedExportStub({ name: 'StartApp', isTypeOnly: false })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: startup with 0 exports => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/startup/start-app.ts',
        firstFolder,
        folderConfig: folderConfigStatics.startup,
        collectedExports: [],
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: value export alongside type-only export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'userFetchBroker',
          isTypeOnly: false,
        }),
        CollectedExportStub({ name: 'HelperType', isTypeOnly: true }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: correct proxy export => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'httpGetBrokerProxy',
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('missing suffix', () => {
    it('INVALID: broker without Broker suffix => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [CollectedExportStub({ name: 'userFetch', isTypeOnly: false })];

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

    it('INVALID: contract without Contract suffix => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';
      const collectedExports = [CollectedExportStub({ name: 'user', isTypeOnly: false })];

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
    it('INVALID: PascalCase broker => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'UserFetchBroker',
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

    it('INVALID: PascalCase contract => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';
      const collectedExports = [CollectedExportStub({ name: 'UserContract', isTypeOnly: false })];

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

    it('INVALID: camelCase error class => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'errors';
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: 'validationError',
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

    it('INVALID: camelCase widget => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'widgets';
      const collectedExports = [CollectedExportStub({ name: 'buttonWidget', isTypeOnly: false })];

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
    it('INVALID: wrong export name => reports filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'dataSyncBroker',
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

    it('INVALID: wrong widget name => reports filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'widgets';
      const collectedExports = [CollectedExportStub({ name: 'InputWidget', isTypeOnly: false })];

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
    it('INVALID: Transformer suffix in brokers => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'userFetchTransformer',
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

    it('INVALID: Broker suffix in transformers => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'transformers';
      const collectedExports = [
        CollectedExportStub({
          name: 'formatDateBroker',
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
    it('INVALID: PascalCase wrong-suffix wrong-name in brokers => reports suffix, case, and name mismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'WrongNameTransformer',
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

    it('INVALID: camelCase broker suffix in errors => reports suffix, case, and name mismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'errors';
      const collectedExports = [
        CollectedExportStub({
          name: 'wrongNameBroker',
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
    it('INVALID: 0 value exports in non-startup folder => reports missingExpectedExport', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';

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

    it('VALID: type-only export in a contract file (no value export) => does not report', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';
      const collectedExports = [CollectedExportStub({ name: 'User', isTypeOnly: true })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('INVALID: no exports at all in a contract file => reports missingExpectedExport', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
        folderConfig: folderConfigStatics.contracts,
        collectedExports: [],
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'userContract', actualCount: '0' },
      });
    });

    it('INVALID: type-only export in a contracts stub file => reports missingExpectedExport', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'contracts';
      const collectedExports = [CollectedExportStub({ name: 'User', isTypeOnly: true })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user.stub.ts',
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

    it('INVALID: type-only export in statics => reports missingExpectedExport', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'statics';
      const collectedExports = [CollectedExportStub({ name: 'Config', isTypeOnly: true })];

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

    it('INVALID: broker with type-only export => reports missingExpectedExport', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [CollectedExportStub({ name: 'Rule', isTypeOnly: true })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/eslint/rule/eslint-rule-broker.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: 'eslintRuleBroker', actualCount: '0' },
      });
    });
  });

  describe('multiple value exports', () => {
    it('INVALID: 2 value exports in brokers => reports multipleValueExports', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'userFetchBroker',
          isTypeOnly: false,
        }),
        CollectedExportStub({ name: 'helper', isTypeOnly: false }),
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

    it('INVALID: 2 class exports in errors => reports multipleValueExports', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'errors';
      const collectedExports = [
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: 'ValidationError',
          isTypeOnly: false,
        }),
        CollectedExportStub({
          type: 'ClassDeclaration',
          name: 'OtherError',
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

    it('INVALID: startup with 2 exports => reports multipleValueExports', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';
      const collectedExports = [
        CollectedExportStub({ name: 'StartApp', isTypeOnly: false }),
        CollectedExportStub({ name: 'StartServer', isTypeOnly: false }),
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
    it('INVALID: camelCase startup export => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';
      const collectedExports = [CollectedExportStub({ name: 'startApp', isTypeOnly: false })];

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

    it('INVALID: wrong startup name => reports filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'startup';
      const collectedExports = [CollectedExportStub({ name: 'StartServer', isTypeOnly: false })];

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
    it('INVALID: proxy missing Proxy suffix => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'brokers';
      const collectedExports = [
        CollectedExportStub({
          name: 'httpGetBroker',
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
        firstFolder,
        folderConfig: folderConfigStatics.brokers,
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
        data: { exportName: 'httpGetBroker', expectedName: 'httpGetBrokerProxy' },
      });
    });

    it('INVALID: proxy with wrong name => reports filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'transformers';
      const collectedExports = [
        CollectedExportStub({
          name: 'wrongNameProxy',
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

  describe('binding export validation', () => {
    it('INVALID: binding without Binding suffix => reports invalidExportSuffix and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'bindings';
      const collectedExports = [CollectedExportStub({ name: 'useQuest', isTypeOnly: false })];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/bindings/use-quest/use-quest-binding.ts',
        firstFolder,
        folderConfig: folderConfigStatics.bindings,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node,
        messageId: 'invalidExportSuffix',
        data: { expected: 'Binding', folderType: firstFolder },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'useQuest', expectedName: 'useQuestBinding' },
      });
    });

    it('INVALID: PascalCase binding => reports invalidExportCase and filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'bindings';
      const collectedExports = [
        CollectedExportStub({
          name: 'UseQuestBinding',
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/bindings/use-quest/use-quest-binding.ts',
        firstFolder,
        folderConfig: folderConfigStatics.bindings,
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
        data: { exportName: 'UseQuestBinding', expectedName: 'useQuestBinding' },
      });
    });

    it('INVALID: binding with wrong name => reports filenameMismatch', () => {
      validateExportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: '' });
      const firstFolder = 'bindings';
      const collectedExports = [
        CollectedExportStub({
          name: 'fetchDataBinding',
          isTypeOnly: false,
        }),
      ];

      validateExportLayerBroker({
        node,
        context,
        filename: '/project/src/bindings/use-quest/use-quest-binding.ts',
        firstFolder,
        folderConfig: folderConfigStatics.bindings,
        collectedExports,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'filenameMismatch',
        data: { exportName: 'fetchDataBinding', expectedName: 'useQuestBinding' },
      });
    });
  });
});
