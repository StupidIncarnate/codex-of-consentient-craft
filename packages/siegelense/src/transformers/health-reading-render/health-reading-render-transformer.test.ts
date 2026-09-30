
import { HealthReadingStub } from '../../contracts/health-reading/health-reading.stub';
import { healthReadingRenderTransformer } from './health-reading-render-transformer';

describe('healthReadingRenderTransformer', () => {
  it('VALID: {healthy state} => returns HEALTHY verdict and clean readings', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'HEALTHY',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
      }),
    );
  });

  it('VALID: {console error} => returns DEGRADED verdict and console error message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 1,
      firstConsoleError: 'TypeError: null has no properties',
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 1,
        firstConsoleError: 'TypeError: null has no properties',
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DEGRADED  root present · not blank · console: 1 error "TypeError: null has no properties" · no 5xx · server log clean',
      }),
    );
  });

  it('VALID: {multiple console errors, no first message} => formats error count plural without message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 3,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 3,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DEGRADED  root present · not blank · console: 3 errors · no 5xx · server log clean',
      }),
    );
  });

  it('VALID: {network 5xx} => returns DEGRADED verdict and first 5xx message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 1,
      first5xx: 'GET /api/session',
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 1,
        first5xx: 'GET /api/session',
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DEGRADED  root present · not blank · console clean · network: 1 5xx "GET /api/session" · server log clean',
      }),
    );
  });

  it('VALID: {multiple network 5xx, no first message} => formats count without message', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 2,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 2,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DEGRADED  root present · not blank · console clean · network: 2 5xx · server log clean',
      }),
    );
  });

  it('VALID: {one server error} => returns DEGRADED verdict and server error count singular', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 1,
      firstServerError: 'fatal exception',
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 1,
        firstServerError: 'fatal exception',
        rendered: 'DEGRADED  root present · not blank · console clean · no 5xx · server log: 1 error',
      }),
    );
  });

  it('VALID: {multiple server errors} => returns DEGRADED verdict and server error count plural', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 2,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DEGRADED',
        rootPresent: true,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 2,
        firstServerError: null,
        rendered: 'DEGRADED  root present · not blank · console clean · no 5xx · server log: 2 errors',
      }),
    );
  });

  it('VALID: {root absent} => returns DOWN verdict', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: false,
      blank: false,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DOWN',
        rootPresent: false,
        blank: false,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DOWN      root absent · not blank · console clean · no 5xx · server log clean',
      }),
    );
  });

  it('VALID: {blank page with colour} => returns DOWN verdict and colour', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: true,
      blankColour: '#0d0907',
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DOWN',
        rootPresent: true,
        blank: true,
        blankColour: '#0d0907',
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DOWN      root present · page blank (#0d0907) · console clean · no 5xx · server log clean',
      }),
    );
  });

  it('VALID: {blank page without colour} => returns DOWN verdict and plain page blank', () => {
    const reading = healthReadingRenderTransformer({
      rootPresent: true,
      blank: true,
      blankColour: null,
      consoleErrors: 0,
      firstConsoleError: null,
      network5xxCount: 0,
      first5xx: null,
      serverErrors: 0,
      firstServerError: null,
    });

    expect(reading).toStrictEqual(
      HealthReadingStub({
        verdict: 'DOWN',
        rootPresent: true,
        blank: true,
        blankColour: null,
        consoleErrors: 0,
        firstConsoleError: null,
        network5xxCount: 0,
        first5xx: null,
        serverErrors: 0,
        firstServerError: null,
        rendered: 'DOWN      root present · page blank · console clean · no 5xx · server log clean',
      }),
    );
  });
});
