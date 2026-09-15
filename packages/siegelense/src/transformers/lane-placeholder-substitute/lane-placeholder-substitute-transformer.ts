/**
 * PURPOSE: Substitutes the two port placeholders a lane spec's `args`, `env` values and `readyPath`
 * carry — `{apiPort}` and `{webPort}` — with the instance's actual claimed pair. Nothing else in a
 * template is a placeholder this design resolves: `lane-spec-statics.ts`'s fake-CLI tokens
 * (`{home}`, `{fakeClaudeCliPath}`, …) are carried through untouched, so a template holding one of
 * those keeps it literally. Pure, so a spec's templates are testable without spawning a process.
 *
 * USAGE:
 * lanePlaceholderSubstituteTransformer({ template: '{apiPort}', ports: PortPairStub() });
 * // Returns '34172' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const lanePlaceholderSubstituteTransformer = ({
  template,
  ports,
}: {
  template: string;
  ports: PortPair;
}): ContentText =>
  contentTextContract.parse(
    template.replaceAll('{apiPort}', String(ports.api)).replaceAll('{webPort}', String(ports.web)),
  );
