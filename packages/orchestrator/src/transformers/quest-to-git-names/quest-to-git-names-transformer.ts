/**
 * PURPOSE: Computes the one branch name and worktree directory name a quest's git lifecycle uses
 * everywhere — Quest Start's collision checks, the worktree it creates, and quest.json's persisted
 * `branchName` — from a single call, so the two values can never drift apart from being derived
 * separately in two places.
 *
 * USAGE:
 * questToGitNamesTransformer({
 *   title: 'Add Auth',
 *   questId: QuestIdStub({ value: '7bc217a1-41e8-40bd-9e25-803d2716b3e8' }),
 * });
 * // Returns { branchName: 'quest/add-auth-7bc217a1', worktreeDirName: 'add-auth-7bc217a1' }
 */

import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { questBranchStatics } from '../../statics/quest-branch/quest-branch-statics';

const TRAILING_HYPHENS_PATTERN = /-+$/u;
const ALPHANUMERIC_CHARACTER_PATTERN = /[a-z0-9]/iu;

export const questToGitNamesTransformer = ({
  title,
  questId,
}: {
  title: string;
  questId: Quest['id'];
}): { branchName: string; worktreeDirName: string } => {
  // nameToUrlSlugTransformer's output contract (urlSlugContract) requires at least one character,
  // so it throws rather than returning '' for a title with no alphanumeric content at all. A title
  // containing at least one alphanumeric character is guaranteed to slug to a non-empty string
  // (the transformer only strips non-alphanumeric runs and leading/trailing hyphens), so this check
  // decides whether to call it at all without duplicating any of its normalization logic.
  const rawSlug = ALPHANUMERIC_CHARACTER_PATTERN.test(title)
    ? nameToUrlSlugTransformer({ name: title })
    : '';
  const truncatedSlug = rawSlug
    .slice(0, questBranchStatics.slugMaxLength)
    .replace(TRAILING_HYPHENS_PATTERN, '');
  const slug = truncatedSlug.length === 0 ? questBranchStatics.fallbackSlug : truncatedSlug;

  const worktreeDirName = `${slug}-${questId.slice(0, questBranchStatics.questIdSuffixLength)}`;
  const branchName = `${questBranchStatics.branchPrefix}${worktreeDirName}`;

  return { branchName, worktreeDirName };
};
