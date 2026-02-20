import { TempSessionItemStub } from './temp-session-item.stub';
import { tempSessionItemContract } from './temp-session-item-contract';

describe('tempSessionItemContract', () => {
  describe('valid temp session items', () => {
    it('VALID: minimal temp session item => parses successfully', () => {
      const item = TempSessionItemStub();

      const result = tempSessionItemContract.parse(item);

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        title: 'Fix auth bug',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: temp session item without title => parses successfully', () => {
      const result = tempSessionItemContract.parse({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        startedAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid temp session items', () => {
    it('INVALID: missing sessionId => throws validation error', () => {
      expect(() => {
        tempSessionItemContract.parse({
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: missing startedAt => throws validation error', () => {
      expect(() => {
        tempSessionItemContract.parse({
          sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid startedAt => throws validation error', () => {
      expect(() => {
        tempSessionItemContract.parse({
          sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          startedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
