/**
 * PURPOSE: Runs a real TypeScript program over one in-memory source string and reduces every
 * syntactic and semantic diagnostic to an `ErrorMessage` — proves a SCAFFOLDED template's emitted
 * text typechecks under this repo's own published strictness before it ever reaches a consumer
 * repo. Mirrors hydration's own `typescriptProgramDiagnosticsAdapter`, which compiles real FILES on
 * disk; this compiles a string that has none yet, so a caller never writes the content to disk just
 * to typecheck it. `@playwright/test` is stood in for by a one-line ambient module declaration
 * rather than resolved for real, so this program needs no `@playwright/test` installation — only
 * this repo's own `@types/node`, found by pointing the virtual file at a real directory inside this
 * package and letting the default host's directory walk find it.
 *
 * USAGE:
 * typescriptContentDiagnosticsAdapter({ content: playwrightConfigTemplateStatics.content });
 * // Returns every syntactic and semantic diagnostic as ErrorMessage[], or [] when it typechecks
 */

import * as ts from 'typescript';
import { resolve } from 'path';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

// Real path so the default host's own directory walk (typeRoots, node_modules) finds this
// package's real @types/node — nothing is ever read from or written to this exact file.
const VIRTUAL_FILE_PATH = resolve(__dirname, 'virtual-template.ts');

// Stands in for the real package so this program needs no `@playwright/test` installation —
// only its ONE export this template ever calls.
const PLAYWRIGHT_TEST_AMBIENT_MODULE =
  "declare module '@playwright/test' { export function defineConfig(config: unknown): unknown; }\n";

// Matches packages/eslint-plugin/configs/tsconfig.json — the base every scaffolded consumer
// tsconfig extends, so this is the strictness the emitted file really typechecks under.
const compilerOptions: ts.CompilerOptions = {
  strict: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  allowUnreachableCode: false,
  exactOptionalPropertyTypes: true,
  noUncheckedIndexedAccess: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmit: true,
};

export const typescriptContentDiagnosticsAdapter = ({
  content,
}: {
  content: string;
}): readonly ErrorMessage[] => {
  const sourceText = PLAYWRIGHT_TEST_AMBIENT_MODULE + content;
  const host = ts.createCompilerHost(compilerOptions);

  const realGetSourceFile = host.getSourceFile.bind(host);
  const realReadFile = host.readFile.bind(host);
  const realFileExists = host.fileExists.bind(host);

  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === VIRTUAL_FILE_PATH
      ? ts.createSourceFile(fileName, sourceText, languageVersion, true)
      : realGetSourceFile(fileName, languageVersion, ...rest);
  host.readFile = (fileName) =>
    fileName === VIRTUAL_FILE_PATH ? sourceText : realReadFile(fileName);
  host.fileExists = (fileName) => fileName === VIRTUAL_FILE_PATH || realFileExists(fileName);

  const program = ts.createProgram([VIRTUAL_FILE_PATH], compilerOptions, host);
  const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()];

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
