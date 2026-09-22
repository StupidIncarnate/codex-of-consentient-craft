/**
 * PURPOSE: Drives `SiegelenseCapacityLayerFlow` through its real argv surface — `--spec` (required),
 * `--pool` (optional), `--json` — against a real `installTestbedCreateBroker` evidence tree, matching
 * how `profile`'s own suite in `siegelense-flow.integration.test.ts` proves its unknown-spec refusal
 * real rather than mocked. `capacityReadBroker` reaches `profileReadBroker` third, after a real
 * `registryReadBroker`/`machineReadBroker` read, so the `siegelense/.keep` directory this suite seeds
 * up front is what lets a REAL statfs succeed before the spec check runs. Host figures
 * (`freeMemMB`/`cores`/`loadAvg1`/`diskFreeMB`) are live reads with no fixed value; each assertion
 * strips or normalises exactly that figure before comparing the remainder verbatim, the same technique
 * `siegelense-flow.integration.test.ts` uses for `status --json`'s live `machine` block.
 *
 * USAGE:
 * await SiegelenseCapacityLayerFlow({ callArgs: ['--spec', 'dungeonmaster-api'] });
 * // Writes the human CapacityAnswer summary for a spec nothing has ever run
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { SiegelenseCapacityLayerFlow } from './siegelense-capacity-layer-flow';

const FREE_RAM_PATTERN = /free RAM \d+MB less/u;
const FREE_RAM_PLACEHOLDER = 'free RAM <freeMemMB>MB less';
const MEASURED_BLOCK_PATTERN = / {2}"measured": \{[\s\S]*?\n {2}\},\n/u;
const HOST_LINE_PATTERN = /^HOST: .*\n/mu;

describe('SiegelenseCapacityLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-capacity-layer-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  beforeAll(() => {
    // machineReadBroker statfs's the dungeonmaster home directly (never the siegelense
    // subdirectory), but `dungeonmaster init` mkdir -p's `siegelense/` at install time, and
    // capacityReadBroker reads registry/machine before profile — recreate that precondition so the
    // real reads this suite drives succeed before the spec check even runs.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'siegelense/.keep' }),
      content: FileContentStub({ value: '' }),
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

  describe('the default human summary, --pool omitted', () => {
    it('VALID: {callArgs: [--spec, dungeonmaster-api]} => renders the default-pair answer, the policy ceiling assumed for the never-measured spec', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseCapacityLayerFlow({
        callArgs: ['--spec', 'dungeonmaster-api'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const normalized = wholeOutput!
        .replace(HOST_LINE_PATTERN, '')
        .replace(FREE_RAM_PATTERN, FREE_RAM_PLACEHOLDER);

      expect(result).toStrictEqual({ success: true });
      expect(normalized).toBe(
        'SUGGESTED: 2 instances (ceiling: 3)\n' +
          'SPEC: dungeonmaster-api\n' +
          'WHY: no measured profile for dungeonmaster-api, so the default pair of 2 profiles itself; ' +
          'free RAM <freeMemMB>MB less 512MB headroom; nothing else up\n' +
          'PROFILE: no profile samples recorded\n',
      );
    });
  });

  describe('--pool present, the --json branch', () => {
    it('VALID: {callArgs: [--spec, dungeonmaster-stack, --pool, 2, --json]} => writes the CapacityAnswer as one JSON document, still the default pair for the never-measured spec', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseCapacityLayerFlow({
        callArgs: ['--spec', 'dungeonmaster-stack', '--pool', '2', '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const normalized = wholeOutput!
        .replace(MEASURED_BLOCK_PATTERN, '')
        .replace(FREE_RAM_PATTERN, FREE_RAM_PLACEHOLDER);

      expect(result).toStrictEqual({ success: true });
      expect(normalized).toBe(
        '{\n' +
          '  "suggested": 2,\n' +
          '  "ceiling": 3,\n' +
          '  "why": "no measured profile for dungeonmaster-stack, so the default pair of 2 profiles ' +
          'itself; free RAM <freeMemMB>MB less 512MB headroom; nothing else up",\n' +
          '  "profile": null\n' +
          '}\n',
      );
    });
  });

  describe('the refusal when --spec is absent', () => {
    it('INVALID: {callArgs: []} => rejects naming --spec rather than defaulting to a spec', async () => {
      await expect(SiegelenseCapacityLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--spec is required: name the lane spec to calculate capacity against\. Capacity calculation depends on spec footprint\.\n\nUsage: dungeonmaster siegelense capacity --spec <specName> \[--pool <n>\] \[--json\]$/u,
      );
    });
  });

  describe('the refusal when --spec names no lane', () => {
    it('INVALID: {callArgs: [--spec, no-such-spec]} => reaches the real laneSpecFindBroker check and lists the known specs', async () => {
      await expect(
        SiegelenseCapacityLayerFlow({ callArgs: ['--spec', 'no-such-spec'] }),
      ).rejects.toThrow(
        /^Unknown lane spec "no-such-spec"\. Known specs: dungeonmaster-stack, dungeonmaster-api$/u,
      );
    });
  });
});
