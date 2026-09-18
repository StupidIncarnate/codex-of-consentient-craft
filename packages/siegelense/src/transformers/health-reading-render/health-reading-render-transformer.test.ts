import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { HealthReadingStub } from '../../contracts/health-reading/health-reading.stub';
import { HealthVerdictStub } from '../../contracts/health-verdict/health-verdict.stub';
import { HexColourStub } from '../../contracts/hex-colour/hex-colour.stub';
import { ReadingCountStub } from '../../contracts/reading-count/reading-count.stub';
import { healthReadingRenderTransformer } from './health-reading-render-transformer';

describe('healthReadingRenderTransformer', () => {
  it('VALID: {healthy state} => returns HEALTHY verdict and clean readings', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'HEALTHY' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {console error} => returns DEGRADED verdict and console error message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 1 }),
      firstConsoleError: ContentTextStub({ value: 'TypeError: null has no properties' }),
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 1 }),
        firstConsoleError: ContentTextStub({ value: 'TypeError: null has no properties' }),
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console: 1 error "TypeError: null has no properties" · no 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {multiple console errors, no first message} => formats error count plural without message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 3 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 3 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console: 3 errors · no 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {network 5xx} => returns DEGRADED verdict and first 5xx message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 1 }),
      first5xx: ContentTextStub({ value: 'GET /api/session' }),
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 1 }),
        first5xx: ContentTextStub({ value: 'GET /api/session' }),
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console clean · network: 1 5xx "GET /api/session" · server log clean',
        }),
      }),
    );
  });

  it('VALID: {multiple network 5xx, no first message} => formats count without message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 2 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 2 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console clean · network: 2 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {one server error} => returns DEGRADED verdict and server error count singular', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 1 }),
      firstServerError: ContentTextStub({ value: 'fatal exception' }),
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 1 }),
        firstServerError: ContentTextStub({ value: 'fatal exception' }),
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console clean · no 5xx · server log: 1 error',
        }),
      }),
    );
  });

  it('VALID: {multiple server errors} => returns DEGRADED verdict and server error count plural', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 2 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DEGRADED' }),
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 2 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DEGRADED  root present · not blank · console clean · no 5xx · server log: 2 errors',
        }),
      }),
    );
  });

  it('VALID: {root absent} => returns DOWN verdict', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: false,
      blank: false,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DOWN' }),
        rootPresent: false,
        blank: false,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value: 'DOWN      root absent · not blank · console clean · no 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {blank page with colour} => returns DOWN verdict and colour', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: true,
      blankColour: HexColourStub({ value: '#0d0907' }),
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DOWN' }),
        rootPresent: true,
        blank: true,
        blankColour: HexColourStub({ value: '#0d0907' }),
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value:
            'DOWN      root present · page blank (#0d0907) · console clean · no 5xx · server log clean',
        }),
      }),
    );
  });

  it('VALID: {blank page without colour} => returns DOWN verdict and plain page blank', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: true,
      blankColour: null,
      consoleErrors: ReadingCountStub({ value: 0 }),
      firstConsoleError: null,
      network5xxCount: ReadingCountStub({ value: 0 }),
      first5xx: null,
      serverErrors: ReadingCountStub({ value: 0 }),
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: HealthVerdictStub({ value: 'DOWN' }),
        rootPresent: true,
        blank: true,
        blankColour: null,
        consoleErrors: ReadingCountStub({ value: 0 }),
        firstConsoleError: null,
        network5xxCount: ReadingCountStub({ value: 0 }),
        first5xx: null,
        serverErrors: ReadingCountStub({ value: 0 }),
        firstServerError: null,
        rendered: ContentTextStub({
          value: 'DOWN      root present · page blank · console clean · no 5xx · server log clean',
        }),
      }),
    );
  });
});
