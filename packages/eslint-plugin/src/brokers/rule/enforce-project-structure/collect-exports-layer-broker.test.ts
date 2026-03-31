import { collectExportsLayerBroker } from './collect-exports-layer-broker';
import { collectExportsLayerBrokerProxy } from './collect-exports-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

describe('collectExportsLayerBroker', () => {
  describe('valid named exports', () => {
    it('VALID: arrow function variable declaration => collects export', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'userFetchBroker' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  id: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: exportName,
                  }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.ArrowFunctionExpression,
                  }),
                }),
              ],
            }),
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'VariableDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: class declaration export => collects export', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'ValidationError' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.ClassDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: exportName,
              }),
            }),
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'errors' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/errors/validation/validation-error.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'ClassDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: function declaration export => collects export', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'apiClientBroker' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.FunctionDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: exportName,
              }),
            }),
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/api/client/api-client-broker.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'FunctionDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: type-only export => skips and returns empty', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'type',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
            }),
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EMPTY: no exports => returns empty array', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.VariableDeclaration,
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EMPTY: body is undefined => returns empty array', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: undefined,
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('forbidden export patterns', () => {
    it('INVALID: default export => reports noDefaultExport and returns null', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportDefaultDeclaration,
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({ node, messageId: 'noDefaultExport' });
    });

    it('INVALID: export * from => reports noNamespaceExport and returns null', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportAllDeclaration,
          }),
        ],
      });
      const firstFolder = IdentifierStub({ value: 'brokers' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({ node, messageId: 'noNamespaceExport' });
    });

    it('INVALID: re-export with source => reports noReExport and returns null', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: TsestreeStub({ type: TsestreeNodeType.Literal }),
            declaration: null,
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'noReExport',
        data: { folderType: firstFolder },
      });
    });

    it('INVALID: named export without declaration => reports noReExport', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: null,
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'noReExport',
        data: { folderType: firstFolder },
      });
    });
  });

  describe('adapter must be arrow function', () => {
    it('INVALID: re-exported variable in adapters => reports adapterMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  id: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: IdentifierStub({ value: 'loadAdapter' }),
                  }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                  }),
                }),
              ],
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/typescript-eslint/load/typescript-eslint-load-adapter.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 're-exported variable' },
      });
    });

    it('INVALID: function declaration in adapters => reports adapterMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.FunctionDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: IdentifierStub({ value: 'axiosGetAdapter' }),
              }),
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 'function declaration' },
      });
    });

    it('INVALID: class declaration in adapters => reports adapterMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.ClassDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: IdentifierStub({ value: 'AxiosGetAdapter' }),
              }),
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 'class' },
      });
    });
  });

  describe('proxy must be arrow function', () => {
    it('INVALID: function declaration in proxy file => reports proxyMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.FunctionDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: IdentifierStub({ value: 'httpGetAdapterProxy' }),
              }),
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'function declaration' },
      });
    });

    it('INVALID: class declaration in proxy file => reports proxyMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.ClassDeclaration,
              id: TsestreeStub({
                type: TsestreeNodeType.Identifier,
                name: IdentifierStub({ value: 'HttpGetAdapterProxy' }),
              }),
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'class' },
      });
    });

    it('INVALID: non-arrow variable in proxy file => reports proxyMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  id: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: IdentifierStub({ value: 'userFetchBrokerProxy' }),
                  }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.FunctionExpression,
                  }),
                }),
              ],
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
        firstFolder,
      });

      expect(result).toBe(null);
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'function expression' },
      });
    });
  });

  describe('arrow function adapters and proxies pass', () => {
    it('VALID: arrow function adapter => collects without error', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'axiosGetAdapter' });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  id: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: exportName,
                  }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.ArrowFunctionExpression,
                  }),
                }),
              ],
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'VariableDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: arrow function proxy => collects without error', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'httpGetAdapterProxy' });
      const firstFolder = IdentifierStub({ value: 'adapters' });
      const node = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          TsestreeStub({
            type: TsestreeNodeType.ExportNamedDeclaration,
            exportKind: 'value',
            source: null,
            declaration: TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  id: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: exportName,
                  }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.ArrowFunctionExpression,
                  }),
                }),
              ],
            }),
          }),
        ],
      });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'VariableDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
