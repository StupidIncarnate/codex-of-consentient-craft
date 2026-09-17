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
  });
});
