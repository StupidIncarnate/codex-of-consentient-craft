
import { HealthVerdictStub } from '../health-verdict/health-verdict.stub';
import { healthReadingContract } from './health-reading-contract';
import { HealthReadingStub } from './health-reading.stub';

describe('healthReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {healthy} => parses the default healthy reading', () => {
      const fixture = HealthReadingStub();

      const result = healthReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });

    it('VALID: {degraded with errors} => parses a degraded reading with console and server errors', () => {
      const fixture = HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        consoleErrors: 1,
        firstConsoleError: 'Cannot read properties of null',
        network5xxCount: 0,
        serverErrors: 2,
        firstServerError: 'Internal server exception',
        rendered: 'DEGRADED  root present · not blank · console: 1 error "Cannot read properties of null" · no 5xx · server log: 2 errors',
      });

      const result = healthReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });

    it('VALID: {down with blank page and absent root} => parses a down reading', () => {
      const fixture = HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DOWN' }),
        rootPresent: false,
        blank: true,
        blankColour: '#0d0907',
        rendered: 'DOWN      root absent · page blank (#0d0907) · console clean · no 5xx · server log clean',
      });

      const result = healthReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing verdict} => throws validation error', () => {
      expect(() => {
        healthReadingContract.parse({
          rootPresent: true,
          blank: false,
        });
      }).toThrow(/received undefined/u);
    });
  });
});
