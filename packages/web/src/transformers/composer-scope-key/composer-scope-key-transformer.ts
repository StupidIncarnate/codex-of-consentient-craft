/**
 * PURPOSE: The single place that decides which draft a composer reads and writes. ChatInputWidget
 * derives its own questId from the URL (via useParams) rather than a threaded prop, so every
 * composer instance — the create surface, a quest's spec-phase composer, and that same quest's
 * follow-up composer in the execution panel — computes its scope through this one function rather
 * than three call sites each re-deriving the create-sentinel/follow-up-suffix rule independently.
 *
 * USAGE:
 * composerScopeKeyTransformer({ questId: null, surface: 'main' });
 * // Returns the create-surface sentinel as a ComposerScopeKey — no quest exists yet
 * composerScopeKeyTransformer({ questId, surface: 'followup' });
 * // Returns `${questId}:followup` as a ComposerScopeKey — distinct from that quest's main composer
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { composerScopeKeyContract } from '../../contracts/composer-scope-key/composer-scope-key-contract';
import type { ComposerScopeKey } from '../../contracts/composer-scope-key/composer-scope-key-contract';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

export type ComposerSurface = 'main' | 'followup';

export const composerScopeKeyTransformer = ({
  questId,
  surface,
}: {
  questId: QuestId | null;
  surface: ComposerSurface;
}): ComposerScopeKey => {
  if (questId === null) {
    return composerScopeKeyContract.parse(chatComposerStatics.draftScope.createScopeKey);
  }

  if (surface === 'followup') {
    return composerScopeKeyContract.parse(
      `${questId}${chatComposerStatics.draftScope.followupSuffix}`,
    );
  }

  return composerScopeKeyContract.parse(questId);
};
