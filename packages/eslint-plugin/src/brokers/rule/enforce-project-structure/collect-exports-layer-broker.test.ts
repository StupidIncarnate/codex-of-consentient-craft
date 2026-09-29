import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { collectExportsLayerBroker } from './collect-exports-layer-broker';
import { collectExportsLayerBrokerProxy } from './collect-exports-layer-broker.proxy';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

describe('collectExportsLayerBroker', () => {
  describe('valid named exports', () => {
    it('VALID: arrow function variable declaration => collects export', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'userFetchBroker' });
      const node = ProgramStub({ code: 'export const userFetchBroker = () => {};' });
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
      const context = RuleContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'ValidationError' });
      const node = ProgramStub({ code: 'export class ValidationError {}' });
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
      const context = RuleContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'apiClientBroker' });
      const node = ProgramStub({ code: 'export function apiClientBroker() {}' });
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

    it('VALID: export type alias => collects a type entry', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: 'export type UserId = string;' });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        {
          type: 'TSTypeAliasDeclaration',
          name: IdentifierStub({ value: 'UserId' }),
          isTypeOnly: true,
        },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: export interface => collects a type entry', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: 'export interface UserApi { load: () => void }' });
      const firstFolder = IdentifierStub({ value: 'contracts' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/contracts/user/user-contract.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        {
          type: 'TSInterfaceDeclaration',
          name: IdentifierStub({ value: 'UserApi' }),
          isTypeOnly: true,
        },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: export type specifier list => skips and returns empty', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: 'type UserId = string;\nexport type { UserId };' });
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

    it('VALID: export type from a source => skips and returns empty', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: "export type { UserId } from './user-id';" });
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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: 'const x;' });
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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: 'export default x;' });
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
      const context = RuleContextStub({ report: mockReport });
      const node = ProgramStub({ code: "export * from 'x';" });
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
      const context = RuleContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: "export { userFetchBroker } from './user-fetch-broker';" });

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
      const context = RuleContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'contracts' });
      const node = ProgramStub({ code: 'export {  };' });

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

  describe('proxy must be arrow function', () => {
    it('INVALID: function declaration in proxy file => reports proxyMustBeArrowFunction', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: 'export function httpGetBrokerProxy() {}' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
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
      const context = RuleContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: 'export class HttpGetBrokerProxy {}' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
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
      const context = RuleContextStub({ report: mockReport });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: 'export const userFetchBrokerProxy = function () {};' });

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

  describe('arrow function brokers and proxies pass', () => {
    it('VALID: arrow function broker => collects without error', () => {
      collectExportsLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'axiosGetBroker' });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: 'export const axiosGetBroker = () => {};' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/axios/get/axios-get-broker.ts',
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
      const context = RuleContextStub({ report: mockReport });
      const exportName = IdentifierStub({ value: 'httpGetBrokerProxy' });
      const firstFolder = IdentifierStub({ value: 'brokers' });
      const node = ProgramStub({ code: 'export const httpGetBrokerProxy = () => {};' });

      const result = collectExportsLayerBroker({
        node,
        context,
        filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
        firstFolder,
      });

      expect(result).toStrictEqual([
        { type: 'VariableDeclaration', name: exportName, isTypeOnly: false },
      ]);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
