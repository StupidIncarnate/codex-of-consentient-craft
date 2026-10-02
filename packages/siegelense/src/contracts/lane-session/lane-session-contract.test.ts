import { laneSessionContract } from './lane-session-contract';
import { LaneSessionStub } from './lane-session.stub';
import { BrowserSessionStub } from '../browser-session/browser-session.stub';

describe('laneSessionContract', () => {
  describe('data half', () => {
    it('VALID: {a browserless lane} => parses to exactly the data members with browser null', () => {
      const pgid = 4242;
      const logFd = 7;

      const result = laneSessionContract.parse({
        specName: 'dungeonmaster-api',
        ports: { api: 4100, web: 4101 },
        homePath: '/tmp/dm-siege-inst_1',
        evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1',
        repoRoot: '/repo',
        baseUrl: 'http://127.0.0.1:4100',
        apiBaseUrl: 'http://127.0.0.1:4100',
        pgids: [pgid],
        browser: null,
        logFds: [logFd],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-api',
        ports: { api: 4100, web: 4101 },
        homePath: '/tmp/dm-siege-inst_1',
        evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1',
        repoRoot: '/repo',
        baseUrl: 'http://127.0.0.1:4100',
        apiBaseUrl: 'http://127.0.0.1:4100',
        pgids: [pgid],
        browser: null,
        logFds: [logFd],
      });
    });

    it('VALID: {browser: a live session} => the parse hands back the same session reference', () => {
      const browserSession = BrowserSessionStub();

      const result = laneSessionContract.parse({
        specName: 'dungeonmaster-stack',
        ports: { api: 4200, web: 4201 },
        homePath: '/tmp/dm-siege-inst_2',
        evidencePath: '/tmp/dm-siege-inst_2-evidence',
        repoRoot: '/repo',
        baseUrl: 'http://127.0.0.1:4200',
        apiBaseUrl: 'http://127.0.0.1:4200',
        pgids: [4243, 4244],
        browser: browserSession,
        logFds: [8, 9],
      });

      expect(result.browser).toBe(browserSession);
    });

    it('INVALID: {browser: "chromium"} => throws because browser is neither null nor a session', () => {
      expect(() =>
        laneSessionContract.parse({
          specName: 'dungeonmaster-api',
          ports: { api: 4100, web: 4101 },
          homePath: '/tmp/dm-siege-inst_1',
          evidencePath: '/tmp/dm-siege-inst_1-evidence',
          repoRoot: '/repo',
          baseUrl: 'http://127.0.0.1:4100',
          apiBaseUrl: 'http://127.0.0.1:4100',
          pgids: [4242],
          browser: 'chromium',
          logFds: [7],
        }),
      ).toThrow(/Invalid input/u);
    });

    it('INVALID: {repoRoot: a relative path} => throws because the repo root must be absolute', () => {
      expect(() =>
        laneSessionContract.parse({
          specName: 'dungeonmaster-api',
          ports: { api: 4100, web: 4101 },
          homePath: '/tmp/dm-siege-inst_1',
          evidencePath: '/tmp/dm-siege-inst_1-evidence',
          repoRoot: 'worktrees/quest-a',
          baseUrl: 'http://127.0.0.1:4100',
          apiBaseUrl: 'http://127.0.0.1:4100',
          pgids: [4242],
          browser: null,
          logFds: [7],
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {specName missing} => throws naming the missing member', () => {
      expect(() =>
        laneSessionContract.parse({
          ports: { api: 4100, web: 4101 },
          homePath: '/tmp/dm-siege-inst_1',
          evidencePath: '/tmp/dm-siege-inst_1-evidence',
          repoRoot: '/repo',
          baseUrl: 'http://127.0.0.1:4100',
          apiBaseUrl: 'http://127.0.0.1:4100',
          pgids: [4242],
          browser: null,
          logFds: [7],
        }),
      ).toThrow(/specName/u);
    });
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

    it('VALID: {} => stopProcesses defaults to a resolved undefined', async () => {
      const lane = LaneSessionStub();

      await expect(lane.stopProcesses()).resolves.toBe(undefined);
    });

    it('VALID: {} => startProcesses defaults to a resolved undefined', async () => {
      const lane = LaneSessionStub();

      await expect(lane.startProcesses()).resolves.toBe(undefined);
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
