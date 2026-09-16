/**
 * PURPOSE: Substitutes every placeholder a lane spec's `args`, `env` values and `readyPath` carry —
 * the claimed port pair (`{apiPort}`, `{webPort}`) and the three values only an instance's own boot
 * gives a real answer for (`{home}`, `{claudeQueueDir}`, `{wardQueueDir}`) — with the instance's
 * actual values. A template holding any OTHER `{token}` — a custom spec's own — is left exactly as
 * written: this file has no way to know what a spec it has never seen means by it, and a guessed
 * value would be worse than one left visibly unresolved. Pure, so a spec's templates are testable
 * without spawning a process — every value it substitutes is a PARAMETER the caller supplies, never
 * read from `process.env` or the filesystem here.
 *
 * USAGE:
 * lanePlaceholderSubstituteTransformer({
 *   template: '{apiPort}',
 *   ports: PortPairStub(),
 *   home: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' }),
 *   claudeQueueDir: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/claude-queue' }),
 *   wardQueueDir: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/ward-queue' }),
 * });
 * // Returns '34172' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const lanePlaceholderSubstituteTransformer = ({
  template,
  ports,
  home,
  claudeQueueDir,
  wardQueueDir,
}: {
  template: string;
  ports: PortPair;
  home: AbsoluteFilePath;
  claudeQueueDir: AbsoluteFilePath;
  wardQueueDir: AbsoluteFilePath;
}): ContentText =>
  contentTextContract.parse(
    template
      .replaceAll('{apiPort}', String(ports.api))
      .replaceAll('{webPort}', String(ports.web))
      .replaceAll('{home}', home)
      .replaceAll('{claudeQueueDir}', claudeQueueDir)
      .replaceAll('{wardQueueDir}', wardQueueDir),
  );
