import {
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
  TimeoutMsStub,
} from '@dungeonmaster/shared/contracts';

import { instanceStartBroker } from './instance-start-broker';
import { instanceStartBrokerProxy } from './instance-start-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { LaneProcessStub } from '../../../contracts/lane-process/lane-process.stub';
import { LaneProcessNameStub } from '../../../contracts/lane-process-name/lane-process-name.stub';
import { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { PortRoleStub } from '../../../contracts/port-role/port-role.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';
import { DriverBootFailedError } from '../../../errors/driver-boot-failed/driver-boot-failed-error';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

const UNOWNED_EVIDENCE_PATH_VALUE =
  '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479';
const UNOWNED_EVIDENCE_PATH = FilePathStub({ value: UNOWNED_EVIDENCE_PATH_VALUE });

describe('instanceStartBroker', () => {
  describe('reservation ordering', () => {
    it('VALID: {start} => writes the registry reservation before the boot lock file', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
      });

      await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      const writeOrder = proxy.getWriteOrder();
      const registryWriteIndex = writeOrder.findIndex((path) => path.includes('registry.json.tmp'));
      const bootLockWriteIndex = writeOrder.findIndex((path) => path.includes('boot.lock'));

      expect(registryWriteIndex).toBeLessThan(bootLockWriteIndex);
    });
  });

  describe('idleTimeoutMs carried to the spawned driver', () => {
    it('VALID: {idleTimeoutMs given} => boots successfully, proving the driver was spawned with --idle-timeout-ms naming it', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
      });

      expect(result.instanceId).toBe(instanceId);
    });

    it('VALID: {idleTimeoutMs omitted} => boots successfully, proving the driver was spawned with no --idle-timeout-ms flag', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.instanceId).toBe(instanceId);
    });
  });

  describe('boot lock released on a failed boot', () => {
    it('ERROR: {driver never answers ping} => throws LaneBootFailedError and releases the boot lock', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const nowMs = 1_700_000_000_000;
      const specName = SpecNameStub({ value: 'test-boot-never-answers' });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.stageProcessUnreachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootNeverAnswers({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        nowMs,
      });

      await expect(
        instanceStartBroker({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(LaneBootFailedError);

      expect(proxy.getBootLockReleasedPaths()).toStrictEqual([
        '/home/user/.dungeonmaster/siegelense/boot.lock',
      ]);
    });
  });

  describe('the driver reports its own boot failure via a marker', () => {
    it('ERROR: {boot-failure.json appears on the first failed ping} => throws DriverBootFailedError naming the driver message, not a generic ready-path timeout', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = SpecNameStub({ value: 'test-driver-reports-failure' });
      const driverMessage =
        'Lane spec dungeonmaster-stack requires a fake agent CLI, and the environment supplies none of it: set CLAUDE_CLI_PATH to a stub Claude CLI binary.';
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.setupBootFailureMarkerAppears({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        driverMessage,
      });

      const thrownError = await instanceStartBroker({
        specName,
        questId: null,
        guildId: null,
        seed: null,
      }).catch((error: unknown) => error);

      expect(thrownError instanceof DriverBootFailedError).toBe(true);
      expect(String(thrownError)).toBe(
        `DriverBootFailedError: Lane ${specName} for instance ${instanceId} failed to boot: ${driverMessage} Driver log: ${UNOWNED_EVIDENCE_PATH_VALUE}/driver.log`,
      );
      expect(proxy.getBootLockReleasedPaths()).toStrictEqual([
        '/home/user/.dungeonmaster/siegelense/boot.lock',
      ]);
    });
  });

  describe('a failed boot releases its reservation', () => {
    it('ERROR: {driver reports a boot failure} => releases the reservation instead of leaving it alive with no boot time', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = SpecNameStub({ value: 'test-release-on-marker-failure' });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.setupBootFailureMarkerAppears({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        driverMessage: 'CLAUDE_CLI_PATH is required',
      });

      await instanceStartBroker({ specName, questId: null, guildId: null, seed: null }).catch(
        (error: unknown) => error,
      );

      const expectedRegistry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: instanceId,
            state: 'killed',
            pid: null,
            pgids: [],
            socketPath: null,
          }),
        ],
      });

      expect(proxy.getLastRegistryWriteContent()).toStrictEqual(expectedRegistry);
    });

    it('ERROR: {driver never answers ping, timeout path} => also releases the reservation', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const nowMs = 1_700_000_000_000;
      const specName = SpecNameStub({ value: 'test-release-on-timeout' });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.stageProcessUnreachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootNeverAnswers({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        nowMs,
      });

      await instanceStartBroker({ specName, questId: null, guildId: null, seed: null }).catch(
        (error: unknown) => error,
      );

      const expectedRegistry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: instanceId,
            state: 'killed',
            pid: null,
            pgids: [],
            socketPath: null,
          }),
        ],
      });

      expect(proxy.getLastRegistryWriteContent()).toStrictEqual(expectedRegistry);
    });

    it('ERROR: {releasing the reservation itself throws} => still rejects with the original boot error', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const nowMs = 1_700_000_000_000;
      const specName = SpecNameStub({ value: 'test-release-throws' });
      const releaseError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.stageProcessUnreachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootNeverAnswers({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        nowMs,
      });
      proxy.stageInstanceReleaseWriteFails({ error: releaseError });

      await expect(
        instanceStartBroker({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(LaneBootFailedError);
    });
  });

  describe('unready names only the processes that actually failed to answer', () => {
    it('ERROR: {api reachable, web unreachable} => unready names only the web process', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const nowMs = 1_700_000_000_000;
      const specName = SpecNameStub({ value: 'test-two-process-partial-failure' });
      const webProcessName = LaneProcessNameStub({ value: 'web' });
      proxy.stageLaneSpec({
        specName,
        spec: LaneSpecStub({
          name: specName,
          processes: [
            LaneProcessStub(),
            LaneProcessStub({
              name: webProcessName,
              portRole: PortRoleStub({ value: 'web' }),
              readyPath: UrlPathStub({ value: '/' }),
            }),
          ],
        }),
      });
      proxy.stageProcessReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.stageProcessUnreachable({ url: 'http://dungeonmaster.localhost:34173/' });
      proxy.setupBootNeverAnswers({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        nowMs,
      });

      const thrownError = await instanceStartBroker({
        specName,
        questId: null,
        guildId: null,
        seed: null,
      }).catch((error: unknown) => error);

      expect(String(thrownError)).toBe(
        `LaneBootFailedError: Lane ${specName} for instance ${instanceId} did not become ready: ${webProcessName} never answered their ready path. Logs: ${UNOWNED_EVIDENCE_PATH_VALUE}/driver.log`,
      );
    });
  });

  describe('baseUrl', () => {
    it('VALID: {spec with no process claiming the web port} => baseUrl is null', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = SpecNameStub({ value: 'test-browserless-baseurl' });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId, specName })] }),
      });

      const result = await instanceStartBroker({
        specName,
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.baseUrl).toBe(null);
    });

    it('VALID: {spec with a process claiming the web port} => baseUrl is the real web URL', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = SpecNameStub({ value: 'test-browsered-baseurl' });
      proxy.stageLaneSpec({
        specName,
        spec: LaneSpecStub({
          name: specName,
          processes: [
            LaneProcessStub(),
            LaneProcessStub({
              name: LaneProcessNameStub({ value: 'web' }),
              portRole: PortRoleStub({ value: 'web' }),
              readyPath: UrlPathStub({ value: '/' }),
            }),
          ],
          browser: true,
        }),
      });
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: instanceId,
              specName,
              ports: PortPairStub({ api: 40_500, web: 40_501 }),
            }),
          ],
        }),
      });

      const result = await instanceStartBroker({
        specName,
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.baseUrl).toBe('http://dungeonmaster.localhost:40501');
    });
  });

  describe('apiUrl', () => {
    it('VALID: {spec whose processes include the api process} => apiUrl is the real api URL', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = SpecNameStub({ value: 'test-api-surface-apiurl' });
      proxy.stageLaneSpec({ specName, spec: LaneSpecStub({ name: specName }) });
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: instanceId,
              specName,
              ports: PortPairStub({ api: 40_502, web: 40_503 }),
            }),
          ],
        }),
      });

      const result = await instanceStartBroker({
        specName,
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.apiUrl).toBe('http://dungeonmaster.localhost:40502');
    });
  });

  describe('aheadOfMe', () => {
    it('VALID: {two reservations already queued} => aheadOfMe is 2', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const queuedOne = RegistryEntryStub({ bootedAtMs: null });
      const queuedTwo = RegistryEntryStub({ bootedAtMs: null });
      const bootedEntry = RegistryEntryStub({ id: instanceId, bootedAtMs: EpochMsStub() });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [queuedOne, queuedTwo, bootedEntry] }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.aheadOfMe).toBe(2);
    });

    it('VALID: {a killed row that never booted} => counts only the live reservation, not the tombstone', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const queued = RegistryEntryStub({ id: InstanceIdStub(), bootedAtMs: null });
      const killedBeforeBoot = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_deadbeef0000400080008000deadbeef' }),
        bootedAtMs: null,
        state: InstanceStateStub({ value: 'killed' }),
      });
      const bootedEntry = RegistryEntryStub({ id: instanceId, bootedAtMs: EpochMsStub() });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [queued, killedBeforeBoot, bootedEntry] }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.aheadOfMe).toBe(1);
    });
  });

  describe('queuedMs', () => {
    it('VALID: {the boot lock wait spans 34s} => queuedMs is 34000', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBootWithQueuedMs({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
        startedAtMs: 1_700_000_000_000,
        queuedMs: 34_000,
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.queuedMs).toBe(34_000);
    });
  });

  describe('stale instance reaping', () => {
    it('VALID: {stale instance in registry} => reaps it and reports the reap', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const staleInstanceId = InstanceIdStub({ value: 'inst_deadbeef01' });
      const staleEntry = RegistryEntryStub({
        id: staleInstanceId,
        state: 'alive',
        bootedAtMs: EpochMsStub({ value: 1_700_000_000_000 - 30_000 }),
        lastBeatMs: EpochMsStub({ value: 1_700_000_000_000 - 20_000 }),
      });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [staleEntry, RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupStaleReap({ staleInstanceId });

      await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(proxy.getStderrMessages()).toStrictEqual([
        `instanceStartBroker: reaped stale instance ${staleInstanceId} — heartbeat gone cold, signalled pgids []\n`,
      ]);
    });
  });

  describe('quest and guild partitioning', () => {
    it('VALID: {no quest} => the evidence path files under unowned', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.evidence.path).toBe(
        '/default/cwd/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479',
      );
    });

    it('VALID: {quest with a guild} => the evidence path files under that guild', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const guildEvidencePath = FilePathStub({
        value: `/home/user/.dungeonmaster/siegelense/guilds/${guildId}/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479`,
      });
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: guildEvidencePath,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId, questId, guildId })],
        }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId,
        guildId,
        seed: null,
      });

      expect(result.evidence.path).toBe(
        `/default/cwd/.dungeonmaster-assets/siegelense-assets/guilds/${guildId}/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479`,
      );
    });
  });

  describe('manifest', () => {
    it('VALID: {start} => the manifest carries the evidence directory as a repo-local path', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.evidence).toStrictEqual({
        path: '/default/cwd/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479',
        linkPresent: true,
      });
    });
  });

  describe("capacity's one hard refusal", () => {
    it('ERROR: {capacity suggests 0 for want of memory} => throws before any reservation is written, carrying the why verbatim', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupCapacityRefusal({
        specName: SpecNameStub(),
        why: 'no room for one more: 2599MB available is under the 2600MB this spec peaks at',
      });

      await expect(
        instanceStartBroker({ specName: SpecNameStub(), questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(
        /^Refusing to start dungeonmaster-stack: this machine cannot hold another instance right now — no room for one more: 2599MB available is under the 2600MB this spec peaks at\. Run/u,
      );

      expect(proxy.getWriteOrder()).toStrictEqual([]);
    });

    it('ERROR: {capacity suggests 0 because the pool is full} => the same refusal carries the policy reason instead', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupCapacityRefusal({
        specName: SpecNameStub(),
        why: 'the policy pool of 3 is full',
      });

      await expect(
        instanceStartBroker({ specName: SpecNameStub(), questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(
        /^Refusing to start dungeonmaster-stack: this machine cannot hold another instance right now — the policy pool of 3 is full\. Run/u,
      );

      expect(proxy.getWriteOrder()).toStrictEqual([]);
    });

    it('VALID: {capacity suggests more than zero} => the reservation is written and the boot proceeds', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });

      const result = await instanceStartBroker({
        specName: SpecNameStub(),
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.instanceId).toBe(instanceId);
    });
  });
});
