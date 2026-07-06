/**
 * PURPOSE: Root tsconfig.json `dungeonmaster init` scaffolds so a project inherits the load-bearing
 * compiler options (node10 resolution, strict flags, esModuleInterop) from the published base.
 * Per-package tsconfigs extend this root and add outDir/rootDir/composite/include.
 *
 * USAGE:
 * tsconfigTemplateStatics.content;
 * // Returns the tsconfig.json file body extending @dungeonmaster/eslint-plugin/tsconfig
 */

export const tsconfigTemplateStatics = {
  content: `{
  "extends": "@dungeonmaster/eslint-plugin/tsconfig",
  "compilerOptions": {
    "noEmit": true,
    "typeRoots": ["./node_modules/@types", "./@types"]
  },
  "files": []
}
`,
} as const;
