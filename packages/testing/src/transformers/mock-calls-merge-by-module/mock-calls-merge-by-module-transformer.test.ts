import { mockCallsMergeByModuleTransformer } from './mock-calls-merge-by-module-transformer';
import { MockCallStub } from '../../contracts/mock-call/mock-call.stub';
import { ModuleNameStub } from '../../contracts/module-name/module-name.stub';
import { IdentifierNameStub } from '../../contracts/identifier-name/identifier-name.stub';
import { FactoryFunctionTextStub } from '../../contracts/factory-function-text/factory-function-text.stub';

describe('mockCallsMergeByModuleTransformer', () => {
  describe('two specifiers for the same Node builtin', () => {
    it('VALID: {"fs" mocking readFile, "node:fs" mocking writeFile} => merges into one record naming both identifiers', () => {
      const bareMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs' }),
        identifierNames: [IdentifierNameStub({ value: 'readFile' })],
      });
      const prefixedMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'node:fs' }),
        identifierNames: [IdentifierNameStub({ value: 'writeFile' })],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [bareMock, prefixedMock] });

      expect(result).toStrictEqual([
        {
          moduleName: ModuleNameStub({ value: 'fs' }),
          factory: null,
          sourceFile: bareMock.sourceFile,
          identifierNames: [
            IdentifierNameStub({ value: 'readFile' }),
            IdentifierNameStub({ value: 'writeFile' }),
          ],
        },
      ]);
    });
  });

  describe('the process cwd/kill collision', () => {
    it('VALID: {"process" mocking cwd, "node:process" mocking kill} => merges into one record mocking both', () => {
      const cwdMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'process' }),
        identifierNames: [IdentifierNameStub({ value: 'cwd' })],
      });
      const killMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'node:process' }),
        identifierNames: [IdentifierNameStub({ value: 'kill' })],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [cwdMock, killMock] });

      expect(result).toStrictEqual([
        {
          moduleName: ModuleNameStub({ value: 'process' }),
          factory: null,
          sourceFile: cwdMock.sourceFile,
          identifierNames: [
            IdentifierNameStub({ value: 'cwd' }),
            IdentifierNameStub({ value: 'kill' }),
          ],
        },
      ]);
    });
  });

  describe('an explicit factory arriving after identifier-based mocks', () => {
    it('VALID: {identifier mock then factory mock, same module} => the factory wins', () => {
      const identifierMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        identifierNames: [IdentifierNameStub({ value: 'get' })],
      });
      const factoryMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' }),
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [identifierMock, factoryMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });
  });

  describe('a factory that already won', () => {
    it('VALID: {factory mock then identifier mock, same module} => the factory stays and the later identifier is dropped', () => {
      const factoryMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' }),
      });
      const identifierMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        identifierNames: [IdentifierNameStub({ value: 'get' })],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [factoryMock, identifierMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });
  });

  describe('unrelated modules', () => {
    it('VALID: {"fs" mock, "path" mock} => stays as two separate records', () => {
      const fsMock = MockCallStub({ moduleName: ModuleNameStub({ value: 'fs' }) });
      const pathMock = MockCallStub({ moduleName: ModuleNameStub({ value: 'path' }) });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [fsMock, pathMock] });

      expect(result).toStrictEqual([fsMock, pathMock]);
    });
  });

  describe('no mock calls', () => {
    it('EMPTY: {mockCalls: []} => returns an empty array', () => {
      const result = mockCallsMergeByModuleTransformer({ mockCalls: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
