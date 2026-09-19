/**
 * PURPOSE: The surface `dungeonmaster siegelense run --instance <id> (--steps <json> |
 * --steps-file <path>) [--stop-on error|never]` serves. `runArgsParseTransformer` is pure and
 * `transformers/` can never import `fs` (`@dungeonmaster/enforce-import-dependencies` refuses the
 * write pre-edit), so THIS responder resolves `--steps-file`'s path and reads it before handing
 * argv to that transformer — a responder may import `adapters/` directly, so the read stays at
 * this layer rather than moving one layer down into a broker. A missing or unreadable
 * `--steps-file` refuses naming the flag, so a mistyped path is never mistaken for a driver
 * problem. Reads the registry FIRST and throws `InstanceUnknownError` on a miss, carrying across
 * the same check `SiegelenseKillResponder` makes: `instanceRunBroker` falls back to a
 * deterministic socket path for an id the registry never held, so without this check a typo
 * answers `DriverUnreachableError` — a driver problem — instead of what it actually is. Writes the
 * resulting `RunResult` to stdout as a concise human summary by default, or as raw JSON when
 * `--json` is given (`packages/siegelense/CLAUDE.md`: "`run` returns a status; `results` returns
 * payloads").
 *
 * USAGE:
 * await SiegelenseRunResponder({
 *   args: ['--instance', 'inst_7f3a9c21', '--steps', '[{"step":"goto","path":"/"}]'],
 * });
 * // Writes the human view (or raw JSON if --json is passed) to stdout, or throws first
 */

import { pathResolveAdapter } from '@dungeonmaster/shared/adapters';
import { adapterResultContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { instanceRunBroker } from '../../../brokers/instance/run/instance-run-broker';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { flagValueReadTransformer } from '../../../transformers/flag-value-read/flag-value-read-transformer';
import { runAnswerRenderTransformer } from '../../../transformers/run-answer-render/run-answer-render-transformer';
import { runArgsParseTransformer } from '../../../transformers/run-args-parse/run-args-parse-transformer';

const STEPS_FILE_FLAG = '--steps-file';

export const SiegelenseRunResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  const stepsFilePath = flagValueReadTransformer({ args, flag: STEPS_FILE_FLAG });

  const stepsFileContent =
    stepsFilePath === null
      ? null
      : contentTextContract.parse(
          await fsReadFileAdapter({
            filePath: pathResolveAdapter({ paths: [stepsFilePath] }),
          }).catch((error: unknown) => {
            throw new Error(
              `${STEPS_FILE_FLAG}'s file could not be read: ${
                error instanceof Error ? error.message : String(error)
              }`,
              { cause: error },
            );
          }),
        );

  const { instanceId, steps, stopOn, json } = runArgsParseTransformer({ args, stepsFileContent });

  const registry = await registryReadBroker();
  const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
  if (!isKnownInstance) {
    throw new InstanceUnknownError({ instanceId });
  }

  const result = await instanceRunBroker({ instanceId, steps, stopOn });
  process.stdout.write(
    json
      ? `${JSON.stringify(result, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : runAnswerRenderTransformer({ result }),
  );
  return adapterResultContract.parse({ success: true });
};
