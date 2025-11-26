import { typescriptProxyMockTransformerMiddleware } from './typescript-proxy-mock-transformer-middleware';
import { typescriptProxyMockTransformerMiddlewareProxy } from './typescript-proxy-mock-transformer-middleware.proxy';
import { TypescriptSourceFileStub } from '../../contracts/typescript-source-file/typescript-source-file.stub';
import { TypescriptProgramStub } from '../../contracts/typescript-program/typescript-program.stub';
import { TypescriptNodeFactoryStub } from '../../contracts/typescript-node-factory/typescript-node-factory.stub';

describe('typescriptProxyMockTransformerMiddleware', () => {
  describe('no proxy imports', () => {
    it('VALID: {sourceFile without proxy imports} => returns unchanged sourceFile', () => {
      typescriptProxyMockTransformerMiddlewareProxy();

      const sourceFile = TypescriptSourceFileStub({ value: { fileName: 'test.test.ts' } });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });
      const nodeFactory = TypescriptNodeFactoryStub({ value: {} });

      const result = typescriptProxyMockTransformerMiddleware({
        sourceFile,
        program,
        nodeFactory,
      });

      expect(result).toStrictEqual(sourceFile);
    });
  });
});
