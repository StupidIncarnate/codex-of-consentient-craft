/**
 * PURPOSE: Drives `SiegelenseCapacityLayerFlow` through its real argv surface — `--spec` (required),
 * `--pool` (optional), `--json` — against a real `installTestbedCreateBroker` evidence tree, matching
 * how `profile`'s own suite in `siegelense-flow.integration.test.ts` proves its unknown-spec refusal
 * real rather than mocked. `capacityReadBroker` reaches `profileReadBroker` third, after a real
 * `registryReadBroker`/`machineReadBroker` read, so the `siegelense/.keep` directory this suite seeds
 * up front is what lets a REAL statfs succeed before the spec check runs, and `profileReadBroker`
 * reaches `laneSpecFindBroker` next — which is why this testbed also carries its own
 * `.dungeonmaster.json`, isolated from this repo's own (another agent rewrites that file
 * concurrently). Host figures (`freeMemMB`/`cores`/`loadAvg1`/`diskFreeMB`) are live reads with no
 * fixed value; each assertion strips or normalises exactly that figure before comparing the
 * remainder verbatim, the same technique `siegelense-flow.integration.test.ts` uses for `status
 * --json`'s live `machine` block. `SUGGESTED`/`"suggested"` and an optional trailing CPU clause are
 * normalised the same way: this suite's own process, and every ward run sharing the host while it
 * executes, is itself CPU load, so `capacitySuggestTransformer`'s CPU term can legitimately throttle
 * the never-measured spec's default pair below 2 on a busy machine — a real result, not a bug, and
 * asserting a fixed `2` here would make the suite flake under exactly the load DEF-41 exists to
 * answer for.
 *
 * USAGE:
 * await SiegelenseCapacityLayerFlow({ callArgs: ['--spec', 'api'] });
 * // Writes the human CapacityAnswer summary for a spec nothing has ever run
 */

import { chdir, cwd, deleteEnv, getEnv, setEnv, stdout } from '#gateway/node/process';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { configDefaultsStatics } from '@dungeonmaster/config';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts/dev-server-e2e-process/dev-server-e2e-process.stub';

import { SiegelenseCapacityLayerFlow } from './siegelense-capacity-layer-flow';

const FREE_RAM_PATTERN = /free RAM \d+MB less/u;
const FREE_RAM_PLACEHOLDER = 'free RAM <freeMemMB>MB less';
const MEASURED_BLOCK_PATTERN = / {2}"measured": \{[\s\S]*?\n {2}\},\n/u;
const HOST_LINE_PATTERN = /^HOST: .*\n/mu;
const SUGGESTED_LINE_PATTERN = /^SUGGESTED: \d+ instances \(ceiling: 3\)$/mu;
const SUGGESTED_LINE_PLACEHOLDER = 'SUGGESTED: <suggested> instances (ceiling: 3)';
const SUGGESTED_JSON_PATTERN = /"suggested": \d+,/u;
const SUGGESTED_JSON_PLACEHOLDER = '"suggested": <suggested>,';
const CPU_CLAUSE_PATTERN =
  /; load [\d.]+ across \d+ cores allows only \d+; CPU, not memory, is the limit/u;

describe('SiegelenseCapacityLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: 'siegelense-capacity-layer-flow',
  });
  const originalHome = getEnv('DUNGEONMASTER_HOME');
  const originalCwd = cwd();

  beforeAll(() => {
    setEnv('DUNGEONMASTER_HOME', testbed.guildPath);

    // machineReadBroker statfs's the dungeonmaster home directly (never the siegelense
    // subdirectory), but `dungeonmaster init` mkdir -p's `siegelense/` at install time, and
    // capacityReadBroker reads registry/machine before profile — recreate that precondition so the
    // real reads this suite drives succeed before the spec check even runs.
    testbed.writeFile({
      relativePath: 'siegelense/.keep',
      content: '',
    });

    // laneSpecFindBroker resolves devServer.e2e.processes off a real .dungeonmaster.json — this
    // repo's own file is being rewritten by other work, so the testbed gets its own, isolated under
    // the OS tmp dir. Two processes (api + web) so 'stack' reflects three against 'api's two, the
    // same shape siegelense-profile-layer-flow.integration.test.ts configures.
    testbed.writeFile({
      relativePath: '.dungeonmaster.json',
      content: JSON.stringify(
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
    });
    chdir(testbed.guildPath);
  });

  afterAll(() => {
    chdir(originalCwd);
    if (originalHome === undefined) {
      deleteEnv('DUNGEONMASTER_HOME');
    } else {
      setEnv('DUNGEONMASTER_HOME', originalHome);
    }
    testbed.cleanup();
  });

  describe('the default human summary, --pool omitted', () => {
    it('VALID: {callArgs: [--spec, api]} => renders the no-profile answer against the real host, the policy ceiling assumed for the never-measured spec', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await expect(
        SiegelenseCapacityLayerFlow({
          callArgs: ['--spec', 'api'],
        }),
      ).resolves.toBe(undefined);

      const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

      const [wholeOutput] = writes;
      const normalized = wholeOutput!
        .replace(HOST_LINE_PATTERN, '')
        .replace(FREE_RAM_PATTERN, FREE_RAM_PLACEHOLDER)
        .replace(SUGGESTED_LINE_PATTERN, SUGGESTED_LINE_PLACEHOLDER)
        .replace(CPU_CLAUSE_PATTERN, '');

      expect(normalized).toBe(
        'SUGGESTED: <suggested> instances (ceiling: 3)\n' +
          'SPEC: api\n' +
          'WHY: no measured profile for api, so this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM <freeMemMB>MB less 512MB headroom; nothing else up\n' +
          'PROFILE: no profile samples recorded\n',
      );
    });
  });

  describe('--pool present, the --json branch', () => {
    it('VALID: {callArgs: [--spec, stack, --pool, 2, --json]} => writes the CapacityAnswer as one JSON document against the real host, --pool ignored for the never-measured spec', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await expect(
        SiegelenseCapacityLayerFlow({
          callArgs: ['--spec', 'stack', '--pool', '2', '--json'],
        }),
      ).resolves.toBe(undefined);

      const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

      const [wholeOutput] = writes;
      const normalized = wholeOutput!
        .replace(MEASURED_BLOCK_PATTERN, '')
        .replace(FREE_RAM_PATTERN, FREE_RAM_PLACEHOLDER)
        .replace(SUGGESTED_JSON_PATTERN, SUGGESTED_JSON_PLACEHOLDER)
        .replace(CPU_CLAUSE_PATTERN, '');

      expect(normalized).toBe(
        '{\n' +
          '  "suggested": <suggested>,\n' +
          '  "ceiling": 3,\n' +
          '  "why": "no measured profile for stack, so --pool 2 has no effect: this suggests ' +
          'the default of 2 instances; run a pool of 2 once and siegelense records a profile ' +
          'for next time; free RAM <freeMemMB>MB less 512MB headroom; nothing else up",\n' +
          '  "profile": null\n' +
          '}\n',
      );
    });
  });

  describe('the refusal when --spec is absent', () => {
    it('INVALID: {callArgs: []} => rejects naming --spec, the known specs, rather than defaulting to a spec', async () => {
      await expect(SiegelenseCapacityLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--spec is required: name the lane spec to calculate capacity against\. Capacity calculation depends on spec footprint\. Known specs: stack, api\.\n\nUsage: dungeonmaster siegelense capacity --spec <specName> \[--pool <n>\] \[--json\]$/u,
      );
    });
  });

  describe('the refusal when --spec names no lane', () => {
    it('INVALID: {callArgs: [--spec, no-such-spec]} => reaches the real laneSpecFindBroker check and lists the known specs', async () => {
      await expect(
        SiegelenseCapacityLayerFlow({ callArgs: ['--spec', 'no-such-spec'] }),
      ).rejects.toThrow(/^Unknown lane spec "no-such-spec"\. Known specs: stack, api$/u);
    });
  });
});
