import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { GuildNameStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from './guild-add-broker';

// Real disk, two real homes. `guild-add-broker.test.ts` beside this one asserts which paths the
// broker hands to fsMkdirAdapter and fsWriteFileAdapter; it cannot prove what a second home on the
// same machine looks like afterwards. Here `setupHome` pins DUNGEONMASTER_HOME at one temp
// directory and the call supplies the OTHER, so reading both directories back is the observation
// that settles whether a supplied home confines the write — and a mutation that drops the home and
// resolves the env var lands every byte in the directory these tests assert is untouched.
describe('guildAddBroker — a supplied home confines every write (integration — real disk)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {home} => registers into the supplied home and leaves the env home empty', async () => {
    const envTestbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'guild-add-env-home' }),
    });
    const targetTestbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'guild-add-target-home' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: envTestbed.guildPath });
    await envHarness.seedHome({ tempDir: targetTestbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Targeted Guild' }),
      path: GuildPathStub({ value: targetTestbed.guildPath }),
      home: targetTestbed.guildPath,
    });

    const registeredInTarget = envHarness.readConfigGuilds({ tempDir: targetTestbed.guildPath });
    const registeredInEnvHome = envHarness.readConfigGuilds({ tempDir: envTestbed.guildPath });
    const questsDirInTarget = envHarness.questsDirExists({
      tempDir: targetTestbed.guildPath,
      guildId: guild.id,
    });
    const questsDirInEnvHome = envHarness.questsDirExists({
      tempDir: envTestbed.guildPath,
      guildId: guild.id,
    });

    restore();
    envTestbed.cleanup();
    targetTestbed.cleanup();

    expect({
      registeredInTarget,
      registeredInEnvHome,
      questsDirInTarget,
      questsDirInEnvHome,
    }).toStrictEqual({
      registeredInTarget: [
        {
          name: 'Targeted Guild',
          path: targetTestbed.guildPath,
          guildId: guild.id,
          urlSlug: guild.urlSlug,
        },
      ],
      registeredInEnvHome: [],
      questsDirInTarget: true,
      questsDirInEnvHome: false,
    });
  });

  it('VALID: {no home} => registers into the env home, leaving the other directory empty', async () => {
    const envTestbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'guild-add-default-env-home' }),
    });
    const otherTestbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'guild-add-default-other-home' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: envTestbed.guildPath });
    await envHarness.seedHome({ tempDir: otherTestbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Default Home Guild' }),
      path: GuildPathStub({ value: otherTestbed.guildPath }),
    });

    const registeredInEnvHome = envHarness.readConfigGuilds({ tempDir: envTestbed.guildPath });
    const questsDirInEnvHome = envHarness.questsDirExists({
      tempDir: envTestbed.guildPath,
      guildId: guild.id,
    });
    const questsDirInOther = envHarness.questsDirExists({
      tempDir: otherTestbed.guildPath,
      guildId: guild.id,
    });

    restore();
    envTestbed.cleanup();
    otherTestbed.cleanup();

    expect({ registeredInEnvHome, questsDirInEnvHome, questsDirInOther }).toStrictEqual({
      registeredInEnvHome: [
        {
          name: 'Default Home Guild',
          path: otherTestbed.guildPath,
          guildId: guild.id,
          urlSlug: guild.urlSlug,
        },
      ],
      questsDirInEnvHome: true,
      questsDirInOther: false,
    });
  });
});
