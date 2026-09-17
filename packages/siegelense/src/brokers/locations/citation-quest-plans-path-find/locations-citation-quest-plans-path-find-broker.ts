/**
 * PURPOSE: Resolves the `.quest-plans/` directory a quest's preludes are written into, off that
 * quest's own worktree path. It takes the worktree rather than the quest id because `.quest-plans/`
 * is a REPO-ROOT directory an operator role writes with its own `Write` — `InstallRepoScaffoldResponder`
 * ignores the name in `.gitignore` and deliberately never creates it — so its anchor is the checkout
 * an operator was working in, which only `quest.worktreePath` records. Reach for this over
 * `locationsCitationQuestFilePathFindBroker`: that one answers where the durable record lives and
 * survives the quest, while this one answers where the per-quest plan files live and does not.
 *
 * USAGE:
 * locationsCitationQuestPlansPathFindBroker({ worktreePath });
 * // Returns AbsoluteFilePath '<worktreePath>/.quest-plans'
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { citationStatics } from '../../../statics/citation/citation-statics';

export const locationsCitationQuestPlansPathFindBroker = ({
  worktreePath,
}: {
  worktreePath: AbsoluteFilePath;
}): AbsoluteFilePath =>
  absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [worktreePath, citationStatics.questPlans.dirName] }),
  );
