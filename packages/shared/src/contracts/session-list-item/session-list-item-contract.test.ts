import { sessionListItemContract } from './session-list-item-contract';
import { SessionListItemStub } from './session-list-item.stub';

describe('sessionListItemContract', () => {
  describe('valid session list items', () => {
    it('VALID: minimal session list item => parses successfully', () => {
      const item = SessionListItemStub();

      const result = sessionListItemContract.parse(item);

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        startedAt: '2024-01-15T10:00:00.000Z',
        active: false,
        agentRole: 'chaoswhisperer',
      });
    });

    it('VALID: active session with all fields => parses successfully', () => {
      const item = SessionListItemStub({
        active: true,
        summary: 'Help me build auth',
        endedAt: '2024-01-15T12:00:00.000Z',
        questId: 'add-auth',
        questTitle: 'Add Authentication',
        questStatus: 'in_progress',
      });

      const result = sessionListItemContract.parse(item);

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        startedAt: '2024-01-15T10:00:00.000Z',
        endedAt: '2024-01-15T12:00:00.000Z',
        active: true,
        agentRole: 'chaoswhisperer',
        summary: 'Help me build auth',
        questId: 'add-auth',
        questTitle: 'Add Authentication',
        questStatus: 'in_progress',
      });
    });

    it('VALID: guild-level session without quest fields => parses successfully', () => {
      const item = SessionListItemStub({
        sessionId: 'guild-session-001',
        agentRole: 'PathSeeker',
      });

      const result = sessionListItemContract.parse(item);

      expect(result).toStrictEqual({
        sessionId: 'guild-session-001',
        startedAt: '2024-01-15T10:00:00.000Z',
        active: false,
        agentRole: 'PathSeeker',
      });
    });
  });

  describe('invalid session list items', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        sessionListItemContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: empty sessionId => throws validation error', () => {
      const base = SessionListItemStub();

      expect(() => {
        sessionListItemContract.parse({
          ...base,
          sessionId: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: invalid startedAt => throws validation error', () => {
      const base = SessionListItemStub();

      expect(() => {
        sessionListItemContract.parse({
          ...base,
          startedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: invalid endedAt => throws validation error', () => {
      const base = SessionListItemStub();

      expect(() => {
        sessionListItemContract.parse({
          ...base,
          endedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: empty questId => throws validation error', () => {
      const base = SessionListItemStub();

      expect(() => {
        sessionListItemContract.parse({
          ...base,
          questId: '',
        });
      }).toThrow(/too_small/u);
    });
  });
});
