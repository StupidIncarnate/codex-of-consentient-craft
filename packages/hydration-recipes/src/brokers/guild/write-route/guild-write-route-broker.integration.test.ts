import { guildWriteRouteBroker } from './guild-write-route-broker';
import { guildQueryRouteBroker } from '../query-route/guild-query-route-broker';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

// Real disk, real `guildAddBroker`, real `guildListBroker` — nothing mocked.
// `guild-write-route-broker.test.ts` beside this one asserts which paths the route hands to
// `fsMkdirAdapter`; it cannot prove what that does to a real filesystem. `valid` on a
// `GuildListItem` IS `fs.access` against the registered path, so it is the observation that
// settles whether a directory was created — and, for a path outside the target, that none was.
describe('guild write route — every directory it creates lands inside the target (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {relative path} => registers the guild at the target-anchored path, and that directory exists', async () => {
    const target = fileTarget.target();

    const guild = await guildWriteRouteBroker({
      target,
      fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
    });

    expect(guild.path).toBe(`${target.home}/guilds-under-test/guild-1`);
    await expect(guildQueryRouteBroker({ target, where: {} })).resolves.toStrictEqual([
      {
        id: guild.id,
        name: 'Guild 1',
        path: `${target.home}/guilds-under-test/guild-1`,
        urlSlug: 'guild-1',
        createdAt: guild.createdAt,
        valid: true,
        questCount: 0,
      },
    ]);
  });

  // A SIBLING of the real temp target whose name merely begins with it. This is the case any
  // containment test written as `startsWith(target.home)` waves through.
  it('VALID: {path in a sibling directory named after the target} => registers it, and nothing exists there', async () => {
    const target = fileTarget.target();

    const guild = await guildWriteRouteBroker({
      target,
      fields: { name: 'Sibling', path: `${target.home}-sibling-probe/guild-1` },
    });

    expect(guild.path).toBe(`${target.home}-sibling-probe/guild-1`);
    await expect(guildQueryRouteBroker({ target, where: {} })).resolves.toStrictEqual([
      {
        id: guild.id,
        name: 'Sibling',
        path: `${target.home}-sibling-probe/guild-1`,
        urlSlug: 'sibling',
        createdAt: guild.createdAt,
        valid: false,
        questCount: 0,
      },
    ]);
  });

  it('VALID: {relative path escaping the target} => registers the escaped path, and nothing exists there', async () => {
    const target = fileTarget.target();

    const guild = await guildWriteRouteBroker({
      target,
      fields: { name: 'Escaped', path: '../recipes-guild-write-escape-probe' },
    });

    expect(guild.path).toBe(`${target.home}/../recipes-guild-write-escape-probe`);
    await expect(guildQueryRouteBroker({ target, where: {} })).resolves.toStrictEqual([
      {
        id: guild.id,
        name: 'Escaped',
        path: `${target.home}/../recipes-guild-write-escape-probe`,
        urlSlug: 'escaped',
        createdAt: guild.createdAt,
        valid: false,
        questCount: 0,
      },
    ]);
  });
});
