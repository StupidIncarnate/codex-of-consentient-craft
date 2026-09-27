/**
 * PURPOSE: Root tsconfig.json `dungeonmaster init` scaffolds so a project inherits the load-bearing
 * compiler options (strict flags, esModuleInterop) from the published base, and resolves node16
 * with the `source` condition — node16 reads each package's `imports`/`exports`, which is how
 * `#gateway/<pkg>/<subpath>` resolves, and `source` reads the gateway's TypeScript without a build.
 * Per-package tsconfigs extend this root and add rootDir/include; a package that emits also gets its
 * own tsconfig.build.json extending the package tsconfig with outDir/declaration for `tsc -p
 * tsconfig.build.json`, kept separate from the checking config this template produces.
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
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"],
    "typeRoots": ["./node_modules/@types", "./@types"]
  },
  "files": []
}
`,
} as const;
