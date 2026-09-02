import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

import { indexedDbDraftImagesReadAdapter } from './indexed-db-draft-images-read-adapter';
import { indexedDbDraftImagesReadAdapterProxy } from './indexed-db-draft-images-read-adapter.proxy';

describe('indexedDbDraftImagesReadAdapter', () => {
  it('VALID: {seeded store holding [first, second]} => returns them in order', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    const first = PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' });
    const second = PastedImageDraftStub({ attachmentId: '22222222-2222-4222-8222-222222222222' });
    proxy.seed({ drafts: [first, second] });

    const result = await indexedDbDraftImagesReadAdapter();

    expect(result).toStrictEqual([first, second]);
  });

  it('EMPTY: {empty store} => returns []', async () => {
    indexedDbDraftImagesReadAdapterProxy();

    const result = await indexedDbDraftImagesReadAdapter();

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {seeded record with a malformed attachmentId} => is dropped, valid ones still come back', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    const first = PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' });
    const second = PastedImageDraftStub({ attachmentId: '22222222-2222-4222-8222-222222222222' });
    proxy.seed({
      drafts: [
        first,
        { attachmentId: 'not-a-uuid', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' },
        second,
      ],
    });

    const result = await indexedDbDraftImagesReadAdapter();

    expect(result).toStrictEqual([first, second]);
  });

  it('ERROR: {open fails} => rejects naming the adapter', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    proxy.openFails({ error: new Error('blocked') });

    await expect(indexedDbDraftImagesReadAdapter()).rejects.toThrow(
      /indexedDbDraftImagesReadAdapter/u,
    );
  });
});
