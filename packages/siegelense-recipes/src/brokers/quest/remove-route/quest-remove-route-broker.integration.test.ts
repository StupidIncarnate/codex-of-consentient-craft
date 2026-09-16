import { questRemoveRouteBroker } from './quest-remove-route-broker';
import { questWriteRouteBroker } from '../write-route/quest-write-route-broker';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

// Real disk, real `questDeleteBroker` — nothing mocked. `quest-remove-route-broker.test.ts`
// beside this one proves the routing and the exact message against a stubbed
// `questOwningGuildFindBroker`/`questDeleteBroker`; it cannot prove the guard actually stops a
// real `fs.rm` from firing. The damage the guard exists to prevent is a deleted directory, so a
// still-standing directory is what this suite proves.
describe('quest remove route — the deletability guard runs before any real delete (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('ERROR: {record.status: "in_progress"} => refuses, and the quest folder still exists on disk afterwards', async () => {
    const target = fileTarget.target();
    const fields = QuestFieldsStub({ guildId: GUILD_ID, status: 'in_progress' });
    const quest = await questWriteRouteBroker({ target, fields });

    await expect(questRemoveRouteBroker({ target, record: quest })).rejects.toThrow(
      new RegExp(
        `^questRemoveRouteBroker: quest "${quest.id}" is "in_progress" and cannot be removed while it is actively executing`,
        'u',
      ),
    );

    expect(
      fileTarget.questFolderExists({ guildId: fields.guildId, questFolder: quest.folder }),
    ).toBe(true);
  });
});
