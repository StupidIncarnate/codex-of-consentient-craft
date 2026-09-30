import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

import { draftImagesReadBroker } from './draft-images-read-broker';
import { draftImagesReadBrokerProxy } from './draft-images-read-broker.proxy';

describe('draftImagesReadBroker', () => {
  it('VALID: {seeded store holding [first, second], same scope} => returns them in order', async () => {
    const proxy = draftImagesReadBrokerProxy();
    const scopeKey = 'quest-a';
    const first = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a',
    });
    const second = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a',
    });
    proxy.seed({ drafts: [first, second] });

    const result = await draftImagesReadBroker({ scopeKey });

    expect(result).toStrictEqual([first, second]);
  });

  it('EMPTY: {empty store} => returns []', async () => {
    draftImagesReadBrokerProxy();

    const result = await draftImagesReadBroker({
      scopeKey: 'quest-a',
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {seeded record with a malformed attachmentId, same scope} => occupies a hole at its own position, valid ones stay at theirs', async () => {
    const proxy = draftImagesReadBrokerProxy();
    const scopeKey = 'quest-a';
    const first = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a',
    });
    const second = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a',
    });
    proxy.seed({
      drafts: [
        first,
        {
          attachmentId: 'not-a-uuid',
          mediaType: 'image/png',
          dataBase64: 'iVBORw0KGgo=',
          scopeKey: 'quest-a',
        },
        second,
      ],
    });

    const result = await draftImagesReadBroker({ scopeKey });

    expect(result).toStrictEqual([first, undefined, second]);
  });

  it('EDGE: {seeded [contract-invalid dataBase64, good], same scope} => the bad record is a hole at index 0, the good one still lands at index 1', async () => {
    const proxy = draftImagesReadBrokerProxy();
    const scopeKey = 'quest-a';
    const good = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-a',
    });
    proxy.seed({
      drafts: [
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataBase64: '***garbage-not-base64***',
          scopeKey: 'quest-a',
        },
        good,
      ],
    });

    const result = await draftImagesReadBroker({ scopeKey });

    expect(result).toStrictEqual([undefined, good]);
  });

  it('EDGE: {seeded [good1, contract-invalid dataBase64, good2], same scope} => the hole sits at index 1, good2 lands at its OWN index 2, not index 1', async () => {
    const proxy = draftImagesReadBrokerProxy();
    const scopeKey = 'quest-a';
    const good1 = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a',
    });
    const good2 = PastedImageDraftStub({
      attachmentId: '33333333-3333-4333-8333-333333333333',
      scopeKey: 'quest-a',
    });
    proxy.seed({
      drafts: [
        good1,
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataBase64: '***garbage-not-base64***',
          scopeKey: 'quest-a',
        },
        good2,
      ],
    });

    const result = await draftImagesReadBroker({ scopeKey });

    expect(result).toStrictEqual([good1, undefined, good2]);
  });

  it("VALID: {store holds quest-a AND quest-b records} => a quest-a read returns only quest-a's, excluding quest-b's entirely (not as holes)", async () => {
    const proxy = draftImagesReadBrokerProxy();
    const questA = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a',
    });
    const questB = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-b',
    });
    proxy.seed({ drafts: [questA, questB] });

    const result = await draftImagesReadBroker({
      scopeKey: 'quest-a',
    });

    expect(result).toStrictEqual([questA]);
  });

  it("VALID: {store holds quest-a AND quest-b records} => a quest-b read returns only quest-b's", async () => {
    const proxy = draftImagesReadBrokerProxy();
    const questA = PastedImageDraftStub({
      attachmentId: '11111111-1111-4111-8111-111111111111',
      scopeKey: 'quest-a',
    });
    const questB = PastedImageDraftStub({
      attachmentId: '22222222-2222-4222-8222-222222222222',
      scopeKey: 'quest-b',
    });
    proxy.seed({ drafts: [questA, questB] });

    const result = await draftImagesReadBroker({
      scopeKey: 'quest-b',
    });

    expect(result).toStrictEqual([questB]);
  });

  describe('legacy (pre-scoping) record migration', () => {
    it('VALID: {store holds a scopeKey-less legacy record} => a CREATE-scope read migrates and returns it', async () => {
      const proxy = draftImagesReadBrokerProxy();
      proxy.seed({
        drafts: [
          {
            attachmentId: '11111111-1111-4111-8111-111111111111',
            mediaType: 'image/png',
            dataBase64: 'iVBORw0KGgo=',
          },
        ],
      });

      const result = await draftImagesReadBroker({
        scopeKey: 'create',
      });

      expect(result).toStrictEqual([
        PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' }),
      ]);
    });

    it('VALID: {a migrated legacy record} => is durably tagged, so a SECOND create-scope read returns it too', async () => {
      const proxy = draftImagesReadBrokerProxy();
      proxy.seed({
        drafts: [
          {
            attachmentId: '11111111-1111-4111-8111-111111111111',
            mediaType: 'image/png',
            dataBase64: 'iVBORw0KGgo=',
          },
        ],
      });
      const scopeKey = 'create';
      await draftImagesReadBroker({ scopeKey });

      const result = await draftImagesReadBroker({ scopeKey });

      expect(result).toStrictEqual([
        PastedImageDraftStub({ attachmentId: '11111111-1111-4111-8111-111111111111' }),
      ]);
    });

    it('EMPTY: {store holds a scopeKey-less legacy record} => a QUEST-scoped read does NOT adopt it (excluded, not a hole)', async () => {
      const proxy = draftImagesReadBrokerProxy();
      proxy.seed({
        drafts: [
          {
            attachmentId: '11111111-1111-4111-8111-111111111111',
            mediaType: 'image/png',
            dataBase64: 'iVBORw0KGgo=',
          },
        ],
      });

      const result = await draftImagesReadBroker({
        scopeKey: 'quest-a',
      });

      expect(result).toStrictEqual([]);
    });

    it("VALID: {legacy record migrated into create scope} => a quest-a scoped read still returns nothing (migration never leaks into a real quest's scope)", async () => {
      const proxy = draftImagesReadBrokerProxy();
      proxy.seed({
        drafts: [
          {
            attachmentId: '11111111-1111-4111-8111-111111111111',
            mediaType: 'image/png',
            dataBase64: 'iVBORw0KGgo=',
          },
        ],
      });
      await draftImagesReadBroker({
        scopeKey: 'create',
      });

      const result = await draftImagesReadBroker({
        scopeKey: 'quest-a',
      });

      expect(result).toStrictEqual([]);
    });
  });

  it('ERROR: {open fails} => rejects with the open failure', async () => {
    const proxy = draftImagesReadBrokerProxy();
    proxy.openFails({ error: new Error('blocked') });

    await expect(
      draftImagesReadBroker({ scopeKey: 'quest-a' }),
    ).rejects.toThrow(/openStore: failed to open/u);
  });
});
