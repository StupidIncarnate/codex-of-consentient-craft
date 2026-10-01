// Types for `node-modules-transformer.js`, so a TypeScript test can import the plain-CJS transformer.

export type NodeModulesModuleKind = 'esm' | 'cjs';

export type NodeModulesTransformedSource = { code: string; map?: unknown };

export type NodeModulesTransformer = {
  getCacheKey: (source: string, filePath: string, transformOptions: unknown) => string;
  getCacheKeyAsync: (source: string, filePath: string, transformOptions: unknown) => Promise<string>;
  process: (
    source: string,
    filePath: string,
    transformOptions: unknown,
  ) => NodeModulesTransformedSource;
  processAsync: (
    source: string,
    filePath: string,
    transformOptions: unknown,
  ) => Promise<NodeModulesTransformedSource>;
};

export declare const createTransformer: (tsJestOptions: unknown) => NodeModulesTransformer;

export declare const nodeModulesModuleKind: (params: {
  source: string;
  filePath: string;
}) => NodeModulesModuleKind;

export declare const NODE_MODULES_TRANSFORMER_VERSION: string;
