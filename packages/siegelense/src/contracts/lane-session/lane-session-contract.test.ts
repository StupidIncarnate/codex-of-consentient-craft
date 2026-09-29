import { laneSessionContract } from './lane-session-contract';
import { LaneSessionStub } from './lane-session.stub';
import { BrowserSessionStub } from '../browser-session/browser-session.stub';

describe('laneSessionContract', () => {
  it('VALID: {} => the data half parses to an empty object', () => {
    expect(laneSessionContract.parse({})).toStrictEqual({});
  });

  describe('LaneSessionStub', () => {
    it('EDGE: {browser: null} => a browserless lane still satisfies LaneSession', () => {
      const lane = LaneSessionStub({ browser: null });

      expect(lane.browser).toBe(null);
    });

    it('VALID: {browser: session with a mocked countMatches} => the nested reference survives', () => {
      const mockCountMatches = jest.fn();
      const browserSession = BrowserSessionStub({ countMatches: mockCountMatches });

      const lane = LaneSessionStub({ browser: browserSession });

      expect(lane.browser).toStrictEqual(browserSession);
    });

    it('VALID: {} => serverLogLength defaults to 0', () => {
      const lane = LaneSessionStub();

      expect(lane.serverLogLength()).toBe(0);
    });

    it('VALID: {} => readServerLogSince defaults to an empty array', () => {
      const lane = LaneSessionStub();

      expect(lane.readServerLogSince({ fromByte: 0 })).toStrictEqual([]);
    });

    it('VALID: {} => apiBaseUrl defaults to http://127.0.0.1:0', () => {
      const lane = LaneSessionStub();

      expect(lane.apiBaseUrl).toBe('http://127.0.0.1:0');
    });

    it('VALID: {} => stopProcesses defaults to a resolved success', async () => {
      const lane = LaneSessionStub();

      await expect(lane.stopProcesses()).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {} => startProcesses defaults to a resolved success', async () => {
      const lane = LaneSessionStub();

      await expect(lane.startProcesses()).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {startProcesses: mock} => the handed-in function is the same reference', () => {
      const mockStartProcesses = jest.fn();

      const lane = LaneSessionStub({ startProcesses: mockStartProcesses });

      expect(lane.startProcesses).toBe(mockStartProcesses);
    });

    it('VALID: {serverLogLength: mock} => the handed-in function is the same reference', () => {
      const mockServerLogLength = jest.fn();

      const lane = LaneSessionStub({ serverLogLength: mockServerLogLength });

      expect(lane.serverLogLength).toBe(mockServerLogLength);
    });
  });
});
