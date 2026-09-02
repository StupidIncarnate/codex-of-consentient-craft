import { chatComposerStatics } from './chat-composer-statics';

describe('chatComposerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(chatComposerStatics).toStrictEqual({
      draftStorageKey: 'dungeonmaster-chat-draft',
      draftDatabase: {
        name: 'dungeonmaster-chat-drafts',
        version: 1,
        storeName: 'draft-images',
      },
      thumbnail: {
        attributeName: 'data-attachment-id',
        testId: 'CHAT_INPUT_THUMBNAIL',
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
});
