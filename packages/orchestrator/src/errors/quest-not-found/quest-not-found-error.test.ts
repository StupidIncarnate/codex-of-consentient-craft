import { QuestNotFoundError } from './quest-not-found-error';

describe('QuestNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {questId: "add-auth"} => sets name and quoted-id message', () => {
      const error = new QuestNotFoundError({ questId: 'add-auth' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestNotFoundError',
        message: 'Quest with id "add-auth" not found in any guild',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuestNotFoundError);
    });

    it('VALID: {questId: uuid string} => embeds the uuid in the message', () => {
      const error = new QuestNotFoundError({
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestNotFoundError',
        message: 'Quest with id "f47ac10b-58cc-4372-a567-0e02b2c3d479" not found in any guild',
      });
    });

    it('EDGE: {questId: ""} => message contains empty quotes', () => {
      const error = new QuestNotFoundError({ questId: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestNotFoundError',
        message: 'Quest with id "" not found in any guild',
      });
    });
  });
});
