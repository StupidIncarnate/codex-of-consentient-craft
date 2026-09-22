import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../contracts/registry/registry.stub';
import { DriverUnreachableError } from '../../errors/driver-unreachable/driver-unreachable-error';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';

import { SiegelenseRunLayerFlow } from './siegelense-run-layer-flow';

// A batch that parses cleanly through runArgsParseTransformer regardless of which case reaches it —
// its own content is never the thing under test below.
const ONE_STEP_BATCH = JSON.stringify([{ step: 'goto', path: '/' }]);

describe('SiegelenseRunLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-run-layer-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  // Neither flag here ever reaches I/O — runArgsParseTransformer refuses before registryReadBroker
  // is ever called, so no registry or home state is relevant to these three.
  describe('argv refused before any I/O', () => {
    it('ERROR: {no --instance} => refuses naming the missing flag', async () => {
      await expect(
        SiegelenseRunLayerFlow({ callArgs: ['--steps', ONE_STEP_BATCH] }),
      ).rejects.toThrow(/^--instance is required: name the instance this batch runs against\.$/u);
    });

    it('ERROR: {neither --steps nor --steps-file} => refuses naming both flags', async () => {
      const instanceId = InstanceIdStub();

      await expect(
        SiegelenseRunLayerFlow({ callArgs: ['--instance', instanceId] }),
      ).rejects.toThrow(
        /^Exactly one of --steps or --steps-file is required: --steps carries the batch's JSON array inline, --steps-file names a file holding it, and neither was given\.$/u,
      );
    });

    it('ERROR: {both --steps and --steps-file} => refuses naming both flags', async () => {
      const instanceId = InstanceIdStub();
      // The responder reads --steps-file off disk BEFORE the mutual-exclusivity check ever runs, so
      // the named file has to exist and be readable — otherwise the file-read refusal fires first
      // and this test would never reach the refusal it means to cover.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'steps/both-flags-batch.json' }),
        content: FileContentStub({ value: ONE_STEP_BATCH }),
      });
      const stepsFilePath = `${testbed.guildPath}/steps/both-flags-batch.json`;

      await expect(
        SiegelenseRunLayerFlow({
          callArgs: [
            '--instance',
            instanceId,
            '--steps',
            ONE_STEP_BATCH,
            '--steps-file',
            stepsFilePath,
          ],
        }),
      ).rejects.toThrow(
        /^Exactly one of --steps or --steps-file is required: --steps carries the batch's JSON array inline, --steps-file names a file holding it, and both were given\.$/u,
      );
    });
  });

  // No registry.json exists anywhere in this testbed yet at this point in the file, so
  // registryReadBroker's real ENOENT-means-empty-fleet path is what answers these — a real read of
  // a real (absent) file, not a mock standing in for one.
  describe('a real registry read finds no row for the instance', () => {
    it('ERROR: {--steps, unknown instance} => rejects with InstanceUnknownError', async () => {
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      await expect(
        SiegelenseRunLayerFlow({
          callArgs: ['--instance', instanceId, '--steps', ONE_STEP_BATCH],
        }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId }));
    });

    it('ERROR: {--steps-file naming a real file, unknown instance} => reads the file for real, then rejects with InstanceUnknownError', async () => {
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'steps/unknown-instance-batch.json' }),
        content: FileContentStub({ value: ONE_STEP_BATCH }),
      });
      const stepsFilePath = `${testbed.guildPath}/steps/unknown-instance-batch.json`;

      await expect(
        SiegelenseRunLayerFlow({
          callArgs: ['--instance', instanceId, '--steps-file', stepsFilePath],
        }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId }));
    });

    it('ERROR: {--steps, unknown instance, --json} => --json does not change the refusal', async () => {
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      await expect(
        SiegelenseRunLayerFlow({
          callArgs: ['--instance', instanceId, '--steps', ONE_STEP_BATCH, '--json'],
        }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId }));
    });
  });

  // A known instance whose registry row points at a socket path this suite fully controls and never
  // binds — no live driver, and none faked. The real instanceRunBroker reads this real registry row,
  // then netUnixRequestAdapter makes a REAL connect() against that real (empty) path and gets a real
  // ENOENT, which instanceRunBroker wraps in DriverUnreachableError. This is as far as `--steps`,
  // `--steps-file` and `--stop-on` can be proven to reach without a live driver process behind the
  // socket: everything up to and including the real connection attempt is exercised for real, but
  // which step `stopOn` would have stopped at is decided driver-side (runExecuteBroker), which never
  // runs here. Covered elsewhere with a live driver: run-execute-broker.test.ts (stopOn's own
  // stepsRun/stoppedAt effect) and driver-flow.integration.test.ts's fleet harness pattern (a real
  // boot). --json's OWN effect (writing raw JSON instead of the human summary) only happens after a
  // successful run and so is equally out of reach here — proven instead by
  // siegelense-run-responder.test.ts's mocked-broker success cases.
  describe('a known instance whose driver is unreachable', () => {
    const knownInstanceId = InstanceIdStub({ value: 'inst_c0ffee01' });
    const deadSocketPath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/dead-driver.sock`,
    });

    beforeAll(() => {
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: knownInstanceId, socketPath: deadSocketPath })],
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'siegelense/registry.json' }),
        content: FileContentStub({ value: `${JSON.stringify(registry)}\n` }),
      });
    });

    it('ERROR: {--steps, no --stop-on} => the default reaches a real connection attempt and rejects with DriverUnreachableError', async () => {
      await expect(
        SiegelenseRunLayerFlow({
          callArgs: ['--instance', knownInstanceId, '--steps', ONE_STEP_BATCH],
        }),
      ).rejects.toStrictEqual(
        new DriverUnreachableError({
          instanceId: knownInstanceId,
          socketPath: deadSocketPath,
          cause: new Error(`connect ENOENT ${deadSocketPath}`),
        }),
      );
    });

    it('ERROR: {--stop-on error} => reaches the same real connection attempt and rejects with DriverUnreachableError', async () => {
      await expect(
        SiegelenseRunLayerFlow({
          callArgs: [
            '--instance',
            knownInstanceId,
            '--steps',
            ONE_STEP_BATCH,
            '--stop-on',
            'error',
          ],
        }),
      ).rejects.toStrictEqual(
        new DriverUnreachableError({
          instanceId: knownInstanceId,
          socketPath: deadSocketPath,
          cause: new Error(`connect ENOENT ${deadSocketPath}`),
        }),
      );
    });

    it('ERROR: {--stop-on never} => reaches the same real connection attempt and rejects with DriverUnreachableError', async () => {
      await expect(
        SiegelenseRunLayerFlow({
          callArgs: [
            '--instance',
            knownInstanceId,
            '--steps',
            ONE_STEP_BATCH,
            '--stop-on',
            'never',
          ],
        }),
      ).rejects.toStrictEqual(
        new DriverUnreachableError({
          instanceId: knownInstanceId,
          socketPath: deadSocketPath,
          cause: new Error(`connect ENOENT ${deadSocketPath}`),
        }),
      );
    });
  });
});
