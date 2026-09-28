import { riftcarverResultContract } from './riftcarver-result-contract';
import { RiftcarverResultStub } from './riftcarver-result.stub';

describe('riftcarverResultContract', () => {
  describe('valid riftcarver results', () => {
    it('VALID: minimal riftcarver result => parses successfully', () => {
      const result = RiftcarverResultStub();

      const parsed = riftcarverResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 0,
        outcome: 'green',
      });
    });

    it('VALID: riftcarver result with all fields => parses successfully', () => {
      const result = RiftcarverResultStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        exitCode: 1,
        failedStep: 'typecheck',
        outcome: 'repairable',
      });

      const parsed = riftcarverResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 1,
        failedStep: 'typecheck',
        outcome: 'repairable',
      });
    });

    it('VALID: riftcarver result with outcome blocked => parses successfully', () => {
      const result = RiftcarverResultStub({
        exitCode: 128,
        failedStep: 'create',
        outcome: 'blocked',
      });

      const parsed = riftcarverResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 128,
        failedStep: 'create',
        outcome: 'blocked',
      });
    });

    it('VALID: riftcarver result with node_modules failedStep => parses successfully', () => {
      const result = RiftcarverResultStub({
        exitCode: 1,
        failedStep: 'node_modules',
        outcome: 'repairable',
      });

      const parsed = riftcarverResultContract.parse(result);

      expect(parsed).toStrictEqual({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        createdAt: '2024-01-15T10:00:00.000Z',
        exitCode: 1,
        failedStep: 'node_modules',
        outcome: 'repairable',
      });
    });
  });

  describe('invalid riftcarver results', () => {
    it('INVALID: missing id => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
          outcome: 'green',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: non-uuid id => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'not-a-uuid',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
          outcome: 'green',
        });
      }).toThrow(/Invalid UUID/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: 'not-a-timestamp',
          exitCode: 0,
          outcome: 'green',
        });
      }).toThrow(/Invalid ISO datetime/u);
    });

    it('INVALID: missing createdAt => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          exitCode: 0,
          outcome: 'green',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: missing exitCode => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          outcome: 'green',
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: non-integer exitCode => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 1.5,
          outcome: 'green',
        });
      }).toThrow(/expected int/u);
    });

    it('INVALID: string exitCode => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 'not-a-number',
          outcome: 'green',
        });
      }).toThrow(/expected number/u);
    });

    it('INVALID: missing outcome => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: unknown outcome => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
          outcome: 'failed',
        });
      }).toThrow(/Invalid option/u);
    });

    it('EMPTY: empty failedStep => throws validation error', () => {
      expect(() => {
        riftcarverResultContract.parse({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 1,
          failedStep: '',
          outcome: 'repairable',
        });
      }).toThrow(/>=1 characters/u);
    });
  });
});
