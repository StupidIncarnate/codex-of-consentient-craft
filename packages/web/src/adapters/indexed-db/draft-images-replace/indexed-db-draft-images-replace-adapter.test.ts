import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

import { indexedDbDraftImagesReplaceAdapter } from './indexed-db-draft-images-replace-adapter';
import { indexedDbDraftImagesReplaceAdapterProxy } from './indexed-db-draft-images-replace-adapter.proxy';

describe('indexedDbDraftImagesReplaceAdapter', () => {
  it('VALID: {drafts: [first, second, third]} => store afterwards holds exactly those three, in order', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const first = PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' });
    const second = PastedImageDraftStub({ attachmentId: '22222222-2222-4222-8222-222222222222' });
    const third = PastedImageDraftStub({ attachmentId: '33333333-3333-4333-8333-333333333333' });

    await indexedDbDraftImagesReplaceAdapter({ drafts: [first, second, third] });

    expect(proxy.getStoredDrafts()).toStrictEqual([first, second, third]);
  });

  it('VALID: {drafts: [replacement]} over a store already holding different records => leaves only the new ones', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    const existing = PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' });
    proxy.seed({ drafts: [existing] });
    const replacement = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
    });

    await indexedDbDraftImagesReplaceAdapter({ drafts: [replacement] });

    expect(proxy.getStoredDrafts()).toStrictEqual([replacement]);
  });

  it('EMPTY: {drafts: []} => empties a store that already held a record', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    proxy.seed({ drafts: [PastedImageDraftStub()] });

    await indexedDbDraftImagesReplaceAdapter({ drafts: [] });

    expect(proxy.getStoredDrafts()).toStrictEqual([]);
  });

  it('ERROR: {open fails} => rejects naming the adapter', async () => {
    const proxy = indexedDbDraftImagesReplaceAdapterProxy();
    proxy.openFails({ error: new Error('blocked') });

    await expect(indexedDbDraftImagesReplaceAdapter({ drafts: [] })).rejects.toThrow(
      /indexedDbDraftImagesReplaceAdapter/u,
    );
  });
});
