import { browserSessionContract } from './browser-session-contract';
import { BrowserSessionStub } from './browser-session.stub';
import { StorageReadingStub } from '../storage-reading/storage-reading.stub';
import { VideoActionStub } from '../video-action/video-action.stub';
import { VideoResultStub } from '../video-result/video-result.stub';

describe('browserSessionContract', () => {
  it('VALID: {} => the data half parses to an empty object', () => {
    expect(browserSessionContract.parse({})).toStrictEqual({});
  });

  describe('BrowserSessionStub', () => {
    it('VALID: {} => countMatches resolves to 0', async () => {
      const session = BrowserSessionStub();

      const count = await session.countMatches({ target: '[data-testid="PIXEL_BTN"]' });

      expect(count).toBe(0);
    });

    it('VALID: {} => bufferLengths reports every buffer at zero', () => {
      const session = BrowserSessionStub();

      expect(session.bufferLengths()).toStrictEqual({
        consoleLines: 0,
        networkLines: 0,
        websocketLines: 0,
      });
    });

    it('VALID: {} => describeMatches resolves to an empty candidate list', async () => {
      const session = BrowserSessionStub();

      const candidates = await session.describeMatches({ target: '[data-testid="GUILD_LIST"]' });

      expect(candidates).toStrictEqual([]);
    });

    it('VALID: {countMatches: mock} => the handed-in function is the same reference', () => {
      const mockCountMatches = jest.fn();

      const session = BrowserSessionStub({ countMatches: mockCountMatches });

      expect(session.countMatches).toBe(mockCountMatches);
    });

    it('VALID: {close: mock} => calling close invokes the handed-in mock once', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ close: mockClose });

      await session.close();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('VALID: {} => waitForPredicate resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(session.waitForPredicate({ source: 'true', timeoutMs: 1000 })).resolves.toBe(
        undefined,
      );
    });

    it('VALID: {} => checkRootPresent resolves to true by default', async () => {
      const session = BrowserSessionStub();

      const result = await session.checkRootPresent();

      expect(result).toBe(true);
    });

    it('VALID: {checkRootPresent: mock} => checkRootPresent uses the handed-in implementation', async () => {
      const mockCheck = jest.fn().mockResolvedValue(false);
      const session = BrowserSessionStub({ checkRootPresent: mockCheck });

      const result = await session.checkRootPresent();

      expect(result).toBe(false);
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    it('VALID: {} => setViewport resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(session.setViewport({ width: 1280, height: 720 })).resolves.toBe(undefined);
    });

    it('VALID: {setViewport: mock} => setViewport uses the handed-in implementation', async () => {
      const mockSetViewport = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ setViewport: mockSetViewport });

      await session.setViewport({ width: 1280, height: 720 });

      expect(mockSetViewport).toHaveBeenCalledTimes(1);
      expect(mockSetViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
    });

    it('VALID: {} => addInitScript resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(session.addInitScript({ source: 'console.log(1);' })).resolves.toBe(undefined);
    });

    it('VALID: {addInitScript: mock} => addInitScript uses the handed-in implementation', async () => {
      const mockAddInitScript = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ addInitScript: mockAddInitScript });

      await session.addInitScript({ source: 'console.log(1);' });

      expect(mockAddInitScript).toHaveBeenCalledTimes(1);
      expect(mockAddInitScript).toHaveBeenCalledWith({ source: 'console.log(1);' });
    });

    it('VALID: {} => readStorage resolves to default StorageReading', async () => {
      const session = BrowserSessionStub();

      const reading = await session.readStorage({ prefix: '' });

      expect(reading).toStrictEqual({
        origin: 'http://localhost:3000',
        local: {},
        session: {},
      });
    });

    it('VALID: {readStorage: mock} => readStorage uses the handed-in implementation', async () => {
      const customReading = StorageReadingStub({
        origin: 'https://example.com',
        local: { 'dm-a': '1' },
      });
      const mockReadStorage = jest.fn().mockResolvedValue(customReading);
      const session = BrowserSessionStub({ readStorage: mockReadStorage });

      const reading = await session.readStorage({ prefix: 'dm-' });

      expect(reading).toStrictEqual({
        origin: 'https://example.com',
        local: { 'dm-a': '1' },
        session: {},
      });
      expect(mockReadStorage).toHaveBeenCalledTimes(1);
      expect(mockReadStorage).toHaveBeenCalledWith({ prefix: 'dm-' });
    });

    it('VALID: {} => clearStorage resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(session.clearStorage()).resolves.toBe(undefined);
    });

    it('VALID: {clearStorage: mock} => clearStorage uses the handed-in implementation', async () => {
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ clearStorage: mockClearStorage });

      await session.clearStorage();

      expect(mockClearStorage).toHaveBeenCalledTimes(1);
    });

    it('VALID: {} => pasteMatch resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(
        session.pasteMatch({
          target: '[data-testid="INPUT"]',
          filePath: null,
          value: 'test',
          timeoutMs: 1000,
        }),
      ).resolves.toBe(undefined);
    });

    it('VALID: {pasteMatch: mock} => pasteMatch uses the handed-in implementation', async () => {
      const mockPasteMatch = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ pasteMatch: mockPasteMatch });

      await session.pasteMatch({
        target: '[data-testid="INPUT"]',
        within: '[data-testid="PANEL"]',
        filePath: '/tmp/f.png',
        value: null,
        timeoutMs: 5000,
      });

      expect(mockPasteMatch).toHaveBeenCalledTimes(1);
      expect(mockPasteMatch).toHaveBeenCalledWith({
        target: '[data-testid="INPUT"]',
        within: '[data-testid="PANEL"]',
        filePath: '/tmp/f.png',
        value: null,
        timeoutMs: 5000,
      });
    });

    it('VALID: {} => pasteRef resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(
        session.pasteRef({
          ref: 14,
          filePath: null,
          value: 'test',
          timeoutMs: 1000,
        }),
      ).resolves.toBe(undefined);
    });

    it('VALID: {pasteRef: mock} => pasteRef uses the handed-in implementation', async () => {
      const mockPasteRef = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ pasteRef: mockPasteRef });

      await session.pasteRef({
        ref: 14,
        filePath: '/tmp/f.png',
        value: null,
        timeoutMs: 5000,
      });

      expect(mockPasteRef).toHaveBeenCalledTimes(1);
      expect(mockPasteRef).toHaveBeenCalledWith({
        ref: 14,
        filePath: '/tmp/f.png',
        value: null,
        timeoutMs: 5000,
      });
    });

    it('VALID: {} => captureLive resolves by default', async () => {
      const session = BrowserSessionStub();

      await expect(session.captureLive({ filePath: '/tmp/shot.png' })).resolves.toBe(undefined);
    });

    it('VALID: {captureLive: mock} => captureLive uses the handed-in implementation', async () => {
      const mockCaptureLive = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: mockCaptureLive });

      await session.captureLive({ filePath: '/tmp/shot.png' });

      expect(mockCaptureLive).toHaveBeenCalledTimes(1);
      expect(mockCaptureLive).toHaveBeenCalledWith({ filePath: '/tmp/shot.png' });
    });

    it('VALID: {} => videoAction start resolves with status started and path null by default', async () => {
      const session = BrowserSessionStub();

      const result = await session.videoAction({ action: VideoActionStub({ value: 'start' }) });

      expect(result).toStrictEqual({ status: 'started', path: null });
    });

    it('VALID: {} => videoAction stop resolves with status stopped and fallback path by default', async () => {
      const session = BrowserSessionStub();

      const result = await session.videoAction({ action: VideoActionStub({ value: 'stop' }) });

      expect(result).toStrictEqual({ status: 'stopped', path: 'evidence/video' });
    });

    it('VALID: {videoAction: mock} => videoAction uses the handed-in implementation', async () => {
      const customResult = VideoResultStub({ status: 'stopped', path: '/custom/path.webm' });
      const mockVideoAction = jest.fn().mockResolvedValue(customResult);
      const session = BrowserSessionStub({ videoAction: mockVideoAction });

      const result = await session.videoAction({ action: VideoActionStub({ value: 'stop' }) });

      expect(result).toStrictEqual({ status: 'stopped', path: '/custom/path.webm' });
      expect(mockVideoAction).toHaveBeenCalledTimes(1);
      expect(mockVideoAction).toHaveBeenCalledWith({ action: 'stop' });
    });
  });
});
