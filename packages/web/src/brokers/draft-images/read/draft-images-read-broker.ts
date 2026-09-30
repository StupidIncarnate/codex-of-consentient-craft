/**
 * PURPOSE: Reads back the draft images belonging to ONE composer's scope out of the shared
 * IndexedDB store on reload — see pastedImageDraftContract's header for why the bytes live there
 * rather than beside the text draft in localStorage, and isComposerScopeMatchGuard's header for
 * why a record belonging to a DIFFERENT scope is excluded outright rather than becoming a hole. A
 * record that carries this scope but fails to parse is data a previous version of the app left on
 * the user's disk; it occupies a HOLE (`undefined`) at its own position rather than being dropped,
 * because draftImagesLoadBroker and composerParseDraftTransformer both index this array
 * POSITIONALLY against the Nth `[Pasted Image N]` placeholder in the localStorage text draft —
 * compacting a failed record here would shift every later record onto the wrong placeholder. A
 * database missing the store heals itself inside `openStore`. A CREATE-scope read
 * additionally migrates any pre-scoping record (one with no `scopeKey` field at all, written before per-composer scoping existed) into the create scope
 * once — see migrateLegacyRecordsLayerBroker's header for why the create surface is the only
 * scope that migration can safely target.
 *
 * USAGE:
 * const drafts = await draftImagesReadBroker({ scopeKey: 'quest-a' });
 * // Returns: readonly (PastedImageDraft | undefined)[] — one entry per record in THIS scope, in
 * // getAll() order; a same-scope record that fails to parse is `undefined` at its own index
 * // rather than absent, and a different-scope record is silently excluded (not a hole)
 */

import { getAll, openStore } from '#gateway/browser/indexedDB';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import { isComposerScopeMatchGuard } from '../../../guards/is-composer-scope-match/is-composer-scope-match-guard';
import { migrateLegacyRecordsLayerBroker } from './migrate-legacy-records-layer-broker';

export const draftImagesReadBroker = async ({
  scopeKey,
}: {
  scopeKey: string;
}): Promise<readonly (PastedImageDraft | undefined)[]> => {
  const { name, version, storeName } = chatComposerStatics.draftDatabase;

  const db = await openStore({ name, version, storeName });

  try {
    // Only the create surface can safely adopt a pre-scoping record — see
    // migrateLegacyRecordsLayerBroker's header for why. A quest-scoped read never runs this: a
    // legacy record cannot be tied to any specific quest, so leaving it for the create-scope read
    // to find is the only safe outcome for a non-create scope.
    if (scopeKey === chatComposerStatics.draftScope.createScopeKey) {
      await migrateLegacyRecordsLayerBroker({ db, storeName });
    }

    const records = await getAll({ db, storeName });

    // A record belonging to a DIFFERENT scope is silently excluded — see
    // isComposerScopeMatchGuard's header for why a full-contract parse alone cannot tell scopes
    // apart. Among records that DO match, one that fails pastedImageDraftContract is data a
    // previous version of the app left on the user's disk; it is mapped to a HOLE at its own index
    // rather than dropped — see the PURPOSE header above for why compacting here mis-addresses
    // every record that follows a bad one.
    return records.reduce<(PastedImageDraft | undefined)[]>((accumulated, record) => {
      if (!isComposerScopeMatchGuard({ record, scopeKey })) return accumulated;
      const parsed = pastedImageDraftContract.safeParse(record);
      accumulated.push(parsed.success ? parsed.data : undefined);
      return accumulated;
    }, []);
  } finally {
    db.close();
  }
};
