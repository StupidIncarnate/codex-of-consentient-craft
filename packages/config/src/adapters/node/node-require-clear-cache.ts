interface NodeRequire {
  (id: string): unknown;
  resolve: (id: string) => string;
  cache: Record<string, unknown>;
}

declare const require: NodeRequire;

export const nodeRequireClearCache = ({ modulePath }: { modulePath: string }): void => {
  const resolvedPath = require.resolve(modulePath);
  Reflect.deleteProperty(require.cache, resolvedPath);
};
