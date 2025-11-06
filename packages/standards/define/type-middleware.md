# middleware/ - Infrastructure Orchestration

**Purpose:** Combine multiple infrastructure adapters into cohesive bundles

**Folder Structure:**

```
middleware/
  http-telemetry/
    http-telemetry-middleware.ts
    http-telemetry-middleware.proxy.ts  # Delegates to adapter proxies
    http-telemetry-middleware.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-middleware.ts` (e.g., `http-telemetry-middleware.ts`)
- **Export:** camelCase ending with `Middleware` (e.g., `httpTelemetryMiddleware`, `errorTrackingMiddleware`)
- **Proxy:** kebab-case ending with `-middleware.proxy.ts`, export `[name]MiddlewareProxy` (e.g.,
  `httpTelemetryMiddlewareProxy`)
- **Pattern:** middleware/[name]/[name]-middleware.ts

**Constraints:**

- **ONLY** for infrastructure concerns (telemetry, observability, monitoring)
- **NOT** for business logic
- **Pattern:** Combines 2+ infrastructure adapters

**Example:**

```tsx
/**
 * PURPOSE: Combines logging and metrics collection for HTTP requests
 *
 * USAGE:
 * await httpTelemetryMiddleware({method: 'GET', url: '/api/users', statusCode: 200, duration: 45});
 * // Logs request and increments Prometheus counter
 */
// middleware/http-telemetry/http-telemetry-middleware.ts
import {winstonLogAdapter} from '../../adapters/winston/winston-log-adapter';
import {prometheusIncrementCounterAdapter} from '../../adapters/prometheus/prometheus-increment-counter-adapter';

export const httpTelemetryMiddleware = async ({method, url, statusCode, duration}) => {
    await winstonLogAdapter({level: 'info', message: `${method} ${url} - ${statusCode}`});
    await prometheusIncrementCounterAdapter({
        name: 'http_requests_total',
        labels: {method, status: String(statusCode)}
    });
};
```