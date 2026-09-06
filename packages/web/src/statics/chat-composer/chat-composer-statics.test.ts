import { chatComposerStatics } from './chat-composer-statics';

describe('chatComposerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(chatComposerStatics).toStrictEqual({
      draftStorageKeyPrefix: 'dungeonmaster-chat-draft',
      draftDispatchedKeyPrefix: 'dungeonmaster-chat-draft-dispatched',
      draftScope: {
        createScopeKey: 'create',
        followupSuffix: ':followup',
      },
      draftDatabase: {
        name: 'dungeonmaster-chat-drafts',
        version: 1,
        storeName: 'dungeonmaster-chat-draft-images',
      },
      caretFiller: {
        attributeName: 'data-composer-caret-filler',
      },
      thumbnail: {
        attributeName: 'data-attachment-id',
        testId: 'CHAT_INPUT_THUMBNAIL',
        maxHeightPx: 60,
        maxWidthPx: 120,
      },
      upload: {
        minPercent: 0,
        maxPercent: 100,
        testId: 'CHAT_INPUT_UPLOAD_PROGRESS',
      },
      toasts: {
        unsupportedFormat: 'Only PNG, JPEG, GIF and WebP images can be pasted',
        tooManyImages: 'A message can carry at most 5 images',
        cannotReduce: 'That image could not be converted or reduced below 5 MB',
      },
      toastColor: 'red',
    });
  });

  it('VALID: draftStorageKeyPrefix => matches the localStorage key prefix ChatInputWidget reads and writes today', () => {
    expect(chatComposerStatics.draftStorageKeyPrefix).toBe('dungeonmaster-chat-draft');
  });

  it('VALID: draftDispatchedKeyPrefix => matches the localStorage key prefix ChatInputWidget stamps and clears today', () => {
    expect(chatComposerStatics.draftDispatchedKeyPrefix).toBe(
      'dungeonmaster-chat-draft-dispatched',
    );
  });

  it('VALID: draftScope => carries the create-surface sentinel and the follow-up suffix', () => {
    expect(chatComposerStatics.draftScope).toStrictEqual({
      createScopeKey: 'create',
      followupSuffix: ':followup',
    });
  });

  it('VALID: draftDatabase.storeName => matches the shared pastedImage store name, not itself', () => {
    expect(chatComposerStatics.draftDatabase.storeName).toBe('dungeonmaster-chat-draft-images');
  });

  it('VALID: exported value => upload group carries all three keys and values', () => {
    expect(chatComposerStatics.upload).toStrictEqual({
      minPercent: 0,
      maxPercent: 100,
      testId: 'CHAT_INPUT_UPLOAD_PROGRESS',
    });
  });

  it('VALID: exported value => thumbnail group carries all four keys and values', () => {
    expect(chatComposerStatics.thumbnail).toStrictEqual({
      attributeName: 'data-attachment-id',
      testId: 'CHAT_INPUT_THUMBNAIL',
      maxHeightPx: 60,
      maxWidthPx: 120,
    });
  });

  it('VALID: exported value => caretFiller group carries its one key and value', () => {
    expect(chatComposerStatics.caretFiller).toStrictEqual({
      attributeName: 'data-composer-caret-filler',
    });
  });
});
