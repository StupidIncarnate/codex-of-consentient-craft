import { projectListItemContract } from './project-list-item-contract';
import { ProjectListItemStub } from './project-list-item.stub';

describe('projectListItemContract', () => {
  describe('valid list items', () => {
    it('VALID: full list item => parses successfully', () => {
      const item = ProjectListItemStub();

      const result = projectListItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Project',
        path: '/home/user/my-project',
        createdAt: '2024-01-15T10:00:00.000Z',
        valid: true,
        questCount: 0,
      });
    });

    it('VALID: invalid project with quests => parses successfully', () => {
      const item = ProjectListItemStub({
        valid: false,
        questCount: 5,
      });

      const result = projectListItemContract.parse(item);

      expect(result.valid).toBe(false);
      expect(result.questCount).toBe(5);
    });
  });

  describe('invalid list items', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        projectListItemContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: negative questCount => throws validation error', () => {
      const baseItem = ProjectListItemStub();

      expect(() => {
        projectListItemContract.parse({
          ...baseItem,
          questCount: -1,
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: non-integer questCount => throws validation error', () => {
      const baseItem = ProjectListItemStub();

      expect(() => {
        projectListItemContract.parse({
          ...baseItem,
          questCount: 1.5,
        });
      }).toThrow(/Expected integer/u);
    });
  });
});
