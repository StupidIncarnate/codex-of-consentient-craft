import { laneBootBroker } from './lane-boot-broker';
import { laneBootBrokerProxy } from './lane-boot-broker.proxy';
import type { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneProcessStub } from '../../../contracts/lane-process/lane-process.stub';
import { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

const INSTANCE_ID = InstanceIdStub();
const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/unowned/instances/inst_7f3a9c21',
});
const API_LOG_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/api-server.log',
});
const WEB_LOG_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/web-server.log',
});

describe('laneBootBroker', () => {
  describe('a browsered two-process spec', () => {
    it('VALID: {api process} => spawns it with the right command, args and merged env', async () => {
      const proxy = laneBootBrokerProxy();
      const repoRoot = proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const webFd = FileDescriptorStub({ value: 11 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: { DUNGEONMASTER_HOME: '{home}' },
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: { DUNGEONMASTER_WEB_PORT: '{webPort}' },
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-web',
        processes: [apiProcess, webProcess],
        browser: true,
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: webFd,
        command: 'npm',
        args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
        pid: 1_002,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });
      // Snapshotted BEFORE the call: playwrightSessionAdapter (browser: true above) mutates the
      // real process.env as a side effect, and inheritedEnv is built from process.env before that
      // happens — a snapshot taken after the await would include that later mutation.
      const inheritedEnvSnapshot = proxy.getInheritedEnvSnapshot();

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(
        proxy.getSpawnOptionsFor({
          command: 'npm',
          args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        }),
      ).toStrictEqual({
        cwd: repoRoot,
        env: {
          ...inheritedEnvSnapshot,
          DUNGEONMASTER_PORT: '34172',
          DUNGEONMASTER_HOME: '{home}',
        },
        detached: true,
        stdio: ['ignore', apiFd, apiFd],
      });
    });

    it('VALID: {web process} => spawns it with the right command, args and merged env', async () => {
      const proxy = laneBootBrokerProxy();
      const repoRoot = proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const webFd = FileDescriptorStub({ value: 11 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: { DUNGEONMASTER_HOME: '{home}' },
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: { DUNGEONMASTER_WEB_PORT: '{webPort}' },
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-web',
        processes: [apiProcess, webProcess],
        browser: true,
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: webFd,
        command: 'npm',
        args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
        pid: 1_002,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });
      const inheritedEnvSnapshot = proxy.getInheritedEnvSnapshot();

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(
        proxy.getSpawnOptionsFor({
          command: 'npm',
          args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
        }),
      ).toStrictEqual({
        cwd: repoRoot,
        env: {
          ...inheritedEnvSnapshot,
          DUNGEONMASTER_PORT: '34172',
          DUNGEONMASTER_WEB_PORT: '34173',
        },
        detached: true,
        stdio: ['ignore', webFd, webFd],
      });
    });

    it('VALID: {browser: true} => LaneSession.browser is a real, live BrowserSession', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        processes: [apiProcess, webProcess],
        browser: true,
        env: {},
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: FileDescriptorStub({ value: 10 }),
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: FileDescriptorStub({ value: 11 }),
        command: 'npm',
        args: ['run', 'dev'],
        pid: 1_002,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });

      const lane = await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(lane.browser?.bufferLengths()).toStrictEqual({
        consoleLines: 0,
        networkLines: 0,
        websocketLines: 0,
      });
    });
  });

  describe('a browserless spec', () => {
    it('VALID: {browser: false} => opens NO browser, and the server WAS spawned', async () => {
      const proxy = laneBootBrokerProxy();
      const repoRoot = proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-headless',
        processes: [apiProcess],
        browser: false,
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        pid: 1_001,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      const inheritedEnvSnapshot = proxy.getInheritedEnvSnapshot();

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(proxy.getBrowserLaunchCallCount()).toBe(0);
      expect(
        proxy.getSpawnOptionsFor({
          command: 'npm',
          args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        }),
      ).toStrictEqual({
        cwd: repoRoot,
        env: { ...inheritedEnvSnapshot, DUNGEONMASTER_PORT: '34172' },
        detached: true,
        stdio: ['ignore', apiFd, apiFd],
      });
    });

    it('EMPTY: {browser: false} => LaneSession.browser is null', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const spec = LaneSpecStub({ processes: [apiProcess], browser: false, env: {} });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: FileDescriptorStub({ value: 10 }),
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });

      const lane = await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(lane.browser).toBe(null);
    });

    it('VALID: {browser: false} => a successful boot removes nothing', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const spec = LaneSpecStub({ processes: [apiProcess], browser: false, env: {} });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: FileDescriptorStub({ value: 10 }),
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      // The home belongs to the live instance now; teardown removes it later, not a successful boot.
      expect(proxy.getRemovedHomePaths()).toStrictEqual([]);
    });
  });

  describe('a spec whose only process never becomes ready', () => {
    it('ERROR: {api never ready} => throws LaneBootFailedError naming api, killing and closing it', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const apiPgid = ProcessGroupIdStub({ value: 1_001 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-headless',
        processes: [apiProcess],
        browser: false,
        env: {},
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupServerNeverReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootDeadlineAlreadyPast();
      proxy.setupHomeRemoved({ homePath: HOME_PATH });

      const caughtError = (await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      }).catch((error: unknown) => error)) as LaneBootFailedError;

      expect({ name: caughtError.name, message: caughtError.message }).toStrictEqual({
        name: 'LaneBootFailedError',
        message:
          `Lane dungeonmaster-headless for instance inst_7f3a9c21 did not become ready: api never ` +
          `answered their ready path. Logs: ${API_LOG_PATH}`,
      });
      expect(proxy.getKillSignalsFor({ pgid: apiPgid })).toStrictEqual(['SIGKILL']);
      expect(proxy.getClosedFds()).toStrictEqual([apiFd]);
    });

    it('ERROR: {api never ready} => removes the throwaway home', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-headless',
        processes: [apiProcess],
        browser: false,
        env: {},
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupServerNeverReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootDeadlineAlreadyPast();
      proxy.setupHomeRemoved({ homePath: HOME_PATH });

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      }).catch((error: unknown) => error);

      expect(proxy.getRemovedHomePaths()).toStrictEqual([HOME_PATH]);
    });
  });

  describe('a spec where one process is ready and the other never is', () => {
    it("ERROR: {web ready, api not} => the error names only 'api', and BOTH groups are killed", async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const webFd = FileDescriptorStub({ value: 11 });
      const apiPgid = ProcessGroupIdStub({ value: 1_001 });
      const webPgid = ProcessGroupIdStub({ value: 1_002 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-web',
        processes: [apiProcess, webProcess],
        browser: false,
        env: {},
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: webFd,
        command: 'npm',
        args: ['run', 'dev'],
        pid: 1_002,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });
      proxy.setupServerNeverReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootDeadlineAlreadyPast();
      proxy.setupHomeRemoved({ homePath: HOME_PATH });

      const caughtError = (await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      }).catch((error: unknown) => error)) as LaneBootFailedError;

      expect({ name: caughtError.name, message: caughtError.message }).toStrictEqual({
        name: 'LaneBootFailedError',
        message:
          `Lane dungeonmaster-web for instance inst_7f3a9c21 did not become ready: api never ` +
          `answered their ready path. Logs: ${API_LOG_PATH}`,
      });
      expect(proxy.getKillSignalsFor({ pgid: apiPgid })).toStrictEqual(['SIGKILL']);
      expect(proxy.getKillSignalsFor({ pgid: webPgid })).toStrictEqual(['SIGKILL']);
      expect(proxy.getClosedFds()).toStrictEqual([apiFd, webFd]);
    });

    it('ERROR: {web ready, api not} => removes the home but never the evidence directory', async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const webFd = FileDescriptorStub({ value: 11 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: {},
      });
      const spec = LaneSpecStub({
        name: 'dungeonmaster-web',
        processes: [apiProcess, webProcess],
        browser: false,
        env: {},
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: webFd,
        command: 'npm',
        args: ['run', 'dev'],
        pid: 1_002,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });
      proxy.setupServerNeverReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootDeadlineAlreadyPast();
      proxy.setupHomeRemoved({ homePath: HOME_PATH });

      await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      }).catch((error: unknown) => error);

      // Both processes' logs sit under EVIDENCE_PATH — a complete-set assertion here is what fails
      // if the fix ever removed that path alongside (or instead of) the home.
      expect(proxy.getRemovedHomePaths()).toStrictEqual([HOME_PATH]);
    });
  });

  describe('the claimed port pair', () => {
    it("VALID: {api and web processes} => each process's ready probe hits ITS OWN role's port", async () => {
      const proxy = laneBootBrokerProxy();
      proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: {},
      });
      const spec = LaneSpecStub({ processes: [apiProcess, webProcess], browser: false, env: {} });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: FileDescriptorStub({ value: 10 }),
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: FileDescriptorStub({ value: 11 }),
        command: 'npm',
        args: ['run', 'dev'],
        pid: 1_002,
      });
      // Staged against each process's OWN role-derived port only — a broker that swapped the
      // roles would probe an address nothing here answers, and the unmatched fetch call throws.
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });

      const lane = await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(lane.pgids).toStrictEqual([
        ProcessGroupIdStub({ value: 1_001 }),
        ProcessGroupIdStub({ value: 1_002 }),
      ]);
    });
  });

  describe('a spec with three processes', () => {
    it('VALID: {api, web, and a portless worker} => boots all three', async () => {
      const proxy = laneBootBrokerProxy();
      const repoRoot = proxy.resolveRepoRoot();
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const apiFd = FileDescriptorStub({ value: 10 });
      const webFd = FileDescriptorStub({ value: 11 });
      const workerFd = FileDescriptorStub({ value: 12 });
      const apiProcess = LaneProcessStub({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
      const webProcess = LaneProcessStub({
        name: 'web',
        command: 'npm',
        args: ['run', 'dev'],
        portRole: 'web',
        readyPath: '/',
        logFileName: 'web-server.log',
        env: {},
      });
      const workerProcess = LaneProcessStub({
        name: 'worker',
        command: 'node',
        args: ['worker.js'],
        portRole: null,
        readyPath: null,
        logFileName: 'worker.log',
        env: {},
      });
      const spec = LaneSpecStub({
        processes: [apiProcess, webProcess, workerProcess],
        browser: false,
        env: {},
      });
      const workerLogPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/worker.log',
      });
      proxy.setupProcessBoot({
        logPath: API_LOG_PATH,
        fd: apiFd,
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        pid: 1_001,
      });
      proxy.setupProcessBoot({
        logPath: WEB_LOG_PATH,
        fd: webFd,
        command: 'npm',
        args: ['run', 'dev'],
        pid: 1_002,
      });
      proxy.setupProcessBoot({
        logPath: workerLogPath,
        fd: workerFd,
        command: 'node',
        args: ['worker.js'],
        pid: 1_003,
      });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupServerReachable({ url: 'http://dungeonmaster.localhost:34173/' });
      const inheritedEnvSnapshot = proxy.getInheritedEnvSnapshot();

      const lane = await laneBootBroker({
        spec,
        ports,
        instanceId: INSTANCE_ID,
        homePath: HOME_PATH,
        evidencePath: EVIDENCE_PATH,
      });

      expect(lane.pgids).toStrictEqual([
        ProcessGroupIdStub({ value: 1_001 }),
        ProcessGroupIdStub({ value: 1_002 }),
        ProcessGroupIdStub({ value: 1_003 }),
      ]);
      expect(proxy.getSpawnOptionsFor({ command: 'node', args: ['worker.js'] })).toStrictEqual({
        cwd: repoRoot,
        env: { ...inheritedEnvSnapshot },
        detached: true,
        stdio: ['ignore', workerFd, workerFd],
      });
    });
  });
});
