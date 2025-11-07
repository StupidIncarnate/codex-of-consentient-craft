**FOLDER STRUCTURE:**

```
middleware/
  http-telemetry/
    http-telemetry-middleware.ts
    http-telemetry-middleware.proxy.ts  # Delegates to adapter proxies
    http-telemetry-middleware.test.ts
  error-tracking/
    error-tracking-middleware.ts
    error-tracking-middleware.proxy.ts
    error-tracking-middleware.test.ts
```

**WHAT IS MIDDLEWARE:**

Middleware combines **infrastructure adapters** (NOT business logic):

- ✅ Telemetry (logging + metrics)
- ✅ Observability (tracing + monitoring)
- ✅ Infrastructure concerns (rate limiting + caching)
- ❌ NOT business operations (those are brokers)
- ❌ NOT domain logic (use brokers instead)

**MIDDLEWARE VS BROKERS:**

|              | Middleware                       | Brokers                                                 |
|--------------|----------------------------------|---------------------------------------------------------|
| **Purpose**  | Infrastructure                   | Business logic                                          |
| **Combines** | 2+ infrastructure adapters       | Adapters, guards, transformers                          |
| **Examples** | Logging + metrics                | User creation, order processing                         |
| **Imports**  | adapters/, middleware/, statics/ | brokers/, adapters/, contracts/, guards/, transformers/ |

**PATTERN:**

Middleware = Compose 2+ infrastructure adapters for cross-cutting concerns

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Combines logging and metrics collection for HTTP requests
 *
 * USAGE:
 * await httpTelemetryMiddleware({method: 'GET', url: '/api/users', statusCode: 200, duration: 45});
 * // Logs request and increments Prometheus counter
 */
// middleware/http-telemetry/http-telemetry-middleware.ts
import {winstonLogAdapter} from '../../adapters/winston/log/winston-log-adapter';
import {
    prometheusIncrementCounterAdapter
} from '../../adapters/prometheus/increment-counter/prometheus-increment-counter-adapter';
import type {HttpMethod} from '../../contracts/http-method/http-method-contract';
import type {Url} from '../../contracts/url/url-contract';
import type {StatusCode} from '../../contracts/status-code/status-code-contract';
import type {Milliseconds} from '../../contracts/milliseconds/milliseconds-contract';

export const httpTelemetryMiddleware = async ({
                                                  method,
                                                  url,
                                                  statusCode,
                                                  duration
                                              }: {
    method: HttpMethod;
    url: Url;
    statusCode: StatusCode;
    duration: Milliseconds;
}): Promise<void> => {
    // Log the request
    await winstonLogAdapter({
        level: 'info',
        message: `${method} ${url} - ${statusCode} (${duration}ms)`
    });

    // Track metrics
    await prometheusIncrementCounterAdapter({
        name: 'http_requests_total',
        labels: {method, status: String(statusCode)}
    });
};

/**
 * PURPOSE: Combines error logging to Sentry and Winston for comprehensive error tracking
 *
 * USAGE:
 * await errorTrackingMiddleware({error: new Error('Something broke'), context: {userId: '123'}});
 * // Logs error to both Sentry and Winston with context
 */
// middleware/error-tracking/error-tracking-middleware.ts
import {sentryLogErrorAdapter} from '../../adapters/sentry/log-error/sentry-log-error-adapter';
import {winstonLogAdapter} from '../../adapters/winston/log/winston-log-adapter';

export const errorTrackingMiddleware = async ({
                                                  error,
                                                  context
                                              }: {
    error: Error;
    context?: Record<string, unknown>;
}): Promise<void> => {
    // Log to Sentry
    await sentryLogErrorAdapter({error, context});

    // Log to Winston
    await winstonLogAdapter({
        level: 'error',
        message: error.message,
        metadata: {stack: error.stack, ...context}
    });
};
```

**PROXY PATTERN:**

Middleware proxies delegate to adapter proxies. Middleware code runs REAL.

```typescript
// middleware/http-telemetry/http-telemetry-middleware.proxy.ts
import {winstonLogAdapterProxy} from '../../adapters/winston/log/winston-log-adapter.proxy';
import {
    prometheusIncrementCounterAdapterProxy
} from '../../adapters/prometheus/increment-counter/prometheus-increment-counter-adapter.proxy';

export const httpTelemetryMiddlewareProxy = () => {
    // Delegate to adapter proxies
    const logProxy = winstonLogAdapterProxy();
    const metricsProxy = prometheusIncrementCounterAdapterProxy();

    // NO jest.mocked(middleware) - middleware runs real!

    return {
        // Semantic setup delegates to both adapters
        setupSuccess: () => {
            logProxy.setupLogSuccess();
            metricsProxy.setupIncrementSuccess();
        },

        setupLogFailure: () => {
            logProxy.setupLogFailure();
            metricsProxy.setupIncrementSuccess(); // Metrics still work
        },

        verifyLogged: ({message}: { message: string }) => {
            logProxy.verifyLogged({message});
        },

        verifyMetricsIncremented: ({counterName}: { counterName: string }) => {
            metricsProxy.verifyIncremented({counterName});
        }
    };
};
```

**Key principles:**

- Delegate to adapter proxies (which mock npm packages)
- Middleware runs REAL - tests verify infrastructure composition
- Proxy methods describe infrastructure scenarios
- Middleware coordinates multiple infrastructure concerns

**TEST EXAMPLE:**

```typescript
// middleware/http-telemetry/http-telemetry-middleware.test.ts
import {httpTelemetryMiddleware} from './http-telemetry-middleware';
import {httpTelemetryMiddlewareProxy} from './http-telemetry-middleware.proxy';
import {HttpMethodStub} from '../../contracts/http-method/http-method.stub';
import {UrlStub} from '../../contracts/url/url.stub';
import {StatusCodeStub} from '../../contracts/status-code/status-code.stub';
import {MillisecondsStub} from '../../contracts/milliseconds/milliseconds.stub';

type HttpMethod = ReturnType<typeof HttpMethodStub>;
type Url = ReturnType<typeof UrlStub>;
type StatusCode = ReturnType<typeof StatusCodeStub>;
type Milliseconds = ReturnType<typeof MillisecondsStub>;

describe('httpTelemetryMiddleware', () => {
  describe('successful logging and metrics', () => {
    it('VALID: {GET request} => logs and increments counter', async () => {
      const proxy = httpTelemetryMiddlewareProxy();
      const method = HttpMethodStub({value: 'GET'});
      const url = UrlStub({value: '/api/users'});
      const statusCode = StatusCodeStub({value: 200});
      const duration = MillisecondsStub({value: 45});

      proxy.setupSuccess();

      await httpTelemetryMiddleware({method, url, statusCode, duration});

      proxy.verifyLogged({message: 'GET /api/users - 200 (45ms)'});
      proxy.verifyMetricsIncremented({counterName: 'http_requests_total'});
    });

    it('VALID: {POST request with 201} => logs and increments counter', async () => {
      const proxy = httpTelemetryMiddlewareProxy();
      const method = HttpMethodStub({value: 'POST'});
      const url = UrlStub({value: '/api/users'});
      const statusCode = StatusCodeStub({value: 201});
      const duration = MillisecondsStub({value: 120});

      proxy.setupSuccess();

      await httpTelemetryMiddleware({method, url, statusCode, duration});

      proxy.verifyLogged({message: 'POST /api/users - 201 (120ms)'});
      proxy.verifyMetricsIncremented({counterName: 'http_requests_total'});
    });
  });

  describe('partial failures', () => {
    it('ERROR: {log fails but metrics succeed} => metrics still recorded', async () => {
      const proxy = httpTelemetryMiddlewareProxy();
      const method = HttpMethodStub({value: 'GET'});
      const url = UrlStub({value: '/api/users'});
      const statusCode = StatusCodeStub({value: 500});
      const duration = MillisecondsStub({value: 200});

      proxy.setupLogFailure();

      await httpTelemetryMiddleware({method, url, statusCode, duration});

      proxy.verifyMetricsIncremented({counterName: 'http_requests_total'});
    });
  });
});
```
