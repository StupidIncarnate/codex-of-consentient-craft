/**
 * PURPOSE: The line ward prints when a run that ASKED for a file scope has zero source files left to
 * check — either git scope flag resolving to nothing, or an explicit file list that came in empty.
 *
 * USAGE:
 * import { fileScopeEmptyStatics } from '../../statics/file-scope-empty/file-scope-empty-statics';
 * process.stdout.write(`${fileScopeEmptyStatics.message}\n`);
 *
 * WHY IT EXISTS: every consumer reads an unset `passthrough` as "no file scope", which means the
 * WHOLE repo — so an empty file scope cannot be expressed by leaving it unset, and the run has to
 * stop here instead. Measured on quest a7520e60: two round reviewers ran `--staged` moments after
 * pushing their own round, each got a full sweep with e2e (858s of one, 600s+ of the other, both
 * past the harness timeout and into background polling). Both reported the wide green as their
 * round's verdict.
 *
 * THE MESSAGE SAYS "NOT A GREEN RUN" IN AS MANY WORDS, because the outcome it replaces is one an
 * agent reads as a pass. `passthroughNormalizeTransformer` records the same shape from the other
 * direction: a scoped run that checked nothing looked exactly like a scoped run that passed.
 */

export const fileScopeEmptyStatics = {
  message:
    'ward: the file scope resolved to 0 source files, so NO checks ran. Nothing is unpushed (--staged), nothing differs from the default branch (--changed), or the file list handed in was empty. This is an EMPTY run, not a green one. To check something, scope it yourself: npm run ward -- -- <files>',
} as const;
