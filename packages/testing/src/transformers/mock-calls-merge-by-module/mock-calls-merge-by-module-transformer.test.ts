import { mockCallsMergeByModuleTransformer } from './mock-calls-merge-by-module-transformer';
import { MockCallStub } from '../../contracts/mock-call/mock-call.stub';
import { ModuleNameStub } from '../../contracts/module-name/module-name.stub';
import { IdentifierNameStub } from '../../contracts/identifier-name/identifier-name.stub';
import { FactoryFunctionTextStub } from '../../contracts/factory-function-text/factory-function-text.stub';
import { SourceFileNameStub } from '../../contracts/source-file-name/source-file-name.stub';

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

  describe('two full auto-mock requests for the same module (empty+empty)', () => {
    it('VALID: {two property-access mocks, same module} => stays a single full auto-mock record', () => {
      const firstMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'first.proxy.ts' }),
        identifierNames: [],
      });
      const secondMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'second.proxy.ts' }),
        identifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [firstMock, secondMock] });

      expect(result).toStrictEqual([firstMock]);
    });
  });

  describe('a full auto-mock merging with a selective mock (empty+names)', () => {
    it('VALID: {property-access mock (empty) then bare-export mock (named), same module} => merges into one full auto-mock record, dropping the selective name', () => {
      const propertyAccessMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'start-orchestrator.proxy.ts' }),
        identifierNames: [],
      });
      const bareExportMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'quest-list-broker.proxy.ts' }),
        identifierNames: [IdentifierNameStub({ value: 'questListBroker' })],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [propertyAccessMock, bareExportMock],
      });

      expect(result).toStrictEqual([propertyAccessMock]);
    });

    it('VALID: {bare-export mock (named) then property-access mock (empty), same module} => merges into one full auto-mock record regardless of arrival order', () => {
      const bareExportMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'quest-list-broker.proxy.ts' }),
        identifierNames: [IdentifierNameStub({ value: 'questListBroker' })],
      });
      const propertyAccessMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        sourceFile: SourceFileNameStub({ value: 'start-orchestrator.proxy.ts' }),
        identifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [bareExportMock, propertyAccessMock],
      });

      expect(result).toStrictEqual([
        {
          moduleName: bareExportMock.moduleName,
          factory: null,
          sourceFile: bareExportMock.sourceFile,
          identifierNames: [],
        },
      ]);
    });
  });

  describe('two selective mocks for the same module (names+names)', () => {
    it('VALID: {bare-export mock naming "a", bare-export mock naming "b" and "a", same module} => unions identifierNames without duplicating "a"', () => {
      const firstMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        identifierNames: [IdentifierNameStub({ value: 'questListBroker' })],
      });
      const secondMock = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        identifierNames: [
          IdentifierNameStub({ value: 'questOutboxWatchBroker' }),
          IdentifierNameStub({ value: 'questListBroker' }),
        ],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [firstMock, secondMock] });

      expect(result).toStrictEqual([
        {
          moduleName: firstMock.moduleName,
          factory: null,
          sourceFile: firstMock.sourceFile,
          identifierNames: [
            IdentifierNameStub({ value: 'questListBroker' }),
            IdentifierNameStub({ value: 'questOutboxWatchBroker' }),
          ],
        },
      ]);
    });
  });

  describe('factory precedence over a full auto-mock request (factory+empty)', () => {
    it('VALID: {property-access mock (empty) then factory mock, same module} => the factory wins', () => {
      const propertyAccessMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        identifierNames: [],
      });
      const factoryMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' }),
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [propertyAccessMock, factoryMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });

    it('VALID: {factory mock then property-access mock (empty), same module} => the factory stays and the auto-mock request is dropped', () => {
      const factoryMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' }),
      });
      const propertyAccessMock = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        identifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [factoryMock, propertyAccessMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });
  });
});
