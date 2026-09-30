import { mockCallContract } from './mock-call-contract';
import { MockCallStub } from './mock-call.stub';

describe('mockCallContract', () => {
  describe('valid mock calls', () => {
    it('VALID: {moduleName, factory: null, sourceFile} => parses without factory', () => {
      const mockCall = MockCallStub({
        moduleName: 'axios',
        factory: null,
        sourceFile: 'test.proxy.ts',
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
        moduleName: 'fs',
        factory: '() => ({ readFile: jest.fn() })',
        sourceFile: 'adapter.proxy.ts',
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
        moduleName: '@testing-library/react',
        factory: null,
        sourceFile: 'widget.proxy.tsx',
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
        moduleName: '@dungeonmaster/orchestrator',
        factory: null,
        sourceFile: 'orchestration-events-state.proxy.ts',
        objectIdentifierNames: ['orchestrationEventsState'],
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
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {missing sourceFile} => throws validation error', () => {
      expect(() => {
        return mockCallContract.parse({
          moduleName: 'axios',
          factory: null,
        });
      }).toThrow(/received undefined/u);
    });
  });
});
