import { mockCallContract } from './mock-call-contract';
import { MockCallStub } from './mock-call.stub';
import { ModuleNameStub } from '../module-name/module-name.stub';
import { FactoryFunctionTextStub } from '../factory-function-text/factory-function-text.stub';
import { SourceFileNameStub } from '../source-file-name/source-file-name.stub';

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
      });
    });
  });

  describe('invalid mock calls', () => {
    it('INVALID_MODULE_NAME: {moduleName: ""} => throws validation error', () => {
      expect(() => {
        return mockCallContract.parse({
          moduleName: '',
          factory: null,
          sourceFile: 'test.proxy.ts',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_MULTIPLE: {missing sourceFile} => throws validation error', () => {
      expect(() => {
        return mockCallContract.parse({
          moduleName: 'axios',
          factory: null,
        });
      }).toThrow(/Required/u);
    });
  });
});
