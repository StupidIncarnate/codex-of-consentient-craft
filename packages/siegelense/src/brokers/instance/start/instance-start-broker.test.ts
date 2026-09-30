import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts/dev-server-e2e-process/dev-server-e2e-process.stub';

import { instanceStartBroker } from './instance-start-broker';
import { instanceStartBrokerProxy } from './instance-start-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { DriverBootFailedError } from '../../../errors/driver-boot-failed/driver-boot-failed-error';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

const UNOWNED_EVIDENCE_PATH_VALUE =
  '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479';
const UNOWNED_EVIDENCE_PATH = UNOWNED_EVIDENCE_PATH_VALUE;

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
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(proxy.getRegistryAndBootLockWriteOrder()).toStrictEqual([
        '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
        '/home/user/.dungeonmaster/siegelense/boot.lock',
      ]);
    });

    it('VALID: {start} => writes the boot lock file naming the reserved instance and this process', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupBootLockPid({ pid: 31_337 });
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
      });

      await instanceStartBroker({
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(proxy.getWrittenBootLock()).toStrictEqual({
        heldBy: instanceId,
        heldByPid: '31337',
        acquiredAtMs: 1,
      });
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
        idleTimeoutMs: 1_800_000,
      });

      const result = await instanceStartBroker({
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 1_800_000,
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
        specName: 'api',
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
      const specName = 'api';
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
      const specName = 'api';
      const driverMessage = 'the api process exited before opening its port.';
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
      const specName = 'api';
      proxy.setupBootFailureMarkerAppears({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        driverMessage: 'the api process exited before opening its port',
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
      const specName = 'api';
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
      const specName = 'api';
      proxy.stageProcessUnreachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
      proxy.setupBootNeverAnswers({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId })],
        }),
        nowMs,
      });
      proxy.stageInstanceReleaseWriteFails({ code: 'EACCES' });

      await expect(
        instanceStartBroker({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(LaneBootFailedError);

      expect(proxy.getStderrMessages()).toStrictEqual([
        `instanceStartBroker: stopping ${instanceId} after a failed boot failed, falling back to releasing the reservation: Error: EACCES: write '/home/user/.dungeonmaster/siegelense/registry.json.tmp'\n`,
        `instanceStartBroker: releasing the reservation for ${instanceId} after a failed boot failed: Error: EACCES: write '/home/user/.dungeonmaster/siegelense/registry.json.tmp'\n`,
      ]);
    });
  });

  describe('unready names only the processes that actually failed to answer', () => {
    it('ERROR: {api reachable, web unreachable} => unready names only the web process', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const nowMs = 1_700_000_000_000;
      const specName = 'stack';
      const webProcessName = 'web';
      proxy.stageLaneSpec({
        processes: [
          DevServerE2eProcessStub({
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
          }),
          DevServerE2eProcessStub({
            name: 'web',
            command: 'npx vite preview --strictPort',
            portRole: 'web',
            readyPath: '/',
          }),
        ],
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
      const specName = 'api';
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
      const specName = 'stack';
      proxy.stageLaneSpec({
        processes: [
          DevServerE2eProcessStub({
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
          }),
          DevServerE2eProcessStub({
            name: 'web',
            command: 'npx vite preview --strictPort',
            portRole: 'web',
            readyPath: '/',
          }),
        ],
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
      const specName = 'api';
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
      const bootedEntry = RegistryEntryStub({ id: instanceId, bootedAtMs: 1 });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [queuedOne, queuedTwo, bootedEntry] }),
      });

      const result = await instanceStartBroker({
        specName: 'api',
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
        state: 'killed',
      });
      const bootedEntry = RegistryEntryStub({ id: instanceId, bootedAtMs: 1 });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [queued, killedBeforeBoot, bootedEntry] }),
      });

      const result = await instanceStartBroker({
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.aheadOfMe).toBe(1);
    });

    it('VALID: {a reservation past its own staleAfterMs window} => counts only the fresh reservation, not the abandoned one', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const queued = RegistryEntryStub({ id: InstanceIdStub(), bootedAtMs: null });
      const abandoned = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_a620d5f3cc1e4431ac7b1b2613d82292' }),
        bootedAtMs: null,
        lastBeatMs: null,
        // Well past instanceLifecycleStatics.reservation.staleAfterMs (300_000ms / 5m) relative to
        // EpochMsStub()'s own default value (1_700_000_000_000), which is what this proxy's
        // sticky Date.now() default answers every unstaged call with.
        reservedAtMs: EpochMsStub({
          value: 1 - instanceLifecycleStatics.reservation.staleAfterMs - 1,
        }),
      });
      const bootedEntry = RegistryEntryStub({ id: instanceId, bootedAtMs: 1 });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [queued, abandoned, bootedEntry] }),
      });

      const result = await instanceStartBroker({
        specName: 'api',
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
        specName: 'api',
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
        bootedAtMs: (1_700_000_000_000 - 30_000),
        lastBeatMs: (1_700_000_000_000 - 20_000),
      });

      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [staleEntry, RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupStaleReap({ staleInstanceId });

      await instanceStartBroker({
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(proxy.getStderrMessages()).toStrictEqual([
        `instanceStartBroker: reaped stale instance ${staleInstanceId} — heartbeat gone cold, signalled pgids []\n`,
      ]);
    });
  });

  describe('the registry read after boot never gained the booted row', () => {
    it('ERROR: {registry after boot has no row for this instance} => throws the plain sentence naming the instance and next steps', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [] }),
      });

      await expect(
        instanceStartBroker({
          specName: 'api',
          questId: null,
          guildId: null,
          seed: null,
        }),
      ).rejects.toStrictEqual(
        new Error(
          `Instance ${instanceId} booted but is missing from the registry now — run 'dungeonmaster siegelense status' to check the fleet, or start a fresh instance with 'dungeonmaster siegelense start'.`,
        ),
      );
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
        specName: 'api',
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
      const guildEvidencePath = `/home/user/.dungeonmaster/siegelense/guilds/${guildId}/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479`;
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: guildEvidencePath,
        registry: RegistryStub({
          instances: [RegistryEntryStub({ id: instanceId, questId, guildId })],
        }),
      });

      const result = await instanceStartBroker({
        specName: 'api',
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
        specName: 'api',
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

  describe('a failed seed stops the driver it just booted', () => {
    it('ERROR: {seed fails after a successful boot} => attempts a real kill of the running driver rather than only relabelling the registry row', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = 'api';
      const seed = 'guild-with-three-quests';
      const missingMessage =
        'No recipes package found at /default/cwd/packages/hydration-recipes. Run "dungeonmaster init" to scaffold packages/hydration-recipes.';
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.stageSeedFails();
      proxy.stageShutdownReasonWriteSucceeds({ evidencePath: UNOWNED_EVIDENCE_PATH });

      const startPromise = instanceStartBroker({ specName, questId: null, guildId: null, seed });

      await expect(startPromise).rejects.toThrow(missingMessage);
      expect(proxy.getKillConnectionCountFor({ instanceId })).toBe(2);
    });

    it('ERROR: {seed fails after a successful boot} => writes a shutdown reason naming the seed and its failure', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = 'api';
      const seed = 'guild-with-three-quests';
      const missingMessage =
        'No recipes package found at /default/cwd/packages/hydration-recipes. Run "dungeonmaster init" to scaffold packages/hydration-recipes.';
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.stageSeedFails();
      proxy.stageShutdownReasonWriteSucceeds({ evidencePath: UNOWNED_EVIDENCE_PATH });

      await instanceStartBroker({ specName, questId: null, guildId: null, seed }).catch(
        (error: unknown) => error,
      );

      expect(proxy.getWrittenShutdownReason({ evidencePath: UNOWNED_EVIDENCE_PATH })).toStrictEqual(
        {
          reason: `--seed ${seed} failed: RecipesPackageMissingError: ${missingMessage}`,
          atMs: 1,
        },
      );
    });
  });

  describe('a boot-lock acquisition failure releases the reservation it just made', () => {
    it('ERROR: {boot-lock acquire throws before the boot try even starts} => still releases the reservation, never the boot lock it never held', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      const specName = 'api';
      proxy.stageBootLockAcquireFailsWithReadError({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });

      await expect(
        instanceStartBroker({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toThrow(/^EMFILE: open '\/home\/user\/\.dungeonmaster\/siegelense\/boot\.lock'$/u);

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
      expect(proxy.getBootLockReleasedPaths()).toStrictEqual([]);
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
      proxy.setupCapacityShortOfMemory({ peakMB: 2600, steadyMB: 1800, freeMemMB: 3111 });

      await expect(
        instanceStartBroker({
          specName: 'api',
          questId: null,
          guildId: null,
          seed: null,
        }),
      ).rejects.toThrow(
        /^Refusing to start api: this machine cannot hold another instance right now — profile 2600MB peak \/ 1800MB steady at pool size 3, from 1 runs; free RAM 3111MB less 512MB headroom; nothing else up; no room for one more: 2599MB available is under the 2600MB this spec peaks at\. Run/u,
      );

      expect(proxy.getLastRegistryWriteContent()).toBe(undefined);
      expect(proxy.getWrittenBootLock()).toBe(undefined);
    });

    it('ERROR: {capacity suggests 0 because the pool is full} => the same refusal carries the policy reason instead', async () => {
      const proxy = instanceStartBrokerProxy();
      const instanceId = proxy.mintInstanceId();
      proxy.setupHappyBoot({
        instanceId,
        evidencePath: UNOWNED_EVIDENCE_PATH,
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_aaaa1111' }) }),
            RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_bbbb2222' }) }),
            RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_cccc3333' }) }),
            RegistryEntryStub({ id: instanceId }),
          ],
        }),
      });

      await expect(
        instanceStartBroker({
          specName: 'api',
          questId: null,
          guildId: null,
          seed: null,
        }),
      ).rejects.toThrow(
        /^Refusing to start api: this machine cannot hold another instance right now — no measured profile for api, so this suggests the default of 2 instances; run a pool of 2 once and siegelense records a profile for next time; free RAM 16000MB less 512MB headroom; 3 siege instances already up \(3 still reserving\); the policy pool of 3 is full\. Run/u,
      );

      expect(proxy.getLastRegistryWriteContent()).toBe(undefined);
      expect(proxy.getWrittenBootLock()).toBe(undefined);
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
        specName: 'api',
        questId: null,
        guildId: null,
        seed: null,
      });

      expect(result.instanceId).toBe(instanceId);
    });
  });
});
