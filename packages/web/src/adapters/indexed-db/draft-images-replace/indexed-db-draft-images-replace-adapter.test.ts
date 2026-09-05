import { ComposerScopeKeyStub } from '../../../contracts/composer-scope-key/composer-scope-key.stub';
import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

import { indexedDbDraftImagesReplaceAdapter } from './indexed-db-draft-images-replace-adapter';
import { indexedDbDraftImagesReplaceAdapterProxy } from './indexed-db-draft-images-replace-adapter.proxy';

describe('indexedDbDraftImagesReplaceAdapter', () => {
  it('VALID: {drafts: [first, second, third]} => store afterwards holds exactly those three, in order', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const scopeKey = ComposerScopeKeyStub({ value: 'quest-a' });
    const first = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a' as never,
    });
    const second = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a' as never,
    });
    const third = PastedImageDraftStub({
      attachmentId: '33333333-3333-4333-8333-333333333333',
      scopeKey: 'quest-a' as never,
    });

    await indexedDbDraftImagesReplaceAdapter({ scopeKey, drafts: [first, second, third] });

    expect(proxy.getStoredDrafts()).toStrictEqual([first, second, third]);
  });

  it('VALID: {drafts: [replacement]} over a store already holding different records in the SAME scope => leaves only the new ones', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const scopeKey = ComposerScopeKeyStub({ value: 'quest-a' });
    const existing = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a' as never,
    });
    proxy.seed({ drafts: [existing] });
    const replacement = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a' as never,
    });

    await indexedDbDraftImagesReplaceAdapter({ scopeKey, drafts: [replacement] });

    expect(proxy.getStoredDrafts()).toStrictEqual([replacement]);
  });

  it('EMPTY: {drafts: []} => empties a store that already held a record in the SAME scope', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const scopeKey = ComposerScopeKeyStub({ value: 'quest-a' });
    proxy.seed({ drafts: [PastedImageDraftStub({ scopeKey: 'quest-a' as never })] });

    await indexedDbDraftImagesReplaceAdapter({ scopeKey, drafts: [] });

    expect(proxy.getStoredDrafts()).toStrictEqual([]);
  });

  it("VALID: {quest-a replace} => quest-b's own records survive untouched", async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const questBRecord = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-b' as never,
    });
    proxy.seed({ drafts: [questBRecord] });
    const questAReplacement = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a' as never,
    });

    await indexedDbDraftImagesReplaceAdapter({
      scopeKey: ComposerScopeKeyStub({ value: 'quest-a' }),
      drafts: [questAReplacement],
    });

    expect(proxy.getStoredDrafts()).toStrictEqual([questBRecord, questAReplacement]);
  });

  it("EMPTY: {quest-a replaced to []} => quest-b's own records still survive untouched", async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const questARecord = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a' as never,
    });
    const questBRecord = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-b' as never,
    });
    proxy.seed({ drafts: [questARecord, questBRecord] });

    await indexedDbDraftImagesReplaceAdapter({
      scopeKey: ComposerScopeKeyStub({ value: 'quest-a' }),
      drafts: [],
    });

    expect(proxy.getStoredDrafts()).toStrictEqual([questBRecord]);
  });

  it('ERROR: {open fails} => rejects naming the adapter', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    proxy.openFails({ error: new Error('blocked') });

    await expect(
      indexedDbDraftImagesReplaceAdapter({
        scopeKey: ComposerScopeKeyStub({ value: 'quest-a' }),
        drafts: [],
      }),
    ).rejects.toThrow(/indexedDbDraftImagesReplaceAdapter/u);
  });
});
