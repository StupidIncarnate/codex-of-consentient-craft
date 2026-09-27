import { mockCallContract } from './mock-call-contract';
import { MockCallStub } from './mock-call.stub';
import { ModuleNameStub } from '../module-name/module-name.stub';
import { FactoryFunctionTextStub } from '../factory-function-text/factory-function-text.stub';
import { SourceFileNameStub } from '../source-file-name/source-file-name.stub';
import { IdentifierNameStub } from '../identifier-name/identifier-name.stub';

describe('mockCallContract', () => {
  describe('valid mock calls', () => {
    it('VALID: {moduleName, factory: null, sourceFile} => parses without factory', () => {
      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const result = mockCallContract.parse(mockCall);

      expect(result).toStrictEqual({
        moduleName: 'axios',
        factory: null,
        sourceFile: 'test.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });
    });

    it('VALID: {moduleName, factory, sourceFile} => parses with factory', () => {
      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs' }),
        factory: FactoryFunctionTextStub({ value: '() => ({ readFile: jest.fn() })' }),
        sourceFile: SourceFileNameStub({ value: 'adapter.proxy.ts' }),
      });

      const result = mockCallContract.parse(mockCall);

      expect(result).toStrictEqual({
        moduleName: 'fs',
        factory: '() => ({ readFile: jest.fn() })',
        sourceFile: 'adapter.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      });
    });

    it('VALID: {scoped module name} => parses scoped package', () => {
      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: '@testing-library/react' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'widget.proxy.tsx' }),
      });

      const result = mockCallContract.parse(mockCall);

      expect(result).toStrictEqual({
        moduleName: '@testing-library/react',
        factory: null,
        sourceFile: 'widget.proxy.tsx',
        identifierNames: [],
        objectIdentifierNames: [],
      });
    });

    it('VALID: {objectIdentifierNames: [name]} => parses a property-access mock request', () => {
      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: '@dungeonmaster/orchestrator' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'orchestration-events-state.proxy.ts' }),
        objectIdentifierNames: [IdentifierNameStub({ value: 'orchestrationEventsState' })],
      });

      const result = mockCallContract.parse(mockCall);

      expect(result).toStrictEqual({
        moduleName: '@dungeonmaster/orchestrator',
        factory: null,
        sourceFile: 'orchestration-events-state.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: ['orchestrationEventsState'],
      });
    });
  });

  describe('invalid mock calls', () => {
    it('INVALID: {moduleName: ""} => throws validation error', () => {
      expect(() => {
        return mockCallContract.parse({
          moduleName: '',
          factory: null,
          sourceFile: 'test.proxy.ts',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing sourceFile} => throws validation error', () => {
      expect(() => {
        return mockCallContract.parse({
          moduleName: 'axios',
          factory: null,
        });
      }).toThrow(/Required/u);
    });
  });
});
