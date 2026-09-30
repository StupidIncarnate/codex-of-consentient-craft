/**
 * PURPOSE: Delegates to `typescriptContentDiagnosticsBroker` so an integration test can prove a
 * scaffolded template's TEXT typechecks — a `statics/` test file cannot import a `brokers/` file
 * directly (`@dungeonmaster/enforce-import-dependencies` confines it to `statics/`), so this
 * harness is the seam that reaches the broker on a suite's behalf.
 *
 * USAGE:
 * const harness = scaffoldedTemplateTypecheckHarness();
 * const diagnostics = harness.typecheck({ content: playwrightConfigTemplateStatics.content });
 * // Returns every syntactic and semantic diagnostic as ErrorMessage[], or [] when it typechecks
 * const diagnostics2 = harness.typecheck({ content, dirPath: testbed.guildPath });
 * // Same, but a relative import in `content` resolves against a companion file really written
 * // into dirPath instead of failing to find it
 */

import { typescriptContentDiagnosticsBroker } from '../../../src/brokers/typescript/content-diagnostics/typescript-content-diagnostics-broker';

export const scaffoldedTemplateTypecheckHarness = (): {
  typecheck: (params: { content: string; dirPath?: string }) => readonly string[];
} => ({
  typecheck: ({ content, dirPath }: { content: string; dirPath?: string }): readonly string[] =>
    typescriptContentDiagnosticsBroker(dirPath === undefined ? { content } : { content, dirPath }),
});
