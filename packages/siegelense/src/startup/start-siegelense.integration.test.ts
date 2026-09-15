import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { StartSiegelense } from './start-siegelense';

describe('StartSiegelense', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'start-siegelense' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  describe('the bare invocation', () => {
    it('VALID: {args: []} => delegates to the fleet responder and reports an empty fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await StartSiegelense({ args: [] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('the driver route', () => {
    it('ERROR: {args: driver --instance <unreserved id>} => delegates to the driver responder, which rejects naming the instance', async () => {
      await expect(
        StartSiegelense({ args: ['driver', '--instance', 'inst_dead0000'] }),
      ).rejects.toThrow(/inst_dead0000 not found in the registry/u);
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });
});
