import { pathseekerRunContract } from './pathseeker-run-contract';
import { PathseekerRunStub } from './pathseeker-run.stub';

describe('pathseekerRunContract', () => {
  describe('valid runs', () => {
    it('VALID: minimal run => parses successfully', () => {
      const run = PathseekerRunStub();

      const result = pathseekerRunContract.parse(run);

      expect(result).toStrictEqual({
        attempt: 0,
        startedAt: '2024-01-15T10:00:00.000Z',
        status: 'in_progress',
      });
    });

    it('VALID: completed run with session => parses successfully', () => {
      const run = PathseekerRunStub({
        sessionId: 'session-abc',
        attempt: 1,
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T11:00:00.000Z',
        status: 'complete',
      });

      const result = pathseekerRunContract.parse(run);

      expect(result).toStrictEqual({
        sessionId: 'session-abc',
        attempt: 1,
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T11:00:00.000Z',
        status: 'complete',
      });
    });

    it('VALID: failed run => parses successfully', () => {
      const run = PathseekerRunStub({
        attempt: 2,
        status: 'failed',
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = pathseekerRunContract.parse(run);

      expect(result.status).toBe('failed');
      expect(result.attempt).toBe(2);
    });

    it('VALID: verification_failed run => parses successfully', () => {
      const run = PathseekerRunStub({
        status: 'verification_failed',
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = pathseekerRunContract.parse(run);

      expect(result.status).toBe('verification_failed');
    });
  });

  describe('invalid runs', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        pathseekerRunContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid status => throws validation error', () => {
      expect(() => {
        pathseekerRunContract.parse({
          attempt: 0,
          startedAt: '2024-01-15T10:00:00.000Z',
          status: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      expect(() => {
        pathseekerRunContract.parse({
          attempt: 0,
          startedAt: 'not-a-timestamp',
          status: 'in_progress',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
