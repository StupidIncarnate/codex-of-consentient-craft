import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { scanFixtureHarness } from '../../../../test/harnesses/scan-fixture/scan-fixture.harness';
import { ScanConfigStub } from '../../../contracts/scan-config/scan-config.stub';
import { scanRunBroker } from './scan-run-broker';

// The unit tests stage the eslint child, so they cannot prove the `--rule` flag turns on a rule the
// config registers `off`, nor that eslint's JSON survives the real parse. This drives a real eslint
// over a real two-package tree.
describe('scanRunBroker (integration)', () => {
  const harness = scanFixtureHarness();

  it('VALID: {no-debugger registered off in the config, no paths} => reports its three hits in the app package, none for console.log, and a clean lib package', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: 'ward-scan-run',
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({ rule: 'no-debugger' }),
      rootPath: testbed.guildPath,
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
      baseName: 'ward-scan-run-path',
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({
        rule: 'no-debugger',
        paths: ['packages/app/src/b.js'],
      }),
      rootPath: testbed.guildPath,
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
      baseName: 'ward-scan-run-plugin',
    });
    await harness.writeWorkspace({ testbed });

    const result = await scanRunBroker({
      config: ScanConfigStub({ rule: 'fixture/no-forbidden' }),
      rootPath: testbed.guildPath,
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
      baseName: 'ward-scan-run-noplugin',
    });
    await harness.writeWorkspace({ testbed });

    const outcome = await scanRunBroker({
      config: ScanConfigStub({ rule: 'absent/no-such-rule' }),
      rootPath: testbed.guildPath,
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
      baseName: 'ward-scan-run-unknown',
    });
    await harness.writeWorkspace({ testbed });

    const outcome = await scanRunBroker({
      config: ScanConfigStub({ rule: 'no-such-rule-anywhere' }),
      rootPath: testbed.guildPath,
    }).catch((error: unknown) => String(error).split('\n')[0]);

    testbed.cleanup();

    expect(outcome).toBe(
      'Error: Scan of @fixture/app for no-such-rule-anywhere failed (exit 2, signal null): ',
    );
  });
});
