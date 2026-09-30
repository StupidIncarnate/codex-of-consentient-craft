/**
 * PURPOSE: Substitutes every placeholder a lane spec's `args`, `env` values and `readyPath` carry —
 * the claimed port pair (`{apiPort}`, `{webPort}`), the three values only an instance's own boot
 * gives a real answer for (`{home}`, `{claudeQueueDir}`, `{wardQueueDir}`), and the two workspace
 * names `laneWorkspaceResolveBroker` reads off disk (`{apiWorkspace}`, `{webWorkspace}`) — with the
 * instance's actual values. A template holding any OTHER `{token}` — a custom spec's own — is left
 * exactly as written: this file has no way to know what a spec it has never seen means by it, and a
 * guessed value would be worse than one left visibly unresolved. Pure, so a spec's templates are
 * testable without spawning a process — every value it substitutes is a PARAMETER the caller
 * supplies, never read from `process.env` or the filesystem here; `laneBootBroker` is what resolves
 * `apiWorkspace`/`webWorkspace` off disk before calling this, and passes an empty `ContentText` for
 * whichever one no process in the spec actually references.
 *
 * USAGE:
 * lanePlaceholderSubstituteTransformer({
 *   template: '{apiPort}',
 *   ports: PortPairStub(),
 *   home: '/tmp/dm-siege-inst_1',
 *   claudeQueueDir: '/tmp/dm-siege-inst_1/claude-queue',
 *   wardQueueDir: '/tmp/dm-siege-inst_1/ward-queue',
 *   apiWorkspace: '@dungeonmaster/server',
 *   webWorkspace: '@dungeonmaster/web',
 * });
 * // Returns '34172' as ContentText
 */

import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const lanePlaceholderSubstituteTransformer = ({
  template,
  ports,
  home,
  claudeQueueDir,
  wardQueueDir,
  apiWorkspace,
  webWorkspace,
}: {
  template: string;
  ports: PortPair;
  home: string;
  claudeQueueDir: string;
  wardQueueDir: string;
  apiWorkspace: string;
  webWorkspace: string;
}): string =>
  template
    .replaceAll('{apiPort}', String(ports.api))
    .replaceAll('{webPort}', String(ports.web))
    .replaceAll('{home}', home)
    .replaceAll('{claudeQueueDir}', claudeQueueDir)
    .replaceAll('{wardQueueDir}', wardQueueDir)
    .replaceAll('{apiWorkspace}', apiWorkspace)
    .replaceAll('{webWorkspace}', webWorkspace);
