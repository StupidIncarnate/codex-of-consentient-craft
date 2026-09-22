/**
 * PURPOSE: Drives `SiegelenseProfileLayerFlow` through `profile`'s whole argv surface — `--spec`
 * (required), `--json` — against a real `installTestbedCreateBroker` evidence tree, no mocks.
 * `flows/` may import neither `brokers/` nor a `.proxy.ts` (`enforce-import-dependencies`,
 * `enforce-test-proxy-imports`), so every case here reaches the real `profileReadBroker` and
 * `laneSpecFindBroker` through the responder. `profileReadBroker` calls `laneSpecFindBroker` before
 * any filesystem read, so the badly-shaped-spec and unknown-spec refusals below need no fixture on
 * disk first — unlike `SiegelenseCapacityLayerFlow`'s own suite, whose `capacityReadBroker` reaches
 * a real `machineReadBroker` statfs before its spec check. Both built-in specs are exercised —
 * `dungeonmaster-api` (browserless, 1 process) and `dungeonmaster-stack` (api + web + browser, 3
 * processes) — so PROCESSES is proven to reflect the real spec rather than a fixed count.
 *
 * USAGE:
 * await SiegelenseProfileLayerFlow({ callArgs: ['--spec', 'dungeonmaster-api'] });
 * // Writes the human SpecProfile summary for a spec nothing has ever run
 */

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { SiegelenseProfileLayerFlow } from './siegelense-profile-layer-flow';

describe('SiegelenseProfileLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-profile-layer-flow' }),
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

  describe('the default human summary, a never-measured spec', () => {
    it('VALID: {callArgs: [--spec, dungeonmaster-api]} => renders the human SpecProfile summary, no samples recorded', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'dungeonmaster-api'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(wholeOutput).toMatch(
        /^SPEC: dungeonmaster-api\nPROCESSES: 1\nHASH: [0-9a-f]{64}\nMEASURED: never \(boot: -, runs: 0\)\nSAMPLES: none measured yet\n$/u,
      );
    });
  });

  describe('the --json branch, a never-measured spec', () => {
    it('VALID: {callArgs: [--spec, dungeonmaster-api, --json]} => samples: [] and bootMs: null, having booted no instance to find out', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'dungeonmaster-api', '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        specName: 'dungeonmaster-api',
        processes: 1,
        hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('the other built-in lane spec, dungeonmaster-stack', () => {
    it('VALID: {callArgs: [--spec, dungeonmaster-stack, --json]} => PROCESSES reflects api + web + browser, three, never the browserless count', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseProfileLayerFlow({
        callArgs: ['--spec', 'dungeonmaster-stack', '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        specName: 'dungeonmaster-stack',
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
      ).rejects.toThrow(
        /^Unknown lane spec "no-such-spec"\. Known specs: dungeonmaster-stack, dungeonmaster-api$/u,
      );
    });
  });
});
