/**
 * PURPOSE: The surface `dungeonmaster siegelense status [--instance <id>]` serves — and what a
 * bare `dungeonmaster siegelense` (no subcommand) serves too, since `SiegelenseFlow` routes the
 * empty case here with no flags rather than to a fleet view of its own — the fleet or one-instance
 * table through `statusAnswerRenderTransformer` by default (when `isJson` is false or omitted), or
 * one JSON document on stdout (the raw `StatusAnswer`) when `isJson` is true (opted into with
 * `--json`). Writes through `process.stdout.write`, never `console.log`, matching every other CLI
 * surface in this repo. Never fetches per-row detail for a fleet listing itself —
 * `statusReadBroker`'s own no-browsing rule already withholds evidence and `lastStep` for every row
 * except a named instance, and this responder passes `instanceId` straight through rather than making
 * N extra calls to fill in a prettier table. Also passes `instanceId` through to the RENDERER —
 * `statusReadBroker` answers `instances: []` both for an empty fleet and for an unrecognised named id,
 * and only the renderer, told which question was asked, can tell those two apart in the text a
 * person reads. `isJson` defaults to `false` in the destructuring. **The refusal for `--human` lives
 * in `statusArgsParseTransformer`'s own known-flag set**, which rejects it as an unknown flag before
 * argv ever reaches this responder — this responder only ever renders when told to. Reads the
 * registry FIRST for a NAMED query and throws `InstanceUnknownError` on a miss, the same check
 * `SiegelenseKillResponder`/`SiegelenseRunResponder` make: agents read exit codes to decide what
 * happened, so an id the registry never held refuses (exit 1) rather than answering a typed
 * `instances: []`/`unknown` reading (exit 0) — `statusReadBroker` itself is untouched and still
 * answers that way for a `pruned`/`dead`/`killed` row, which DOES have a registry entry.
 *
 * USAGE:
 * await SiegelenseStatusResponder({ instanceId: null, isJson: false });
 * // Writes the fleet's rendered table
 *
 * await SiegelenseStatusResponder({ instanceId: null, isJson: true });
 * // Writes the fleet's StatusAnswer as one JSON document
 *
 * await SiegelenseStatusResponder({ instanceId: InstanceIdStub(), isJson: false });
 * // Writes that one instance in full, as the rendered table, or throws InstanceUnknownError first
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';
import { cwd, stdout } from '#gateway/node/process';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { statusReadBroker } from '../../../brokers/status/read/status-read-broker';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { statusAnswerRenderTransformer } from '../../../transformers/status-answer-render/status-answer-render-transformer';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const SiegelenseStatusResponder = async ({
  instanceId,
  branch = null,
  since = instanceId === null ? '6h' : null,
  isJson = false,
}: {
  instanceId: SiegeInstance['id'] | null;
  branch?: string | null | undefined;
  since?: '1h' | '6h' | '1d' | '1wk' | null | undefined;
  isJson?: boolean | undefined;
}): Promise<void> => {
  if (instanceId !== null) {
    const registry = await registryReadBroker();
    const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
    if (!isKnownInstance) {
      throw new InstanceUnknownError({ instanceId });
    }
  }

  // `status` also answers from a folder that is no repo at all (the fleet is machine-wide, not
  // repo-owned). The repo root only feeds a row's repo-local evidence link and a dead row's solo
  // profile, and a folder with no repo has neither, so its own path stands in for the root.
  const startPath = cwd();
  const repoRoot = await cwdResolveBroker({ startPath, kind: 'repo-root' }).catch(
    (error: unknown) => {
      if (error instanceof ProjectRootNotFoundError) {
        return startPath;
      }
      throw error;
    },
  );
  const answer = await statusReadBroker({ instanceId, repoRoot, branch, since });
  stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : statusAnswerRenderTransformer({ answer, instanceId, branch, since }),
  );
};
