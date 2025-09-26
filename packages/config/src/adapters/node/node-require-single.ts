interface NodeRequire {
  (id: string): unknown;
  resolve: (id: string) => string;
  cache: Record<string, unknown>;
}

declare const require: NodeRequire;

export const nodeRequire = ({ modulePath }: { modulePath: string }): unknown => require(modulePath);
