/**
 * PURPOSE: Resolves a discipline name to the four-block pack whose markdown fills the `$DISCIPLINE`
 * placeholder in the operator/planner/worker/reviewer templates. Reach for this over importing
 * one `discipline*Statics` module directly whenever the discipline is only known at dispatch time:
 * the exhaustive switch's `never` default is what turns "a discipline was added and nothing serves
 * it" into a compile error, instead of an agent silently receiving an undefined instruction block.
 *
 * USAGE:
 * disciplineToPackTransformer({ discipline: disciplineContract.parse('manual-qa') });
 * // Returns disciplineManualQaStatics
 */

import type { Discipline } from '../../contracts/discipline/discipline-contract';
import { disciplineBelowBrowserStatics } from '../../statics/discipline-below-browser/discipline-below-browser-statics';
import { disciplineBrowserE2eStatics } from '../../statics/discipline-browser-e2e/discipline-browser-e2e-statics';
import { disciplineBugReproStatics } from '../../statics/discipline-bug-repro/discipline-bug-repro-statics';
import { disciplineImplementationStatics } from '../../statics/discipline-implementation/discipline-implementation-statics';
import { disciplineManualQaStatics } from '../../statics/discipline-manual-qa/discipline-manual-qa-statics';

export type DisciplinePack =
  | typeof disciplineImplementationStatics
  | typeof disciplineBugReproStatics
  | typeof disciplineBelowBrowserStatics
  | typeof disciplineBrowserE2eStatics
  | typeof disciplineManualQaStatics;

export const disciplineToPackTransformer = ({
  discipline,
}: {
  discipline: Discipline;
}): DisciplinePack => {
  switch (discipline) {
    case 'implementation':
      return disciplineImplementationStatics;
    case 'bug-repro':
      return disciplineBugReproStatics;
    case 'below-browser':
      return disciplineBelowBrowserStatics;
    case 'browser-e2e':
      return disciplineBrowserE2eStatics;
    case 'manual-qa':
      return disciplineManualQaStatics;
    default: {
      const exhaustiveCheck: never = discipline;
      throw new Error(`Unknown discipline: ${String(exhaustiveCheck)}`);
    }
  }
};
