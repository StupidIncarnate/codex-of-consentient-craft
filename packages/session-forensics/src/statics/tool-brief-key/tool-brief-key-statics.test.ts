import { toolBriefKeyStatics } from './tool-brief-key-statics';

describe('toolBriefKeyStatics', () => {
  describe('full value', () => {
    it('VALID: {} => carries every interesting key in priority order', () => {
      expect(toolBriefKeyStatics).toStrictEqual({
        interestingKeys: [
          'file_path',
          'path',
          'command',
          'pattern',
          'glob',
          'grep',
          'url',
          'description',
          'prompt',
          'subagent_type',
          'old_string',
          'query',
          'agent',
          'questId',
          'workItemId',
          'notes',
          'packages',
          'packageName',
        ],
      });
    });
  });
});
