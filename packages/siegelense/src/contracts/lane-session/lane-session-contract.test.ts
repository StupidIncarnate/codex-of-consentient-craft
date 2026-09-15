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

    it('VALID: {serverLogLength: mock} => the handed-in function is the same reference', () => {
      const mockServerLogLength = jest.fn();

      const lane = LaneSessionStub({ serverLogLength: mockServerLogLength });

      expect(lane.serverLogLength).toBe(mockServerLogLength);
    });
  });
});
