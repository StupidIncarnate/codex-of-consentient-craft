/**
 * PURPOSE: Delegates to `typescriptContentDiagnosticsAdapter` so an integration test can prove a
 * scaffolded template's TEXT typechecks — a `statics/` test file cannot import an `adapters/` file
 * directly (`@dungeonmaster/enforce-import-dependencies` confines it to `statics/`), so this
 * harness is the seam that reaches the adapter on a suite's behalf.
 *
 * USAGE:
 * const harness = scaffoldedTemplateTypecheckHarness();
 * const diagnostics = harness.typecheck({ content: playwrightConfigTemplateStatics.content });
 * // Returns every syntactic and semantic diagnostic as ErrorMessage[], or [] when it typechecks
 */

import { typescriptContentDiagnosticsAdapter } from '../../../src/adapters/typescript/content-diagnostics/typescript-content-diagnostics-adapter';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const scaffoldedTemplateTypecheckHarness = (): {
  typecheck: (params: { content: string }) => readonly ErrorMessage[];
} => ({
  typecheck: ({ content }: { content: string }): readonly ErrorMessage[] =>
    typescriptContentDiagnosticsAdapter({ content }),
});
