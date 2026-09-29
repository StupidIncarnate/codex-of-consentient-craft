import { deleteEnv, getEnv, setEnv, stdout } from '#gateway/node/process';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceUnknownError } from '../errors/instance-unknown/instance-unknown-error';
import { machineStatics } from '../statics/machine/machine-statics';
import { StartSiegelense } from './start-siegelense';

describe('StartSiegelense', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'start-siegelense' }),
  });
  const originalHome = getEnv('DUNGEONMASTER_HOME');

  beforeAll(() => {
    setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
  });

  describe('the bare invocation', () => {
    it('VALID: {args: []} => delegates to the status responder and reports the reworded empty-fleet sentence naming the default --since window', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await StartSiegelense({ args: [] });

      const writes = stdoutSpy
        .callsMatching([])
        .map((call) => ContentTextStub({ value: String(call[0]) }));

      // MACHINE reads live statfs/loadavg, stripped the same way siegelense-flow.integration.test.ts
      // strips it from the equivalent assertion, so this stays deterministic.
      const [wholeOutput] = writes;
      const withoutLiveMachineLine = wholeOutput!.replace(/^MACHINE: .*\n/mu, '');

      expect(withoutLiveMachineLine).toBe(
        `MONITORED: ${machineStatics.monitored.join(', ')}\n` +
          'No siegelense instances created in the last 6hr. Widen with --since beginning.\n',
      );
    });
  });

  describe('the driver route', () => {
    it('ERROR: {args: driver --instance <unreserved id>} => delegates to the driver responder, which rejects with InstanceUnknownError', async () => {
      await expect(
        StartSiegelense({ args: ['driver', '--instance', 'inst_dead0000'] }),
      ).rejects.toThrow(new InstanceUnknownError({ instanceId: 'inst_dead0000' }));
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
