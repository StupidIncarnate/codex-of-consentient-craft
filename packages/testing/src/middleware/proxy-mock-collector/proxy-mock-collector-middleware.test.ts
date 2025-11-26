import { proxyMockCollectorMiddleware } from './proxy-mock-collector-middleware';
import { proxyMockCollectorMiddlewareProxy } from './proxy-mock-collector-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../contracts/typescript-program/typescript-program.stub';

describe('proxyMockCollectorMiddleware', () => {
  describe('invalid program', () => {
    it('VALID: {program with no source file} => returns empty array', () => {
      proxyMockCollectorMiddlewareProxy();

      const proxyFilePath = FilePathStub({ value: '/nonexistent.proxy.ts' });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });

      const result = proxyMockCollectorMiddleware({ proxyFilePath, program });

      expect(result).toStrictEqual([]);
    });
  });
});
