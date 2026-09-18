import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { HealthVerdictStub } from '../health-verdict/health-verdict.stub';
import { HexColourStub } from '../hex-colour/hex-colour.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
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
        consoleErrors: ReadingCountStub({ value: 1 }),
        firstConsoleError: ContentTextStub({ value: 'Cannot read properties of null' }),
        network5xxCount: ReadingCountStub({ value: 0 }),
        serverErrors: ReadingCountStub({ value: 2 }),
        firstServerError: ContentTextStub({ value: 'Internal server exception' }),
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console: 1 error "Cannot read properties of null" · no 5xx · server log: 2 errors',
        }),
      });

      const result = healthReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });

    it('VALID: {down with blank page and absent root} => parses a down reading', () => {
      const fixture = HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DOWN' }),
        rootPresent: false,
        blank: true,
        blankColour: HexColourStub({ value: '#0d0907' }),
        rendered: ContentTextStub({
          value:
            'DOWN      root absent · page blank (#0d0907) · console clean · no 5xx · server log clean',
        }),
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
        } as never);
      }).toThrow(/Required/u);
    });
  });
});
