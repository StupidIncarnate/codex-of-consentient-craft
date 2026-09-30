import { chdir, cwd, deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import { driverStatics } from '../../statics/driver/driver-statics';
import { driverFleetHarness } from '../../../test/harnesses/driver-fleet/driver-fleet.harness';

import { DriverFlow } from './driver-flow';

describe('DriverFlow', () => {
  const testbed = installTestbedCreateBroker({ baseName: 'driver-flow' });
  const originalHome = getEnv('DUNGEONMASTER_HOME');

  beforeAll(() => {
    setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
  });

  describe('the registry has no row for this instance', () => {
    it('ERROR: {a fresh, isolated registry} => rejects with InstanceUnknownError, the same shared message every other call throws', async () => {
      const instanceId = InstanceIdStub({ value: 'inst_00000000' });

      await expect(DriverFlow({ instanceId })).rejects.toThrow(
        new InstanceUnknownError({ instanceId }),
      );
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      deleteEnv('DUNGEONMASTER_HOME');
    } else {
      setEnv('DUNGEONMASTER_HOME', originalHome);
    }
    testbed.cleanup();
  });
});

// A real boot of this stack measures ~20-21s once it succeeds (driverStatics/instanceLifecycleStatics'
// own comments), and a FAILED boot burns the full 180s bootTimeoutMs before it gives up. This ceiling
// covers either outcome without Jest's own 5000ms default hook timeout cutting the real answer off.
const BOOT_HOOK_TIMEOUT_MS = 220_000;
const HEARTBEAT_WAIT_CEILING_MS = 20_000;
// Every connection the driver's socket serves ends server-side the moment its reply is queued (see
// net-unix-serve-adapter.ts's own header), and laneTeardownBroker's own grace window
// (driverStatics.teardown.graceMs, 3s) is the only real wait on the kill path — 10s leaves ample
// margin over that without reading as a timing-sensitive guess.
const DRIVER_EXIT_WAIT_CEILING_MS = 10_000;
const HEADLESS_SPEC = 'api';

// FIXED: the driver, spawned as a real OS process from inside a Jest worker, used to crash before
// answering its ready path with `Error [ERR_MODULE_NOT_FOUND]` resolving
// `@dungeonmaster/shared/contracts` to TypeScript SOURCE instead of compiled `dist/`. Root cause,
// measured directly: `instanceStartBroker`'s spawn of the driver omitted `env` entirely, and Node's
// default (inherit `process.env`) does not read the LIVE environment when the spawning code runs
// inside a Jest worker — it resolves against a snapshot that predates any mutation the test process
// makes, including `packages/testing/src/jest.setup.js`'s own `--conditions=source` strip. So a
// Jest run that sets `NODE_OPTIONS=--conditions=source` for its own unit/integration jest process
// (ward's own injection, see `packages/ward/README.md` §5) handed that same flag to the driver
// despite the strip, and the driver's compiled bundle then resolved its own
// `require("@dungeonmaster/shared/contracts")` via the `source` condition. Plain Node (no Jest) does
// not have this split — confirmed by an A/B measurement. The fix is
// `instance-start-broker.ts` passing an explicit, freshly-built env snapshot (the same pattern
// `laneBootBroker` already used), never leaving `env` to Node's default. Confirmed by a real ward
// run: `ERR_MODULE_NOT_FOUND` no longer appears anywhere in this file's output.
//
// SECOND BLOCKER, FOUND AND FIXED: with the env fix above applied, a ward-driven run of this file
// still timed out on `LaneBootFailedError`. Reproduced in isolation with nothing else running — a
// bare `net.createServer().listen(socketPath)` against a path whose PARENT DIRECTORY does not exist
// rejects `EACCES`, not the `ENOENT` you would expect (measured directly, twice, before and after
// creating the directory by hand). Nothing in this package ever created
// `<os.tmpdir()>/dm-siege-sockets` — no caller of `netUnixServeAdapter` mkdir'd it, and the directory
// only ever existed on this machine as a leftover from an earlier successful run, which is what made
// the earlier manual reproduction read as flaky cross-process contention rather than a deterministic
// missing-directory defect. `netUnixServeAdapter` now `mkdirSync(dirname(socketPath), {recursive:
// true})`s before binding — see its own header.
const DRIVER_BOOT_BLOCKER = '';

describe('driver teardown', () => {
  if (DRIVER_BOOT_BLOCKER.length === 0) {
    describe('a single instance is torn down cleanly by kill', () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'driver-teardown-single',
      });
      const fleet = driverFleetHarness();
      const originalHome = getEnv('DUNGEONMASTER_HOME');
      const originalCwd = cwd();

      let hasAtLeastOneHeartbeatPgid: boolean;
      let everyHeartbeatPgidAliveWhileRunning: boolean;
      let killStopped: boolean;
      let everyHeartbeatPgidDeadAfterKill: boolean;
      let bothPortsFreeAfterKill: boolean;
      let homeGoneAfterKill: boolean;
      let evidenceDirKeptAfterKill: boolean;
      let apiLogKeptAfterKill: boolean;
      let driverProcessExitedAfterKill: boolean;

      beforeAll(async () => {
        setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
        fleet.ensureHomeReady({ home: testbed.guildPath });
        // Real boot, this checkout's own server: .dungeonmaster.json goes into the testbed's own
        // OS-tmp dir, never this repo's — see driver-fleet.harness.ts's own header.
        fleet.configureApiLane({ configDir: testbed.guildPath });
        chdir(testbed.guildPath);

        const manifest = await fleet.boot({ specName: HEADLESS_SPEC });
        const heartbeatPgids = await fleet.waitForHeartbeatPgids({
          instanceId: manifest.instanceId,
          deadlineMs: Date.now() + HEARTBEAT_WAIT_CEILING_MS,
        });
        hasAtLeastOneHeartbeatPgid = heartbeatPgids.length > 0;
        everyHeartbeatPgidAliveWhileRunning = heartbeatPgids.every((pgid) =>
          fleet.isGroupAlive({ pgid }),
        );

        const entry = await fleet.registryEntry({ instanceId: manifest.instanceId });
        const ports = entry === undefined ? [] : [entry.ports.api, entry.ports.web];
        const driverPid = entry === undefined ? null : entry.pid;

        const killed = await fleet.killViaBroker({ instanceId: manifest.instanceId });
        killStopped = killed.stopped;

        everyHeartbeatPgidDeadAfterKill = heartbeatPgids.every(
          (pgid) => !fleet.isGroupAlive({ pgid }),
        );
        const portFreeFlags = await Promise.all(
          ports.map(async (port) => fleet.isPortFree({ port })),
        );
        bothPortsFreeAfterKill = portFreeFlags.length === 2 && portFreeFlags.every((free) => free);
        homeGoneAfterKill = !fleet.homeDirExists({ instanceId: killed.instanceId });
        evidenceDirKeptAfterKill = fleet.evidenceDirExists({ instanceId: killed.instanceId });
        apiLogKeptAfterKill = fleet.apiLogExists({ instanceId: killed.instanceId });
        driverProcessExitedAfterKill =
          driverPid !== null &&
          (await fleet.waitForDriverProcessExit({
            pid: driverPid,
            deadlineMs: Date.now() + DRIVER_EXIT_WAIT_CEILING_MS,
          }));
      }, BOOT_HOOK_TIMEOUT_MS);

      afterAll(async () => {
        await fleet.afterAll();
        chdir(originalCwd);
        if (originalHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', originalHome);
        }
        testbed.cleanup();
      }, BOOT_HOOK_TIMEOUT_MS);

      it('VALID: {instance alive} => the heartbeat file names at least one process group', () => {
        expect(hasAtLeastOneHeartbeatPgid).toBe(true);
      });

      it('VALID: {instance alive} => every process group the heartbeat names is alive', () => {
        expect(everyHeartbeatPgidAliveWhileRunning).toBe(true);
      });

      it('VALID: {kill} => the kill broker reports it stopped the instance', () => {
        expect(killStopped).toBe(true);
      });

      it('VALID: {kill} => no process group the heartbeat named survives', () => {
        expect(everyHeartbeatPgidDeadAfterKill).toBe(true);
      });

      it('VALID: {kill} => both claimed ports are free for the next allocation', () => {
        expect(bothPortsFreeAfterKill).toBe(true);
      });

      it('VALID: {kill} => the throwaway home directory is gone', () => {
        expect(homeGoneAfterKill).toBe(true);
      });

      it('VALID: {kill} => the evidence directory is NOT removed', () => {
        expect(evidenceDirKeptAfterKill).toBe(true);
      });

      it("VALID: {kill} => the evidence directory's api-server.log is NOT removed", () => {
        expect(apiLogKeptAfterKill).toBe(true);
      });

      it("VALID: {kill} => the driver's own OS process exits", () => {
        expect(driverProcessExitedAfterKill).toBe(true);
      });
    });
  }

  describe('snapshots — NOT APPLICABLE YET (chunk 2 has no snapshot mechanism to tear down)', () => {
    // No test here is deliberate — a passing assertion about snapshot cleanup would pass vacuously
    // against a feature that does not exist yet. siegelense-tooling.md's teardown table names this
    // row; this describe name is the record that it was seen and is not forgotten, not skipped.
  });

  if (DRIVER_BOOT_BLOCKER.length === 0) {
    describe("a SIGKILLed driver's orphans are reaped by a second process's kill", () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'driver-teardown-sigkill',
      });
      const fleet = driverFleetHarness();
      const originalHome = getEnv('DUNGEONMASTER_HOME');
      const originalCwd = cwd();

      let reapedMatchesRecordedPgids: boolean;
      let everyOrphanDeadAfterReap: boolean;
      let homeGoneAfterReap: boolean;
      let evidenceDirKeptAfterReap: boolean;

      beforeAll(async () => {
        setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
        fleet.ensureHomeReady({ home: testbed.guildPath });
        fleet.configureApiLane({ configDir: testbed.guildPath });
        chdir(testbed.guildPath);

        const manifest = await fleet.boot({ specName: HEADLESS_SPEC });
        const entry = await fleet.registryEntry({ instanceId: manifest.instanceId });
        const preKillPgids = entry === undefined ? [] : entry.pgids;
        const driverPid = entry === undefined ? null : entry.pid;

        // SIGKILL only the DRIVER's own pid — never the process group. Its own idle timeout and its
        // own SIGINT/SIGTERM handlers die with it, so nothing about the driver self-reaps; a second
        // process (this jest process, calling killViaBroker below) is the only thing left to notice.
        if (driverPid !== null) {
          fleet.sigkillDriverPid({ pid: driverPid });
        }

        const reaped = await fleet.killViaBroker({ instanceId: manifest.instanceId });

        reapedMatchesRecordedPgids =
          JSON.stringify([...reaped.reapedPgids]) === JSON.stringify([...preKillPgids]);
        everyOrphanDeadAfterReap = preKillPgids.every((pgid) => !fleet.isGroupAlive({ pgid }));
        homeGoneAfterReap = !fleet.homeDirExists({ instanceId: reaped.instanceId });
        evidenceDirKeptAfterReap = fleet.evidenceDirExists({ instanceId: reaped.instanceId });
      }, BOOT_HOOK_TIMEOUT_MS);

      afterAll(async () => {
        await fleet.afterAll();
        chdir(originalCwd);
        if (originalHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', originalHome);
        }
        testbed.cleanup();
      }, BOOT_HOOK_TIMEOUT_MS);

      it('ERROR: {driver SIGKILLed} => the reaping kill reports the pgids it found and signalled', () => {
        expect(reapedMatchesRecordedPgids).toBe(true);
      });

      it('ERROR: {driver SIGKILLed} => every orphaned process group is dead once the reap returns', () => {
        expect(everyOrphanDeadAfterReap).toBe(true);
      });

      it('ERROR: {driver SIGKILLed} => the reaping kill still removes the throwaway home', () => {
        expect(homeGoneAfterReap).toBe(true);
      });

      it('ERROR: {driver SIGKILLed} => the reaping kill still keeps the evidence directory', () => {
        expect(evidenceDirKeptAfterReap).toBe(true);
      });
    });
  }

  if (DRIVER_BOOT_BLOCKER.length === 0) {
    describe('killing one of three parallel instances leaves the other two untouched', () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'driver-teardown-parallel',
      });
      const fleet = driverFleetHarness();
      const originalHome = getEnv('DUNGEONMASTER_HOME');
      const originalCwd = cwd();

      let bothSurvivorsAnsweredPing: boolean;
      let bothSurvivorsKeptEveryProcessGroup: boolean;

      beforeAll(async () => {
        setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
        fleet.ensureHomeReady({ home: testbed.guildPath });
        fleet.configureApiLane({ configDir: testbed.guildPath });
        chdir(testbed.guildPath);

        // Promise.allSettled, never Promise.all: three real boots each carry their own
        // `instanceStartBootPollLayerBroker` retry loop, and Promise.all abandons a still-pending
        // sibling's loop the instant any ONE of the three rejects — its setTimeout chain (and, if
        // that sibling's boot goes on to succeed unattended, its whole real lane) then keeps running
        // with nothing left to track or reap it, invisible to `fleet.afterAll()` because
        // `trackedInstanceIds` only gains an id once `fleet.boot()` itself returns. allSettled waits
        // out every promise before this line moves on, so nothing is ever abandoned mid-flight; the
        // throws below reproduce Promise.all's own fail-fast reporting once every boot has actually
        // finished.
        const [resultA, resultB, resultC] = await Promise.allSettled([
          fleet.boot({ specName: HEADLESS_SPEC }),
          fleet.boot({ specName: HEADLESS_SPEC }),
          fleet.boot({ specName: HEADLESS_SPEC }),
        ]);
        if (resultA.status === 'rejected') {
          throw resultA.reason;
        }
        if (resultB.status === 'rejected') {
          throw resultB.reason;
        }
        if (resultC.status === 'rejected') {
          throw resultC.reason;
        }
        const manifestA = resultA.value;
        const manifestB = resultB.value;
        const manifestC = resultC.value;

        const [entryA, entryB] = await Promise.all([
          fleet.registryEntry({ instanceId: manifestA.instanceId }),
          fleet.registryEntry({ instanceId: manifestB.instanceId }),
        ]);
        const pgidsA = entryA === undefined ? [] : entryA.pgids;
        const pgidsB = entryB === undefined ? [] : entryB.pgids;

        // Kill the MIDDLE instance. This is the row the plan says gets skipped: the failure mode only
        // shows up under parallelism — if a group-kill were ever widened by one pid it would take a
        // survivor's process group down along with the target one.
        await fleet.killViaBroker({ instanceId: manifestC.instanceId });

        const [pingA, pingB] = await Promise.all([
          fleet.pingSocket({ instanceId: manifestA.instanceId }),
          fleet.pingSocket({ instanceId: manifestB.instanceId }),
        ]);
        bothSurvivorsAnsweredPing = pingA && pingB;

        const aliveA = pgidsA.every((pgid) => fleet.isGroupAlive({ pgid }));
        const aliveB = pgidsB.every((pgid) => fleet.isGroupAlive({ pgid }));
        bothSurvivorsKeptEveryProcessGroup = aliveA && aliveB;
      }, BOOT_HOOK_TIMEOUT_MS);

      afterAll(async () => {
        await fleet.afterAll();
        chdir(originalCwd);
        if (originalHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', originalHome);
        }
        testbed.cleanup();
      }, BOOT_HOOK_TIMEOUT_MS);

      it('VALID: {killing one of three} => the other two still answer ping on their sockets', () => {
        expect(bothSurvivorsAnsweredPing).toBe(true);
      });

      it('VALID: {killing one of three} => the other two keep every one of their own process groups alive', () => {
        expect(bothSurvivorsKeptEveryProcessGroup).toBe(true);
      });
    });
  }

  if (DRIVER_BOOT_BLOCKER.length === 0) {
    describe('an idle instance is reaped by the idle timeout', () => {
      // driverStatics.idle.timeoutMs is 900_000ms with no override, which would cost 15 minutes per
      // run — but `instanceStartBroker`'s own `idleTimeoutMs` override (the same `--idle-timeout-ms`
      // flag `start` exposes) lets this suite ask the real spawned driver for a much shorter ceiling
      // instead. This is DEF-52's own repro: `inst_d6f2b521c993487a87236623eabbd477` (evidence in
      // scrolls/walkthrough/LEDGER.md) got no run before its idle timeout fired, and both process
      // groups its heartbeat named were still alive minutes later, when only `kill` finally reaped
      // them.
      const testbed = installTestbedCreateBroker({
        baseName: 'driver-teardown-idle',
      });
      const fleet = driverFleetHarness();
      const originalHome = getEnv('DUNGEONMASTER_HOME');
      const originalCwd = cwd();

      const IDLE_TIMEOUT_MS = 3_000;
      // Covers the idle wait itself plus scheduler contention on a loaded machine — the same
      // multi-second stretch driver-statics.ts's own `socket.connectTimeoutMs` comment measures.
      const IDLE_REAP_WAIT_CEILING_MS = 20_000;
      // laneTeardownBroker's SIGTERM -> driverStatics.teardown.graceMs -> SIGKILL escalation is the
      // only real wait left once the marker lands.
      const KILL_ESCALATION_WAIT_MS = driverStatics.teardown.graceMs + 3_000;

      let hasAtLeastOneHeartbeatPgid: boolean;
      let shutdownReasonWritten: boolean;
      let everyHeartbeatPgidDeadAfterIdleReap: boolean;
      let bothPortsFreeAfterIdleReap: boolean;

      beforeAll(async () => {
        setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
        fleet.ensureHomeReady({ home: testbed.guildPath });
        fleet.configureApiLane({ configDir: testbed.guildPath });
        chdir(testbed.guildPath);

        const manifest = await fleet.boot({
          specName: HEADLESS_SPEC,
          idleTimeoutMs: IDLE_TIMEOUT_MS,
        });
        const heartbeatPgids = await fleet.waitForHeartbeatPgids({
          instanceId: manifest.instanceId,
          deadlineMs: Date.now() + HEARTBEAT_WAIT_CEILING_MS,
        });
        hasAtLeastOneHeartbeatPgid = heartbeatPgids.length > 0;

        const entry = await fleet.registryEntry({ instanceId: manifest.instanceId });
        const ports = entry === undefined ? [] : [entry.ports.api, entry.ports.web];

        shutdownReasonWritten = await fleet.waitForShutdownReason({
          instanceId: manifest.instanceId,
          deadlineMs: Date.now() + IDLE_TIMEOUT_MS + IDLE_REAP_WAIT_CEILING_MS,
        });

        everyHeartbeatPgidDeadAfterIdleReap = await fleet.waitForGroupsDead({
          pgids: heartbeatPgids,
          deadlineMs: Date.now() + KILL_ESCALATION_WAIT_MS,
        });
        const portFreeFlags = await Promise.all(
          ports.map(async (port) => fleet.isPortFree({ port })),
        );
        bothPortsFreeAfterIdleReap =
          portFreeFlags.length === 2 && portFreeFlags.every((free) => free);
      }, BOOT_HOOK_TIMEOUT_MS);

      afterAll(async () => {
        await fleet.afterAll();
        chdir(originalCwd);
        if (originalHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', originalHome);
        }
        testbed.cleanup();
      }, BOOT_HOOK_TIMEOUT_MS);

      it('VALID: {instance alive} => the heartbeat file names at least one process group', () => {
        expect(hasAtLeastOneHeartbeatPgid).toBe(true);
      });

      it('VALID: {no run sent, idle timeout elapses} => the driver records the idle self-reap', () => {
        expect(shutdownReasonWritten).toBe(true);
      });

      it('VALID: {idle timeout elapses} => no process group the heartbeat named survives', () => {
        expect(everyHeartbeatPgidDeadAfterIdleReap).toBe(true);
      });

      it('VALID: {idle timeout elapses} => both claimed ports are free for the next allocation', () => {
        expect(bothPortsFreeAfterIdleReap).toBe(true);
      });
    });
  }

  if (DRIVER_BOOT_BLOCKER.length === 0) {
    describe('a browsered idle instance is reaped by the idle timeout', () => {
      // The `stack` spec — a real Chromium session plus a video recorder — is what
      // `inst_d6f2b521c993487a87236623eabbd477` (DEF-52's own report) and
      // `inst_b7ed8a08fdc04b4bb5ba9d0e7ec6d370` (a later master repro, same LEDGER entry) both
      // booted, so this variant covers the browser path the headless describe above cannot. It
      // asserts only the two server process groups the heartbeat names — never that the driver's
      // OWN OS process has exited by the time this hook returns. Measured directly: on a browsered
      // lane the driver plus its Playwright video-recorder (ffmpeg) child can take 34-100s past the
      // reap to finish finalizing the recording and exit on their own — a slow shutdown, not a
      // leak, and asserting it here would make this test flaky against nothing more than that
      // encode time.
      const testbed = installTestbedCreateBroker({
        baseName: 'driver-teardown-idle-browsered',
      });
      const fleet = driverFleetHarness();
      const originalHome = getEnv('DUNGEONMASTER_HOME');
      const originalCwd = cwd();

      const IDLE_TIMEOUT_MS = 3_000;
      const IDLE_REAP_WAIT_CEILING_MS = 20_000;
      const KILL_ESCALATION_WAIT_MS = driverStatics.teardown.graceMs + 3_000;
      const BROWSERED_SPEC = 'stack';

      let hasAtLeastOneHeartbeatPgid: boolean;
      let shutdownReasonWritten: boolean;
      let everyHeartbeatPgidDeadAfterIdleReap: boolean;

      beforeAll(async () => {
        setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
        fleet.ensureHomeReady({ home: testbed.guildPath });
        fleet.configureApiLane({ configDir: testbed.guildPath });
        chdir(testbed.guildPath);

        const manifest = await fleet.boot({
          specName: BROWSERED_SPEC,
          idleTimeoutMs: IDLE_TIMEOUT_MS,
        });
        const heartbeatPgids = await fleet.waitForHeartbeatPgids({
          instanceId: manifest.instanceId,
          deadlineMs: Date.now() + HEARTBEAT_WAIT_CEILING_MS,
        });
        hasAtLeastOneHeartbeatPgid = heartbeatPgids.length > 0;

        shutdownReasonWritten = await fleet.waitForShutdownReason({
          instanceId: manifest.instanceId,
          deadlineMs: Date.now() + IDLE_TIMEOUT_MS + IDLE_REAP_WAIT_CEILING_MS,
        });

        everyHeartbeatPgidDeadAfterIdleReap = await fleet.waitForGroupsDead({
          pgids: heartbeatPgids,
          deadlineMs: Date.now() + KILL_ESCALATION_WAIT_MS,
        });
      }, BOOT_HOOK_TIMEOUT_MS);

      afterAll(async () => {
        await fleet.afterAll();
        chdir(originalCwd);
        if (originalHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', originalHome);
        }
        testbed.cleanup();
      }, BOOT_HOOK_TIMEOUT_MS);

      it('VALID: {instance alive} => the heartbeat file names at least one process group', () => {
        expect(hasAtLeastOneHeartbeatPgid).toBe(true);
      });

      it('VALID: {no run sent, idle timeout elapses} => the driver records the idle self-reap', () => {
        expect(shutdownReasonWritten).toBe(true);
      });

      it('VALID: {idle timeout elapses} => no process group the heartbeat named survives', () => {
        expect(everyHeartbeatPgidDeadAfterIdleReap).toBe(true);
      });
    });
  }
});
