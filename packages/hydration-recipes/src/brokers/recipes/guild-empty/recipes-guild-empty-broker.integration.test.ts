import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildEmptyBroker } from './recipes-guild-empty-broker';

type Guild = ReturnType<typeof GuildStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });

describe('recipesGuildEmptyBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildEmptyBroker.recipeName,
        description: recipesGuildEmptyBroker.description,
        inputs: recipesGuildEmptyBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-empty',
        description: 'one empty guild with no quests or sessions, ready for initial configuration',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves exactly guild', async () => {
      const result = await run(recipesGuildEmptyBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual(['guild']);
    });

    it('VALID: {} => the guild record carries the derived name and a real url slug', async () => {
      const result = await run(recipesGuildEmptyBroker(), fileTarget.target());
      const guild = (result as Record<PropertyKey, unknown>)[GUILD_NAME] as Guild;

      expect({ name: guild.name, urlSlug: guild.urlSlug }).toStrictEqual({
        name: 'Guild 1',
        urlSlug: 'guild-1',
      });
    });
  });
});
