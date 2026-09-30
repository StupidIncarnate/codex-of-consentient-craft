import { proxyImportEdgeContract } from './proxy-import-edge-contract';
import { ProxyImportEdgeStub } from './proxy-import-edge.stub';

describe('proxyImportEdgeContract', () => {
  describe('valid edges', () => {
    it('VALID: {kind: import, names: null} => parses wildcard import edge', () => {
      const edge = ProxyImportEdgeStub({
        kind: 'import',
        importPath: './child.proxy',
        names: null,
      });

      const result = proxyImportEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        kind: 'import',
        importPath: './child.proxy',
        names: null,
      });
    });

    it('VALID: {kind: reexport, names: [x]} => parses named reexport edge', () => {
      const edge = ProxyImportEdgeStub({
        kind: 'reexport',
        importPath: './barrel-target.proxy',
        names: ['pathJoinAdapterProxy'],
      });

      const result = proxyImportEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        kind: 'reexport',
        importPath: './barrel-target.proxy',
        names: ['pathJoinAdapterProxy'],
      });
    });
  });

  describe('invalid edges', () => {
    it('INVALID: {kind: "export"} => throws validation error', () => {
      expect(() => {
        return proxyImportEdgeContract.parse({
          kind: 'export',
          importPath: './x.proxy',
          names: null,
        });
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {missing importPath} => throws validation error', () => {
      expect(() => {
        return proxyImportEdgeContract.parse({
          kind: 'import',
          names: null,
        });
      }).toThrow(/received undefined/u);
    });
  });
});
