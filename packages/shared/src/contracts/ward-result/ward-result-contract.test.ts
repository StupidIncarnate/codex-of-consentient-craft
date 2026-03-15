import { wardResultContract } from './ward-result-contract';
import { WardResultStub } from './ward-result.stub';

describe('wardResultContract', () => {
  describe('valid ward results', () => {
    it('VALID: minimal ward result => parses successfully', () => {
      const result = WardResultStub();

      const parsed = wardResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 1,
        filePaths: [],
      });
    });

    it('VALID: ward result with all fields => parses successfully', () => {
      const result = WardResultStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        exitCode: 2,
        filePaths: ['src/brokers/user/user-broker.ts', 'src/guards/auth/auth-guard.ts'],
        errorSummary: 'Type error in user-broker.ts',
        runId: 'ward-run-abc',
      });

      const parsed = wardResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 2,
        filePaths: ['src/brokers/user/user-broker.ts', 'src/guards/auth/auth-guard.ts'],
        errorSummary: 'Type error in user-broker.ts',
        runId: 'ward-run-abc',
      });
    });

    it('VALID: ward result with exitCode 0 => parses successfully', () => {
      const result = WardResultStub({ exitCode: 0 });

      const parsed = wardResultContract.parse(result);

      expect(parsed.exitCode).toBe(0);
    });
  });

  describe('invalid ward results', () => {
    it('INVALID: missing id => throws validation error', () => {
      expect(() => {
        wardResultContract.parse({
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 1,
          filePaths: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: non-uuid id => throws validation error', () => {
      expect(() => {
        wardResultContract.parse({
          id: 'not-a-uuid',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 1,
          filePaths: [],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      expect(() => {
        wardResultContract.parse({
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          createdAt: 'not-a-timestamp',
          exitCode: 1,
          filePaths: [],
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: missing exitCode => throws validation error', () => {
      expect(() => {
        wardResultContract.parse({
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          createdAt: '2024-01-15T10:00:00.000Z',
          filePaths: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
