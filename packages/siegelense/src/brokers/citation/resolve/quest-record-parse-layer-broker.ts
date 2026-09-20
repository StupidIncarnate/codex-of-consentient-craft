/**
 * PURPOSE: Turns the bytes of a `quest.json` into either a parsed quest or the SENTENCE explaining
 * why the citation question cannot be settled off it. Both failures resolve to a refusal rather than
 * a throw, because a malformed record on one instance must not abort a prune sweeping the whole
 * registry — and neither may it read as "nothing cites this", which is the deletion the retention
 * rule exists to prevent. It is a layer rather than inline in `citationResolveBroker` for one
 * mechanical reason: `JSON.parse` throws, so a caller holding its result needs a `let`, and the one
 * catch that belongs around it must not also cover the filesystem reads that follow. Reach for this
 * over calling `questContract.safeParse` at a call site: the two failure modes have different
 * sentences and a caller writing them again would drift from these.
 *
 * USAGE:
 * questRecordParseLayerBroker({ contents, questFilePath, instanceId });
 * // Returns { quest, blocked: null } — or { quest: null, blocked: <why it cannot be settled> }
 */

import { contentTextContract, questContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  ContentText,
  FileContents,
  Quest,
} from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';

export const questRecordParseLayerBroker = ({
  contents,
  questFilePath,
  instanceId,
}: {
  contents: FileContents;
  questFilePath: AbsoluteFilePath;
  instanceId: InstanceId;
}): { quest: Quest | null; blocked: ContentText | null } => {
  try {
    const parsed = questContract.safeParse(JSON.parse(String(contents)));

    if (!parsed.success) {
      return {
        quest: null,
        blocked: contentTextContract.parse(
          `the quest record at ${questFilePath} did not parse, so whether it still cites ` +
            `${instanceId} cannot be established: ${parsed.error.issues
              .map((issue) => issue.message)
              .join('; ')}`,
        ),
      };
    }

    return { quest: parsed.data, blocked: null };
  } catch (error: unknown) {
    return {
      quest: null,
      blocked: contentTextContract.parse(
        `the quest record at ${questFilePath} is not readable JSON, so whether it still cites ` +
          `${instanceId} cannot be established: ${String(error)}`,
      ),
    };
  }
};
