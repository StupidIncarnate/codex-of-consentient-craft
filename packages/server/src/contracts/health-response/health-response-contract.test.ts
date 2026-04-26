import { healthResponseContract } from './health-response-contract';
import { HealthResponseStub } from './health-response.stub';

describe('healthResponseContract', () => {
  describe('valid inputs', () => {
    it('VALID: {status, timestamp} => parses successfully', () => {
      const result = HealthResponseStub({});

      expect(result.status).toBe('ok');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing status} => throws validation error', () => {
      expect(() => {
        healthResponseContract.parse({ timestamp: '2024-01-01T00:00:00Z' });
      }).toThrow(/Required/u);
    });
  });
});
