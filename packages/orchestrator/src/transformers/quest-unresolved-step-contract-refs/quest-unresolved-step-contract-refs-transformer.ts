/**
 * PURPOSE: Returns descriptions of step inputContracts/outputContracts entries that do not resolve to any quest-level contract name (Void is allowed)
 *
 * USAGE:
 * questUnresolvedStepContractRefsTransformer({steps, contracts});
 * // Returns ErrorMessage[] — e.g. ["step 'a' inputContracts references unknown contract 'GhostContract'"].
 *
 * Every non-`Void` entry in any step's `inputContracts` and `outputContracts` must resolve to an
 * entry in `quest.contracts[].name`. Case (b) — resolving via the shared-package contract
 * inventory — is intentionally not implemented here: no shared-contract inventory adapter exists
 * yet, so wiring one would require a new adapter (filesystem + build-cache awareness) that this
 * pass-time transformer is not the right place to introduce. Until that adapter lands, references
 * that exist only in shared (and not in `quest.contracts[]`) WILL be flagged here. Pathseeker's
 * seek_walk waves are expected to materialize shared contracts as `status: 'existing'` quest
 * contract entries so they resolve through case (a).
 *
 * `Void` is a sentinel literal allowed by the schema for steps with no typed input/output (e.g.,
 * statics/contracts/startup folder types). It is treated as resolved here without any lookup.
 */
import type { DependencyStepStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

const VOID_LITERAL = 'Void';

export const questUnresolvedStepContractRefsTransformer = ({
  steps,
  contracts,
}: {
  steps?: DependencyStep[];
  contracts?: QuestContractEntry[];
}): ErrorMessage[] => {
  if (!steps || steps.length === 0) {
    return [];
  }

  const knownNames = new Set<unknown>();
  if (contracts) {
    for (const contract of contracts) {
      knownNames.add(String(contract.name));
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const step of steps) {
    for (const ref of step.inputContracts) {
      const name = String(ref);
      if (name === VOID_LITERAL) {
        continue;
      }
      if (!knownNames.has(name)) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' inputContracts references unknown contract '${name}'`,
          ),
        );
      }
    }

    for (const ref of step.outputContracts) {
      const name = String(ref);
      if (name === VOID_LITERAL) {
        continue;
      }
      if (!knownNames.has(name)) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' outputContracts references unknown contract '${name}'`,
          ),
        );
      }
    }
  }

  return offenders;
};
