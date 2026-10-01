// Types for `ts-source-transformer.js`, so a TypeScript test can import the plain-CJS transformer.

export type TsSourceTransformedSource = { code: string; map?: unknown };

export type TsSourceTransformer = {
  getCacheKey: (source: string, filePath: string, transformOptions: unknown) => string;
  getCacheKeyAsync: (source: string, filePath: string, transformOptions: unknown) => Promise<string>;
  process: (source: string, filePath: string, transformOptions: unknown) => TsSourceTransformedSource;
  processAsync: (
    source: string,
    filePath: string,
    transformOptions: unknown,
  ) => Promise<TsSourceTransformedSource>;
};

export declare const createTransformer: (tsJestOptions: unknown) => TsSourceTransformer;

export declare const proxyMockCacheKey: (params: { source: string; filePath: string }) => string;
