import { browserSessionContract } from './browser-session-contract';
import { BrowserSessionStub } from './browser-session.stub';

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
  });
});
