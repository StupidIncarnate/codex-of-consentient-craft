/**
 * PURPOSE: Runs a real TypeScript program over one in-memory source string and reduces every
 * syntactic and semantic diagnostic to an `ErrorMessage` — proves a SCAFFOLDED template's emitted
 * text typechecks under this repo's own published strictness before it ever reaches a consumer
 * repo. Mirrors hydration's own `typescriptProgramDiagnosticsAdapter`, which compiles real FILES on
 * disk; this compiles a string that has none yet, so a caller never writes the content to disk just
 * to typecheck it. The compiler options are READ from `packages/eslint-plugin/configs/tsconfig.json`
 * — the base every scaffolded consumer tsconfig extends — rather than hand-copied, so the two
 * cannot drift the way they did before (`moduleResolution: node16` + `customConditions: ['source']`
 * there, `Node10` with no conditions here, which cannot resolve a `#gateway/...` subpath import at
 * all). An optional `dirPath` names a real directory the checked content's own companion files were
 * ACTUALLY written into (e.g. by `InstallCreatePlaywrightResponder`) — a RELATIVE import in
 * `content` resolves against it for real, while every BARE specifier (an npm package, a workspace
 * package, a `#gateway/...` subpath reached transitively) still resolves from this file's own real
 * position, since `dirPath` is typically a bare OS temp dir with no `node_modules` of its own.
 * Diagnostics are read SCOPED to the checked file alone (`program.getSyntacticDiagnostics(sourceFile)`
 * / `getSemanticDiagnostics(sourceFile)`, not the no-arg whole-program form) and `types` is narrowed
 * to `['node']` — measured together, these cut a real scaffold's check from ~4.2s to ~0.6s standalone
 * (worse under jest's own per-worker overhead) by skipping every OTHER file the checked file's
 * dependencies pull in, `@dungeonmaster/shared/contracts`'s few-hundred-file barrel included. The
 * trade-off is real and deliberate: a diagnostic whose OWN file is some unrelated dependency (a bug
 * three hops inside the barrel that the checked file never touches) no longer surfaces — only a
 * diagnostic attached to the checked file itself does. That is the right scope for "does this
 * scaffolded file work": a bug in a sibling contract nothing here imports is that package's own
 * ward typecheck's job, not this broker's. The virtual-file host overrides and the `ErrorMessage`
 * contract mapping stay here rather than in `#gateway/npm/typescript` itself, because they compose
 * several `ts.Program` calls with this repo's own contract — the gateway only wraps the raw
 * compiler API, never our own data shapes.
 *
 * USAGE:
 * typescriptContentDiagnosticsBroker({ content: playwrightConfigTemplateStatics.content });
 * // Returns every syntactic and semantic diagnostic as ErrorMessage[], or [] when it typechecks
 * typescriptContentDiagnosticsBroker({ content, dirPath: testbed.guildPath });
 * // Same, but a relative import in `content` resolves against a companion file really written
 * // into dirPath instead of failing to find it
 */

import * as ts from '#gateway/npm/typescript';
import { resolve, join } from '#gateway/node/path';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

// Real path so the default host's own directory walk (typeRoots, node_modules) finds this
// package's real @types/node, @playwright/test and @dungeonmaster/* workspace packages. Every BARE
// specifier resolves from here regardless of where the checked content's own virtual file lives,
// so a scaffolded file's testbed (an OS temp dir with no node_modules of its own) still reaches the
// real ones. Nothing is ever read from or written to this exact file.
const REPO_ANCHOR_PATH = resolve(__dirname, 'virtual-template.ts');

// The base every scaffolded consumer tsconfig extends (packages/eslint-plugin/CLAUDE.md), so this
// is the strictness AND the module resolution the emitted file really typechecks under.
const ESLINT_PLUGIN_TSCONFIG_PATH = resolve(
  __dirname,
  '../../../../../eslint-plugin/configs/tsconfig.json',
);

// getParsedCommandLineOfConfigFile (not readConfigFile + convertCompilerOptionsFromJson) is what
// hands back real, typed CompilerOptions — the two-step read+convert path types `config` as `any`,
// which is exactly the kind of unchecked value ban-primitives' sibling rules exist to catch.
const parseConfigFileHost: ts.ParseConfigFileHost = {
  useCaseSensitiveFileNames: true,
  readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
    ts.sys.readDirectory(...args),
  fileExists: (path: string) => ts.sys.fileExists(path),
  readFile: (path: string) => ts.sys.readFile(path),
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  onUnRecoverableConfigFileDiagnostic: (diagnostic: ts.Diagnostic): void => {
    throw new Error(
      `typescriptContentDiagnosticsBroker could not parse ${ESLINT_PLUGIN_TSCONFIG_PATH}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
    );
  },
};

export const typescriptContentDiagnosticsBroker = ({
  content,
  dirPath,
}: {
  content: string;
  dirPath?: string;
}): readonly ErrorMessage[] => {
  const parsedConfig = ts.getParsedCommandLineOfConfigFile(
    ESLINT_PLUGIN_TSCONFIG_PATH,
    undefined,
    parseConfigFileHost,
  );
  if (parsedConfig === undefined) {
    throw new Error(
      `typescriptContentDiagnosticsBroker could not parse ${ESLINT_PLUGIN_TSCONFIG_PATH}`,
    );
  }
  const compilerOptions: ts.CompilerOptions = {
    ...parsedConfig.options,
    noEmit: true,
    skipLibCheck: true,
    // Narrows automatic @types/* inclusion to @types/node alone — the checked content's only
    // AMBIENT type need (node:fs, node:path, __dirname). An explicit import like @playwright/test
    // still resolves through its own package, untouched by this: `types` governs only which
    // @types/* packages get pulled in with no import at all.
    types: ['node'],
  };

  const virtualFilePath =
    dirPath === undefined ? REPO_ANCHOR_PATH : join(dirPath, 'virtual-template.ts');

  const host = ts.createCompilerHost(compilerOptions);
  const realGetSourceFile = host.getSourceFile.bind(host);
  const realReadFile = host.readFile.bind(host);
  const realFileExists = host.fileExists.bind(host);

  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === virtualFilePath
      ? ts.createSourceFile(fileName, content, languageVersion, true)
      : realGetSourceFile(fileName, languageVersion, ...rest);
  host.readFile = (fileName) => (fileName === virtualFilePath ? content : realReadFile(fileName));
  host.fileExists = (fileName) => fileName === virtualFilePath || realFileExists(fileName);

  // A scaffolded file's testbed has no node_modules of its own, so every BARE specifier resolves
  // from REPO_ANCHOR_PATH instead — an npm package, a workspace package, or a #gateway subpath
  // reached transitively (this override only touches the TOP-level call; a file that #gateway
  // resolves INTO, like packages/shared/src/contracts/quest-id/quest-id-contract.ts, is already a
  // real file inside the repo, so ITS OWN #gateway import resolves from ITS OWN real containing
  // file with no redirect needed). A RELATIVE specifier resolves from the virtual file's real
  // position, so a companion actually written into dirPath is found for real.
  host.resolveModuleNameLiterals = (moduleLiterals, containingFile) =>
    moduleLiterals.map((literal) => {
      const moduleName = literal.text;
      const isRelative = moduleName.startsWith('.') || moduleName.startsWith('/');
      const anchorFile = isRelative ? containingFile : REPO_ANCHOR_PATH;
      return ts.resolveModuleName(moduleName, anchorFile, compilerOptions, host);
    });

  const program = ts.createProgram([virtualFilePath], compilerOptions, host);
  const sourceFile = program.getSourceFile(virtualFilePath);
  if (sourceFile === undefined) {
    throw new Error(
      `typescriptContentDiagnosticsBroker: program has no source file for ${virtualFilePath}`,
    );
  }
  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];

  return diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    if (diagnostic.file === undefined || diagnostic.start === undefined) {
      return errorMessageContract.parse(`TS${String(diagnostic.code)}: ${message}`);
    }
    const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return errorMessageContract.parse(
      `TS${String(diagnostic.code)} [line ${String(line + 1)}]: ${message}`,
    );
  });
};
