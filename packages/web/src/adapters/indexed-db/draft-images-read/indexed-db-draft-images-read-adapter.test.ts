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

  it('EDGE: {seeded record with a malformed attachmentId} => occupies a hole at its own position, valid ones stay at theirs', async () => {
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

    expect(result).toStrictEqual([first, undefined, second]);
  });

  it('EDGE: {seeded [contract-invalid dataBase64, good]} => the bad record is a hole at index 0, the good one still lands at index 1', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    const good = PastedImageDraftStub({ attachmentId: '22222222-2222-4222-8222-222222222222' });
    proxy.seed({
      drafts: [
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataBase64: '***garbage-not-base64***',
        },
        good,
      ],
    });

    const result = await indexedDbDraftImagesReadAdapter();

    expect(result).toStrictEqual([undefined, good]);
  });

  it('EDGE: {seeded [good1, contract-invalid dataBase64, good2]} => the hole sits at index 1, good2 lands at its OWN index 2, not index 1', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    const good1 = PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' });
    const good2 = PastedImageDraftStub({ attachmentId: '33333333-3333-4333-8333-333333333333' });
    proxy.seed({
      drafts: [
        good1,
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataBase64: '***garbage-not-base64***',
        },
        good2,
      ],
    });

    const result = await indexedDbDraftImagesReadAdapter();

    expect(result).toStrictEqual([good1, undefined, good2]);
  });

  it('ERROR: {open fails} => rejects naming the adapter', async () => {
    const proxy = indexedDbDraftImagesReadAdapterProxy();
    proxy.openFails({ error: new Error('blocked') });

    await expect(indexedDbDraftImagesReadAdapter()).rejects.toThrow(
      /indexedDbDraftImagesReadAdapter/u,
    );
  });
});
