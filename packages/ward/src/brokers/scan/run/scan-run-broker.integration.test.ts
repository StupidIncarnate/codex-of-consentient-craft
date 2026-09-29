import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { scanFixtureHarness } from '../../../../test/harnesses/scan-fixture/scan-fixture.harness';
import { CliArgStub } from '../../../contracts/cli-arg/cli-arg.stub';
import { ScanConfigStub } from '../../../contracts/scan-config/scan-config.stub';
import { ScanRuleNameStub } from '../../../contracts/scan-rule-name/scan-rule-name.stub';
import { scanRunBroker } from './scan-run-broker';

// The unit tests stage the eslint child, so they cannot prove the `--rule` flag turns on a rule the
// config registers `off`, nor that eslint's JSON survives the real parse. This drives a real eslint
// over a real two-package tree.
describe('scanRunBroker (integration)', () => {
  const harness = scanFixtureHarness();

  it('VALID: {no-debugger registered off in the config, no paths} => reports its three hits in the app package, none for console.log, and a clean lib package', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-scan-run' }),
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({ rule: ScanRuleNameStub({ value: 'no-debugger' }) }),
      rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
    });

    testbed.cleanup();

    expect(result).toStrictEqual({
      rule: 'no-debugger',
      packages: [
        {
          name: '@fixture/app',
          violations: 3,
          batches: [
            [
              {
                file: 'packages/app/src/a.js',
                line: 1,
                message: "Unexpected 'debugger' statement.",
              },
              {
                file: 'packages/app/src/a.js',
                line: 3,
                message: "Unexpected 'debugger' statement.",
              },
              {
                file: 'packages/app/src/b.js',
                line: 2,
                message: "Unexpected 'debugger' statement.",
              },
            ],
          ],
        },
        { name: '@fixture/lib', violations: 0, batches: [] },
      ],
    });
  });

  it('VALID: {a path naming one file} => scans only that file in its package and skips the other package', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-scan-run-path' }),
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({
        rule: ScanRuleNameStub({ value: 'no-debugger' }),
        paths: [CliArgStub({ value: 'packages/app/src/b.js' })],
      }),
      rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
    });

    testbed.cleanup();

    expect(result).toStrictEqual({
      rule: 'no-debugger',
      packages: [
        {
          name: '@fixture/app',
          violations: 1,
          batches: [
            [
              {
                file: 'packages/app/src/b.js',
                line: 2,
                message: "Unexpected 'debugger' statement.",
              },
            ],
          ],
        },
      ],
    });
  });

  it('VALID: {plugin rule registered off for the app package only} => reports the app hits and scans lib without dying on the missing plugin', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-scan-run-plugin' }),
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({ rule: ScanRuleNameStub({ value: 'fixture/no-forbidden' }) }),
      rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
    });

    testbed.cleanup();

    expect(result).toStrictEqual({
      rule: 'fixture/no-forbidden',
      packages: [
        {
          name: '@fixture/app',
          violations: 2,
          batches: [
            [
              { file: 'packages/app/src/d.js', line: 1, message: 'forbidden name' },
              { file: 'packages/app/src/d.js', line: 2, message: 'forbidden name' },
            ],
          ],
        },
        { name: '@fixture/lib', violations: 0, batches: [] },
      ],
    });
  });

  it('ERROR: {a plugin no config object registers} => rejects with the wrapper failure naming the plugin', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-scan-run-noplugin' }),
    });
    await harness.writeWorkspace({ testbed });

    const outcome = await scanRunBroker({
      config: ScanConfigStub({ rule: ScanRuleNameStub({ value: 'absent/no-such-rule' }) }),
      rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
    }).catch((error: unknown) =>
      String(error)
        .replace(testbed.guildPath, '<root>')
        .split('\n')
        .filter((line) => line.startsWith('Error: ')),
    );

    testbed.cleanup();

    expect(outcome).toStrictEqual([
      'Error: Scan of @fixture/app for absent/no-such-rule failed (exit 2, signal null): ',
      'Error: No config object in <root>/eslint.config.js registers plugin "absent" for rule "absent/no-such-rule"',
    ]);
  });

  it('ERROR: {a rule eslint does not know} => rejects with the eslint failure', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-scan-run-unknown' }),
    });
    await harness.writeWorkspace({ testbed });

    const outcome = await scanRunBroker({
      config: ScanConfigStub({ rule: ScanRuleNameStub({ value: 'no-such-rule-anywhere' }) }),
      rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
    }).catch((error: unknown) => String(error).split('\n')[0]);

    testbed.cleanup();

    expect(outcome).toBe(
      'Error: Scan of @fixture/app for no-such-rule-anywhere failed (exit 2, signal null): ',
    );
  });
});
