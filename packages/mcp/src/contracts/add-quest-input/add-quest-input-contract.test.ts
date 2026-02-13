import { addQuestInputContract as _addQuestInputContract } from './add-quest-input-contract';
import { AddQuestInputStub } from './add-quest-input.stub';

describe('addQuestInputContract', () => {
  it('VALID: {title, userRequest, projectId} => parses successfully', () => {
    const result = AddQuestInputStub({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
      projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });

    expect(result).toStrictEqual({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
      projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
  });

  it('VALID: default stub values => parses successfully', () => {
    const result = AddQuestInputStub();

    expect(result).toStrictEqual({
      title: 'Test Quest',
      userRequest: 'User wants to test the quest system',
      projectId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_PROJECT_ID: {projectId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        _addQuestInputContract.parse({
          title: 'Test Quest',
          userRequest: 'User wants to test',
          projectId: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_PROJECT_ID: {projectId: missing} => throws validation error', () => {
      expect(() => {
        _addQuestInputContract.parse({
          title: 'Test Quest',
          userRequest: 'User wants to test',
        });
      }).toThrow(/Required/u);
    });
  });
});
