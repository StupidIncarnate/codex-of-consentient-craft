import { mockCallsMergeByModuleTransformer } from './mock-calls-merge-by-module-transformer';
import { MockCallStub } from '../../contracts/mock-call/mock-call.stub';

describe('mockCallsMergeByModuleTransformer', () => {
  describe('two specifiers for the same Node builtin', () => {
    it('VALID: {"fs" mocking readFile, "node:fs" mocking writeFile} => merges into one record naming both identifiers', () => {
      const bareMock = MockCallStub({
        moduleName: 'fs',
        identifierNames: ['readFile'],
      });
      const prefixedMock = MockCallStub({
        moduleName: 'node:fs',
        identifierNames: ['writeFile'],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [bareMock, prefixedMock] });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: bareMock.sourceFile,
          identifierNames: ['readFile', 'writeFile'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('the process cwd/kill collision', () => {
    it('VALID: {"process" mocking cwd, "node:process" mocking kill} => merges into one record mocking both', () => {
      const cwdMock = MockCallStub({
        moduleName: 'process',
        identifierNames: ['cwd'],
      });
      const killMock = MockCallStub({
        moduleName: 'node:process',
        identifierNames: ['kill'],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [cwdMock, killMock] });

      expect(result).toStrictEqual([
        {
          moduleName: 'process',
          factory: null,
          sourceFile: cwdMock.sourceFile,
          identifierNames: ['cwd', 'kill'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('an explicit factory arriving after identifier-based mocks', () => {
    it('VALID: {identifier mock then factory mock, same module} => the factory wins', () => {
      const identifierMock = MockCallStub({
        moduleName: 'axios',
        identifierNames: ['get'],
      });
      const factoryMock = MockCallStub({
        moduleName: 'axios',
        factory: '() => ({ get: jest.fn() })',
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
        moduleName: 'axios',
        factory: '() => ({ get: jest.fn() })',
      });
      const identifierMock = MockCallStub({
        moduleName: 'axios',
        identifierNames: ['get'],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [factoryMock, identifierMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });
  });

  describe('unrelated modules', () => {
    it('VALID: {"fs" mock, "path" mock} => stays as two separate records', () => {
      const fsMock = MockCallStub({ moduleName: 'fs' });
      const pathMock = MockCallStub({ moduleName: 'path' });

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
    it('VALID: {two bare registerModuleMock requests, same module} => stays a single full auto-mock record', () => {
      const firstMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'first.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });
      const secondMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'second.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [firstMock, secondMock] });

      expect(result).toStrictEqual([firstMock]);
    });
  });

  describe('a full auto-mock merging with a selective mock (empty+names)', () => {
    it('VALID: {bare registerModuleMock request (full-auto) then bare-export mock (named), same module} => merges into one full auto-mock record, dropping the selective name', () => {
      const fullAutoMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'whole-module.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });
      const bareExportMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'quest-list-broker.proxy.ts',
        identifierNames: ['questListBroker'],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [fullAutoMock, bareExportMock],
      });

      expect(result).toStrictEqual([fullAutoMock]);
    });

    it('VALID: {bare-export mock (named) then bare registerModuleMock request (full-auto), same module} => merges into one full auto-mock record regardless of arrival order', () => {
      const bareExportMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'quest-list-broker.proxy.ts',
        identifierNames: ['questListBroker'],
      });
      const fullAutoMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'whole-module.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [bareExportMock, fullAutoMock],
      });

      expect(result).toStrictEqual([
        {
          moduleName: bareExportMock.moduleName,
          factory: null,
          sourceFile: bareExportMock.sourceFile,
          identifierNames: [],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('two selective mocks for the same module (names+names)', () => {
    it('VALID: {bare-export mock naming "a", bare-export mock naming "b" and "a", same module} => unions identifierNames without duplicating "a"', () => {
      const firstMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: ['questListBroker'],
      });
      const secondMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: ['questOutboxWatchBroker', 'questListBroker'],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [firstMock, secondMock] });

      expect(result).toStrictEqual([
        {
          moduleName: firstMock.moduleName,
          factory: null,
          sourceFile: firstMock.sourceFile,
          identifierNames: ['questListBroker', 'questOutboxWatchBroker'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('two property-access mocks for the same module (objectNames+objectNames)', () => {
    it('VALID: {property-access mock naming StartOrchestrator, property-access mock naming orchestrationEventsState, same module} => unions objectIdentifierNames, keeping identifierNames empty', () => {
      const firstMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: [],
        objectIdentifierNames: ['StartOrchestrator'],
      });
      const secondMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: [],
        objectIdentifierNames: ['orchestrationEventsState'],
      });

      const result = mockCallsMergeByModuleTransformer({ mockCalls: [firstMock, secondMock] });

      expect(result).toStrictEqual([
        {
          moduleName: firstMock.moduleName,
          factory: null,
          sourceFile: firstMock.sourceFile,
          identifierNames: [],
          objectIdentifierNames: ['StartOrchestrator', 'orchestrationEventsState'],
        },
      ]);
    });
  });

  describe('a property-access mock merging with a bare-export mock (objectNames+names)', () => {
    it('VALID: {property-access mock naming StartOrchestrator, bare-export mock naming questListBroker, same module} => keeps both arrays populated separately', () => {
      const propertyAccessMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: [],
        objectIdentifierNames: ['StartOrchestrator'],
      });
      const bareExportMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        identifierNames: ['questListBroker'],
        objectIdentifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [propertyAccessMock, bareExportMock],
      });

      expect(result).toStrictEqual([
        {
          moduleName: propertyAccessMock.moduleName,
          factory: null,
          sourceFile: propertyAccessMock.sourceFile,
          identifierNames: ['questListBroker'],
          objectIdentifierNames: ['StartOrchestrator'],
        },
      ]);
    });
  });

  describe('a full auto-mock absorbing a property-access mock (empty+objectNames)', () => {
    it('VALID: {bare registerModuleMock request (full-auto) then property-access mock, same module} => merges into one full auto-mock record, dropping the object name', () => {
      const fullAutoMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'whole-module.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });
      const propertyAccessMock = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        sourceFile: 'start-orchestrator.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: ['StartOrchestrator'],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [fullAutoMock, propertyAccessMock],
      });

      expect(result).toStrictEqual([fullAutoMock]);
    });
  });

  describe('factory precedence over a full auto-mock request (factory+empty)', () => {
    it('VALID: {full-auto request then factory mock, same module} => the factory wins', () => {
      const fullAutoMock = MockCallStub({
        moduleName: 'axios',
        identifierNames: [],
        objectIdentifierNames: [],
      });
      const factoryMock = MockCallStub({
        moduleName: 'axios',
        factory: '() => ({ get: jest.fn() })',
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [fullAutoMock, factoryMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });

    it('VALID: {factory mock then full-auto request, same module} => the factory stays and the auto-mock request is dropped', () => {
      const factoryMock = MockCallStub({
        moduleName: 'axios',
        factory: '() => ({ get: jest.fn() })',
      });
      const fullAutoMock = MockCallStub({
        moduleName: 'axios',
        identifierNames: [],
        objectIdentifierNames: [],
      });

      const result = mockCallsMergeByModuleTransformer({
        mockCalls: [factoryMock, fullAutoMock],
      });

      expect(result).toStrictEqual([factoryMock]);
    });
  });
});
