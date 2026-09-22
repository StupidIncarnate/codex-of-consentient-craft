import { questWriteRouteBroker } from './quest-write-route-broker';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

// Real disk, real `questPersistDirectBroker` — nothing mocked.
// `quest-write-route-broker.test.ts` beside this one asserts the exact path list the route hands
// to the fs adapters; it cannot prove a file arrived. `readQuestByTitle` reads only what is under
// the harness's own temp directory, so a quest it finds is a quest that landed INSIDE the target,
// and a quest it cannot find is one that landed nowhere the target can see.
describe('quest write route — every path it writes lands inside the target (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {title, guildId} => the quest file is readable back from inside the target', async () => {
    const target = fileTarget.target();
    const fields = QuestFieldsStub({ guildId: GUILD_ID, title: 'Seeded Inside' });

    const quest = await questWriteRouteBroker({ target, fields });

    expect(fileTarget.readQuestByTitle({ title: fields.title }).id).toBe(quest.id);
    expect(
      fileTarget.questFolderExists({ guildId: fields.guildId, questFolder: quest.folder }),
    ).toBe(true);
  });

  // A SIBLING of the real temp target whose name merely begins with it. This is the case any
  // containment test written as `startsWith(target.home)` waves through.
  it('INVALID: {folder in a sibling directory named after the target} => refuses, and writes nothing the target can see', async () => {
    const target = fileTarget.target();
    const fields = QuestFieldsStub({ guildId: GUILD_ID, title: 'Seeded Beside' });

    await expect(
      questWriteRouteBroker({
        target,
        fields: { ...fields, folder: `${target.home}-sibling-probe` },
      }),
    ).rejects.toThrow(
      new RegExp(
        `^questWriteRouteBroker: folder "${target.home}-sibling-probe" resolves to "${target.home}-sibling-probe", outside the target home "${target.home}"$`,
        'u',
      ),
    );

    expect(() => fileTarget.readQuestByTitle({ title: fields.title })).toThrow(
      /^fileTargetHarness: no quest found with title "Seeded Beside"$/u,
    );
  });

  it('INVALID: {folder escaping the target} => refuses naming the target home, and writes nothing the target can see', async () => {
    const target = fileTarget.target();
    const fields = QuestFieldsStub({ guildId: GUILD_ID, title: 'Seeded Outside' });

    await expect(
      questWriteRouteBroker({
        target,
        fields: { ...fields, folder: '../../../../recipes-quest-write-escape-probe' },
      }),
    ).rejects.toThrow(
      new RegExp(
        `^questWriteRouteBroker: folder "\\.\\./\\.\\./\\.\\./\\.\\./recipes-quest-write-escape-probe" resolves to ".+/recipes-quest-write-escape-probe", outside the target home "${target.home}"$`,
        'u',
      ),
    );

    expect(() => fileTarget.readQuestByTitle({ title: fields.title })).toThrow(
      /^fileTargetHarness: no quest found with title "Seeded Outside"$/u,
    );
  });
});
