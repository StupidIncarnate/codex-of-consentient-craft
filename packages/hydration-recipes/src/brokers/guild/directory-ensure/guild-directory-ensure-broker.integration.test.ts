import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { GuildNameStub } from '@dungeonmaster/shared/contracts/guild-name/guild-name.stub';
import { GuildPathStub } from '@dungeonmaster/shared/contracts/guild-path/guild-path.stub';

import { guildDirectoryEnsureBroker } from './guild-directory-ensure-broker';
import { guildQueryRouteBroker } from '../query-route/guild-query-route-broker';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

// Real disk, no HTTP anywhere: this is the SAME fencing check DEF-72 adds to the `api` route (a
// live siegelense lane always selects `api` over `write` — `routeSelectTransformer` prefers it
// whenever a target carries a `baseUrl`), pulled into its own broker so it is provable without a
// live server. `guildAddBroker` registers the guild for real (the effect a real `POST /api/guilds`
// produces); this broker's own mkdir is the only thing that makes the registered path resolve.
describe('guild directory ensure — the directory it creates lands inside the target (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {path inside the target} => a guild registered at that path reads back valid: true', async () => {
    const target = fileTarget.target();
    const guildPath = GuildPathStub({ value: `${target.home}/guilds-under-test/guild-1` });

    await guildDirectoryEnsureBroker({ target, path: guildPath });
    const registered = await guildAddBroker({
      name: GuildNameStub({ value: 'Guild 1' }),
      path: guildPath,
      home: target.home,
    });

    await expect(guildQueryRouteBroker({ target, where: {} })).resolves.toStrictEqual([
      {
        id: registered.id,
        name: 'Guild 1',
        path: guildPath,
        urlSlug: registered.urlSlug,
        createdAt: registered.createdAt,
        valid: true,
        questCount: 0,
      },
    ]);
  });

  it('VALID: {no mkdir run first} => the same registration reads back valid: false', async () => {
    const target = fileTarget.target();
    const guildPath = GuildPathStub({ value: `${target.home}/guilds-under-test/guild-1` });

    const registered = await guildAddBroker({
      name: GuildNameStub({ value: 'Guild 1' }),
      path: guildPath,
      home: target.home,
    });

    await expect(guildQueryRouteBroker({ target, where: {} })).resolves.toStrictEqual([
      {
        id: registered.id,
        name: 'Guild 1',
        path: guildPath,
        urlSlug: registered.urlSlug,
        createdAt: registered.createdAt,
        valid: false,
        questCount: 0,
      },
    ]);
  });
});
