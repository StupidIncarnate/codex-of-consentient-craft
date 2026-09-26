/**
 * PURPOSE: Names the AST statement types a gateway `index.ts` may hold on its own (no `source` /
 * `declaration` check needed) and still count as a pure re-export entry: `export * from 'pkg'`,
 * the `export =` form, and its supporting `import x = require('pkg')` statement. Kept as a static
 * because `@dungeonmaster/enforce-magic-arrays` bans an inline string array in a broker file, and
 * because `gateway-colocation`'s own purity check is the one place this list needs to stay in sync.
 *
 * USAGE:
 * gatewayPureReexportStatementTypesStatics.types.includes('ExportAllDeclaration');
 * // Returns true
 */
export const gatewayPureReexportStatementTypesStatics = {
  types: ['ExportAllDeclaration', 'TSExportAssignment', 'TSImportEqualsDeclaration'] as const,
};
