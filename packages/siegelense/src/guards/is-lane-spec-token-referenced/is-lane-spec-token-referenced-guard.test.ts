import { isLaneSpecTokenReferencedGuard } from './is-lane-spec-token-referenced-guard';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';
import { LaneProcessStub } from '../../contracts/lane-process/lane-process.stub';

describe('isLaneSpecTokenReferencedGuard', () => {
  describe('the token sits in a process arg', () => {
    it("VALID: {token in one process's args} => returns true", () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            args: ['run', 'dev:no-watch', '--workspace={apiWorkspace}'],
            readyPath: '/api/guilds',
          }),
        ],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' });

      expect(result).toBe(true);
    });
  });

  describe('the token sits in a process readyPath', () => {
    it('VALID: {token in readyPath only} => returns true', () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            args: ['run', 'dev'],
            readyPath: '/{webWorkspace}/health',
          }),
        ],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{webWorkspace}' });

      expect(result).toBe(true);
    });
  });

  describe("the token sits in the spec's own env", () => {
    it('VALID: {token in spec.env only} => returns true', () => {
      const spec = LaneSpecStub({
        env: { DUNGEONMASTER_PORT: '{apiWorkspace}' },
        processes: [LaneProcessStub({ args: ['run', 'dev'], readyPath: '/api/guilds' })],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' });

      expect(result).toBe(true);
    });
  });

  describe('the token sits in a process env', () => {
    it("VALID: {token in one process's env only} => returns true", () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            args: ['run', 'dev'],
            readyPath: '/api/guilds',
            env: { API_PKG_NAME: '{apiWorkspace}' },
          }),
        ],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' });

      expect(result).toBe(true);
    });
  });

  describe('the token appears nowhere in the spec', () => {
    it('INVALID: {spec with neither args nor readyPath carrying the token} => returns false', () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            args: ['run', 'dev:no-watch'],
            readyPath: '/api/guilds',
          }),
        ],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' });

      expect(result).toBe(false);
    });
  });

  describe('a null readyPath', () => {
    it('INVALID: {readyPath: null, token absent from args} => returns false without throwing', () => {
      const spec = LaneSpecStub({
        processes: [LaneProcessStub({ args: ['worker.js'], readyPath: null, portRole: null })],
      });

      const result = isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {spec: undefined} => returns false', () => {
      const result = isLaneSpecTokenReferencedGuard({ token: '{apiWorkspace}' });

      expect(result).toBe(false);
    });

    it('EMPTY: {token: undefined} => returns false', () => {
      const spec = LaneSpecStub();

      const result = isLaneSpecTokenReferencedGuard({ spec });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isLaneSpecTokenReferencedGuard({});

      expect(result).toBe(false);
    });
  });
});
