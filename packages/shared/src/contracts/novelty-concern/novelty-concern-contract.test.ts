import { noveltyConcernContract } from './novelty-concern-contract';
import { NoveltyConcernStub } from './novelty-concern.stub';

describe('noveltyConcernContract', () => {
  describe('valid concerns', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const concern = NoveltyConcernStub();

      expect(concern).toStrictEqual({
        area: 'tech',
        description: 'First time wrapping @mantine/notifications.show in this repo',
        recommendsExploratory: true,
      });
    });

    it('VALID: {area: "testing"} => parses testing concern', () => {
      const concern = NoveltyConcernStub({
        area: 'testing',
        description: 'New approach for mocking WebSocket reconnect in widget tests',
        recommendsExploratory: false,
      });

      expect(concern).toStrictEqual({
        area: 'testing',
        description: 'New approach for mocking WebSocket reconnect in widget tests',
        recommendsExploratory: false,
      });
    });

    it('VALID: {area: "pattern"} => parses pattern concern', () => {
      const concern = NoveltyConcernStub({
        area: 'pattern',
        description: 'First broker layered with both adapter and direct fs access',
        recommendsExploratory: true,
      });

      expect(concern).toStrictEqual({
        area: 'pattern',
        description: 'First broker layered with both adapter and direct fs access',
        recommendsExploratory: true,
      });
    });
  });

  describe('invalid concerns', () => {
    it('INVALID: {area: "unknown"} => throws validation error', () => {
      expect(() => {
        return noveltyConcernContract.parse({
          area: 'unknown',
          description: 'desc',
          recommendsExploratory: true,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {description: ""} => throws validation error', () => {
      expect(() => {
        return noveltyConcernContract.parse({
          area: 'tech',
          description: '',
          recommendsExploratory: true,
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {recommendsExploratory missing} => throws validation error', () => {
      expect(() => {
        return noveltyConcernContract.parse({
          area: 'tech',
          description: 'novel',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {recommendsExploratory: "yes"} => throws validation error', () => {
      expect(() => {
        return noveltyConcernContract.parse({
          area: 'tech',
          description: 'novel',
          recommendsExploratory: 'yes',
        });
      }).toThrow(/Expected boolean/u);
    });
  });
});
