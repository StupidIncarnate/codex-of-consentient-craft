import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';
import { DirectoryBrowseResponderProxy } from './directory-browse-responder.proxy';

describe('DirectoryBrowseResponder', () => {
  describe('successful browsing', () => {
    it('VALID: {no path} => returns 200 with entries', () => {
      const proxy = DirectoryBrowseResponderProxy();
      const entry = DirectoryEntryStub();
      proxy.setupBrowse({ entries: [entry] });

      const result = proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 200,
        data: [entry],
      });
    });

    it('VALID: {with path} => returns 200 with entries', () => {
      const proxy = DirectoryBrowseResponderProxy();
      const entry = DirectoryEntryStub();
      proxy.setupBrowse({ entries: [entry] });

      const result = proxy.callResponder({ body: { path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 200,
        data: [entry],
      });
    });

    it('EMPTY: {no entries} => returns 200 with empty array', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupBrowse({ entries: [] });

      const result = proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 200,
        data: [],
      });
    });

    it('EDGE: {null body} => returns 200 with entries (no path extraction)', () => {
      const proxy = DirectoryBrowseResponderProxy();
      const entry = DirectoryEntryStub();
      proxy.setupBrowse({ entries: [entry] });

      const result = proxy.callResponder({ body: null });

      expect(result).toStrictEqual({
        status: 200,
        data: [entry],
      });
    });

    it('EDGE: {non-string path} => returns 200 with entries (path ignored)', () => {
      const proxy = DirectoryBrowseResponderProxy();
      const entry = DirectoryEntryStub();
      proxy.setupBrowse({ entries: [entry] });

      const result = proxy.callResponder({ body: { path: 123 } });

      expect(result).toStrictEqual({
        status: 200,
        data: [entry],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupBrowseError({ message: 'Permission denied' });

      const result = proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Permission denied' },
      });
    });
  });
});
