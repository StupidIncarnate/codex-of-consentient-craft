import { QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { UserRequestLayerWidget } from './user-request-layer-widget';
import { UserRequestLayerWidgetProxy } from './user-request-layer-widget.proxy';

// The shape quest.json really holds after a send-time rewrite: an image token carrying the RAW
// absolute path the server copied the file to, never a URL.
const STORED_PATH = '/home/u/.dungeonmaster/guilds/g/quests/q/images/abc.png';
const SERVED_SRC =
  '/api/images?path=%2Fhome%2Fu%2F.dungeonmaster%2Fguilds%2Fg%2Fquests%2Fq%2Fimages%2Fabc.png';

describe('UserRequestLayerWidget', () => {
  describe('a request carrying an image token', () => {
    it('VALID: {text, token, text} => renders text, an image, text — not the markdown as words', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) and say what it is`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getChildTestIds()).toStrictEqual([
        'USER_REQUEST_TEXT_SEGMENT',
        'USER_REQUEST_IMAGE',
        'USER_REQUEST_TEXT_SEGMENT',
      ]);
      expect(proxy.getChildTagNames()).toStrictEqual(['SPAN', 'IMG', 'SPAN']);
    });

    // The defect this widget exists to fix: the panel used to print the whole token, so the reader
    // saw a uuid path into a directory they have never opened. Asserting the COMPLETE text is what
    // catches a render that shows the picture AND leaves the markdown beside it.
    it('VALID: {a stored absolute path} => the path never appears as text', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) and say what it is`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getRequestText()).toBe('Look at  and say what it is');
    });

    it('VALID: {a stored absolute path} => the image src is the serve route with the path encoded', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) and say what it is`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getImageSrcs()).toStrictEqual([SERVED_SRC]);
    });

    it('VALID: {a stored absolute path} => the thumbnail is capped for the pinned block and stays inline', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) and say what it is`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getImageMaxHeight({ index: 0 })).toBe(
        `${String(webConfigStatics.pastedImage.userRequestThumbnailMaxHeightPx)}px`,
      );
      expect(proxy.getImageDisplay({ index: 0 })).toBe('inline-block');
    });

    it('VALID: {two tokens} => both render, each with its own serve-route src', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: '![Pasted Image 1](/q/images/a.png) then ![Pasted Image 2](/q/images/b.png)',
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getImageSrcs()).toStrictEqual([
        '/api/images?path=%2Fq%2Fimages%2Fa.png',
        '/api/images?path=%2Fq%2Fimages%2Fb.png',
      ]);
    });
  });

  describe('an image that cannot be painted', () => {
    it('VALID: {the image errors} => a broken box holds its place between the two text runs', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) and say what it is`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });
      proxy.failImage({ index: 0 });

      expect(proxy.getChildTestIds()).toStrictEqual([
        'USER_REQUEST_TEXT_SEGMENT',
        'USER_REQUEST_IMAGE_BROKEN',
        'USER_REQUEST_TEXT_SEGMENT',
      ]);
      expect(proxy.getBrokenPlaceholderLabels()).toStrictEqual([
        'Pasted image 1 could not be loaded',
      ]);
    });

    it('VALID: {the image errors} => the box is fixed-size so the block cannot collapse around it', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({
        userRequest: `Look at ![Pasted Image 1](${STORED_PATH}) now`,
      });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });
      proxy.failImage({ index: 0 });

      const sizePx = `${String(webConfigStatics.pastedImage.brokenThumbnailSizePx)}px`;

      expect(proxy.getBrokenPlaceholderPaint()).toStrictEqual({
        width: sizePx,
        height: sizePx,
        borderColor: 'rgb(239, 68, 68)',
      });
    });

    // A bare placeholder is a reference the server never resolved. The quest request is read off
    // disk by every tab, so no tab can hold bytes for one — the box is the only honest render.
    it('VALID: {a bare [Pasted Image 1] placeholder} => renders the broken box, never the raw characters', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({ userRequest: 'before [Pasted Image 1] after' });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getChildTestIds()).toStrictEqual([
        'USER_REQUEST_TEXT_SEGMENT',
        'USER_REQUEST_IMAGE_BROKEN',
        'USER_REQUEST_TEXT_SEGMENT',
      ]);
      expect(proxy.getRequestText()).toBe('before  after');
    });
  });

  describe('a request carrying no image at all', () => {
    it('VALID: {plain prose} => renders one text span holding it verbatim', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({ userRequest: 'Add login with OAuth' });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getChildTestIds()).toStrictEqual(['USER_REQUEST_TEXT_SEGMENT']);
      expect(proxy.getRequestText()).toBe('Add login with OAuth');
      expect(proxy.getImageSrcs()).toStrictEqual([]);
    });

    // A path the copy step refused is left in the text as the user typed it. That is the ONE case
    // where a filesystem path SHOULD still read as words, so the fix must not swallow it.
    it('VALID: {an unresolved path left as text} => it survives character for character', () => {
      const proxy = UserRequestLayerWidgetProxy();
      const { userRequest } = QuestStub({ userRequest: 'Check /tmp/nope.png please' });

      mantineRenderAdapter({ ui: <UserRequestLayerWidget userRequest={userRequest} /> });

      expect(proxy.getRequestText()).toBe('Check /tmp/nope.png please');
      expect(proxy.getImageSrcs()).toStrictEqual([]);
    });
  });
});
