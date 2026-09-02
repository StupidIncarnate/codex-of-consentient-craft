import { chatComposerStatics } from './chat-composer-statics';

describe('chatComposerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(chatComposerStatics).toStrictEqual({
      draftStorageKey: 'dungeonmaster-chat-draft',
      draftDatabase: {
        name: 'dungeonmaster-chat-drafts',
        version: 1,
        storeName: 'dungeonmaster-chat-draft-images',
      },
      thumbnail: {
        attributeName: 'data-attachment-id',
        testId: 'CHAT_INPUT_THUMBNAIL',
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

  it('VALID: draftStorageKey => matches the localStorage key ChatInputWidget reads and writes today', () => {
    expect(chatComposerStatics.draftStorageKey).toBe('dungeonmaster-chat-draft');
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
});
