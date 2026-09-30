import { ChatEntryStub } from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';

import { pastedImageMemoryState } from './pasted-image-memory-state';
import { pastedImageMemoryStateProxy } from './pasted-image-memory-state.proxy';

describe('pastedImageMemoryState', () => {
  describe('remember() and recall()', () => {
    it('VALID: {uuid, dataUrls} => recall returns the exact array', () => {
      pastedImageMemoryStateProxy().setupEmpty();
      const { uuid } = ChatEntryStub();
      const dataUrls = ['data:image/png;base64,AAAA', 'data:image/png;base64,BBBB'];

      pastedImageMemoryState.remember({ uuid, dataUrls });

      expect(pastedImageMemoryState.recall({ uuid })).toStrictEqual(dataUrls);
    });

    it('EMPTY: {uuid: never remembered} => recall returns []', () => {
      pastedImageMemoryStateProxy().setupEmpty();
      const { uuid } = ChatEntryStub();

      expect(pastedImageMemoryState.recall({ uuid })).toStrictEqual([]);
    });

    it('VALID: {one uuid remembered twice} => the second remember replaces the first', () => {
      pastedImageMemoryStateProxy().setupEmpty();
      const { uuid } = ChatEntryStub();
      const firstDataUrls = ['data:image/png;base64,AAAA'];
      const secondDataUrls = ['data:image/png;base64,BBBB'];

      pastedImageMemoryState.remember({ uuid, dataUrls: firstDataUrls });
      pastedImageMemoryState.remember({ uuid, dataUrls: secondDataUrls });

      expect(pastedImageMemoryState.recall({ uuid })).toStrictEqual(secondDataUrls);
    });
  });

  describe('forget()', () => {
    it('VALID: {two uuids remembered, forget one} => the forgotten uuid recalls [], the other is untouched', () => {
      pastedImageMemoryStateProxy().setupEmpty();
      const { uuid: keptUuid } = ChatEntryStub({ uuid: 'b0000000-0000-4000-8000-00000000000a' });
      const { uuid: forgottenUuid } = ChatEntryStub({
        uuid: 'b0000000-0000-4000-8000-00000000000b',
      });
      const keptDataUrls = ['data:image/png;base64,AAAA'];

      pastedImageMemoryState.remember({ uuid: keptUuid, dataUrls: keptDataUrls });
      pastedImageMemoryState.remember({
        uuid: forgottenUuid,
        dataUrls: ['data:image/png;base64,BBBB'],
      });

      pastedImageMemoryState.forget({ uuid: forgottenUuid });

      expect(pastedImageMemoryState.recall({ uuid: forgottenUuid })).toStrictEqual([]);
      expect(pastedImageMemoryState.recall({ uuid: keptUuid })).toStrictEqual(keptDataUrls);
    });
  });

  describe('clear()', () => {
    it('VALID: {two uuids remembered, clear} => both recall []', () => {
      pastedImageMemoryStateProxy().setupEmpty();
      const { uuid: firstUuid } = ChatEntryStub({ uuid: 'b0000000-0000-4000-8000-00000000000a' });
      const { uuid: secondUuid } = ChatEntryStub({ uuid: 'b0000000-0000-4000-8000-00000000000b' });

      pastedImageMemoryState.remember({
        uuid: firstUuid,
        dataUrls: ['data:image/png;base64,AAAA'],
      });
      pastedImageMemoryState.remember({
        uuid: secondUuid,
        dataUrls: ['data:image/png;base64,BBBB'],
      });

      pastedImageMemoryState.clear();

      expect(pastedImageMemoryState.recall({ uuid: firstUuid })).toStrictEqual([]);
      expect(pastedImageMemoryState.recall({ uuid: secondUuid })).toStrictEqual([]);
    });
  });
});
