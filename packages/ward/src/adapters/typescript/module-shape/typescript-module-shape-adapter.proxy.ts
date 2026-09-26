import { importDependencyFromDeclarationLayerAdapterProxy } from './import-dependency-from-declaration-layer-adapter.proxy';
import { exportDependencyFromDeclarationLayerAdapterProxy } from './export-dependency-from-declaration-layer-adapter.proxy';
import { localExportNamesFromStatementLayerAdapterProxy } from './local-export-names-from-statement-layer-adapter.proxy';

// Every layer this adapter delegates to is a real, DSL-shaped AST reduction with nothing to mock —
// constructed here only to satisfy enforce-proxy-child-creation, matching the precedent
// `laneWorkspaceResolveBrokerProxy` sets for a real-passthrough child.
export const typescriptModuleShapeAdapterProxy = (): Record<PropertyKey, never> => {
  importDependencyFromDeclarationLayerAdapterProxy();
  exportDependencyFromDeclarationLayerAdapterProxy();
  localExportNamesFromStatementLayerAdapterProxy();
  return {};
};
