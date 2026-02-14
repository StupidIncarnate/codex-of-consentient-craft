import { collectExportsLayerBroker } from './collect-exports-layer-broker';
import { collectExportsLayerBrokerProxy } from './collect-exports-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

describe('collectExportsLayerBroker', () => {
  describe('valid named exports', () => {
    it('collects arrow function variable declaration', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('collects class declaration export', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('collects function declaration export', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('skips type-only exports', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns empty array for no exports', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('returns empty array when body is undefined', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('forbidden export patterns', () => {
    it('reports noDefaultExport and returns null for default export', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({ node, messageId: 'noDefaultExport' });
    });

    it('reports noNamespaceExport and returns null for export * from', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({ node, messageId: 'noNamespaceExport' });
    });

    it('reports noReExport and returns null for re-export with source', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'noReExport',
        data: { folderType: firstFolder },
      });
    });

    it('reports noReExport for named export without declaration', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'noReExport',
        data: { folderType: firstFolder },
      });
    });
  });

  describe('adapter must be arrow function', () => {
    it('reports adapterMustBeArrowFunction for re-exported variable in adapters', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 're-exported variable' },
      });
    });

    it('reports adapterMustBeArrowFunction for function declaration in adapters', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 'function declaration' },
      });
    });

    it('reports adapterMustBeArrowFunction for class declaration in adapters', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterMustBeArrowFunction',
        data: { actualType: 'class' },
      });
    });
  });

  describe('proxy must be arrow function', () => {
    it('reports proxyMustBeArrowFunction for function declaration in proxy file', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'function declaration' },
      });
    });

    it('reports proxyMustBeArrowFunction for class declaration in proxy file', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'class' },
      });
    });

    it('reports proxyMustBeArrowFunction for non-arrow variable in proxy file', () => {
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

      expect(result).toBeNull();
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'proxyMustBeArrowFunction',
        data: { actualType: 'function expression' },
      });
    });
  });

  describe('arrow function adapters and proxies pass', () => {
    it('collects arrow function adapter without error', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('collects arrow function proxy without error', () => {
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
      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
