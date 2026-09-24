/**
 * PURPOSE: Drives `SiegelenseProfileLayerFlow` through `profile`'s whole argv surface — `--spec`
 * (required), `--json` — against a real `installTestbedCreateBroker` evidence tree, no mocks.
 * `flows/` may import neither `brokers/` nor a `.proxy.ts` (`enforce-import-dependencies`,
 * `enforce-test-proxy-imports`), so every case here reaches the real `profileReadBroker` and
 * `laneSpecFindBroker` through the responder. `profileReadBroker` calls `laneSpecFindBroker` before
 * any filesystem read, so the badly-shaped-spec and unknown-spec refusals below need no fixture on
 * disk first — unlike `SiegelenseCapacityLayerFlow`'s own suite, whose `capacityReadBroker` reaches
 * a real `machineReadBroker` statfs before its spec check. `laneSpecFindBroker` derives BOTH lane
 * names from the SAME configured `devServer.e2e.processes`, differing only in whether a browser
 * rides along, so this testbed's own `.dungeonmaster.json` configures two processes (api + web) and
 * both `api` and `stack` are exercised against it — PROCESSES is proven to reflect the real spec
 * (2 for the headless name, 3 once the browser is added) rather than a fixed count.
 *
 * USAGE:
 * await SiegelenseProfileLayerFlow({ callArgs: ['--spec', 'api'] });
 * // Writes the human SpecProfile summary for a spec nothing has ever run
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { DungeonmasterConfigStub, configDefaultsStatics } from '@dungeonmaster/config';
import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts';

import { SiegelenseProfileLayerFlow } from './siegelense-profile-layer-flow';

describe('SiegelenseProfileLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-profile-layer-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  const originalCwd = process.cwd();
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  beforeAll(() => {
    // laneSpecFindBroker resolves devServer.e2e.processes off a real .dungeonmaster.json — this
    // repo's own file is being rewritten by other work, so the testbed gets its own, isolated
    // under the OS tmp dir. Neither configured process is ever spawned: profile is a read, never a
    // boot.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      content: FileContentStub({
        value: JSON.stringify(
          DungeonmasterConfigStub({
            framework: 'monorepo',
            devServer: {
              devCommand: 'npm run dev',
              port: configDefaultsStatics.devServer.port.default,
              e2e: {
                processes: [
                  DevServerE2eProcessStub(),
                  DevServerE2eProcessStub({ name: 'web', portRole: 'web', readyPath: '/' }),
                ],
              },
            },
          }),
        ),
      }),
    });
    process.chdir(testbed.guildPath);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  describe('the default human summary, a never-measured spec', () => {
    it('VALID: {callArgs: [--spec, api]} => renders the human SpecProfile summary, no samples recorded', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'api'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(wholeOutput).toMatch(
        /^SPEC: api\nPROCESSES: 2\nHASH: [0-9a-f]{64}\nMEASURED: never \(boot: -, runs: 0\)\nSAMPLES: none measured yet\n$/u,
      );
    });
  });

  describe('the --json branch, a never-measured spec', () => {
    it('VALID: {callArgs: [--spec, api, --json]} => samples: [] and bootMs: null, having booted no instance to find out', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'api', '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        specName: 'api',
        processes: 2,
        hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('the other lane name, stack', () => {
    it('VALID: {callArgs: [--spec, stack, --json]} => PROCESSES reflects api + web + browser, three, never the headless count', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'stack', '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        specName: 'stack',
        processes: 3,
        hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('a badly shaped --spec value', () => {
    it("INVALID: {callArgs: [--spec, '']} => refuses naming --spec and specNameContract's own message", async () => {
      await expect(SiegelenseProfileLayerFlow({ callArgs: ['--spec', ''] })).rejects.toThrow(
        /^--spec: String must contain at least 1 character\(s\)$/u,
      );
    });
  });

  describe('the refusal when --spec is absent', () => {
    it('INVALID: {callArgs: []} => rejects naming --spec rather than profiling every spec it can find', async () => {
      await expect(SiegelenseProfileLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--spec is required: name the lane spec to profile\. A profile is keyed by one spec's content hash, so there is no fleet-wide form\.\n\nUsage: dungeonmaster siegelense profile --spec <specName> \[--json\]$/u,
      );
    });
  });

  describe('the refusal when --spec names no lane', () => {
    it('INVALID: {callArgs: [--spec, no-such-spec]} => reaches the real laneSpecFindBroker check and lists the known specs', async () => {
      await expect(
        SiegelenseProfileLayerFlow({ callArgs: ['--spec', 'no-such-spec'] }),
      ).rejects.toThrow(/^Unknown lane spec "no-such-spec"\. Known specs: stack, api$/u);
    });
  });
});
