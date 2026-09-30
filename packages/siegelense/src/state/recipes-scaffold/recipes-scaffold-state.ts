/**
 * PURPOSE: Remembers, for the rest of this `dungeonmaster init` process, whether
 * InstallRecipesScaffoldResponder scaffolded a fresh `packages/hydration-recipes/` THIS run — the
 * signal InstallRecipesFinalizeResponder reads once every package's StartInstall has already run
 * (DEF-99) to decide whether the deferred `npm install` / `npm run build` still need to happen.
 * `StartInstall` and `StartInstallFinalize` are two separate calls into the SAME dynamically
 * imported module, so this in-memory flag survives between them within one init run; a later,
 * separate `dungeonmaster init` invocation starts with nothing pending.
 *
 * USAGE:
 * recipesScaffoldState.markScaffolded({ recipesPackageName });
 * recipesScaffoldState.consumeScaffolded();
 * // Returns { recipesPackageName } the first read after a mark, { recipesPackageName: undefined }
 * // on every read after (including the next one) until markScaffolded runs again
 */


// A mutable container property, not a bare `let` — `init-declarations` demands a `let` be
// initialized and `no-undef-init` forbids initializing one to literal `undefined`; a property on a
// `const` object answers to neither rule.
const pending: { recipesPackageName: string | undefined } = { recipesPackageName: undefined };

export const recipesScaffoldState = {
  markScaffolded: ({ recipesPackageName }: { recipesPackageName: string }): void => {
    pending.recipesPackageName = recipesPackageName;
  },

  consumeScaffolded: (): { recipesPackageName: string | undefined } => {
    const { recipesPackageName } = pending;
    pending.recipesPackageName = undefined;
    return { recipesPackageName };
  },

  clear: (): void => {
    pending.recipesPackageName = undefined;
  },
} as const;
