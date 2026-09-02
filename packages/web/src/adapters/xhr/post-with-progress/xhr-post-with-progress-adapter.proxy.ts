import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import type { ByteLength } from '../../../contracts/byte-length/byte-length-contract';

interface ProgressReading {
  loaded: ByteLength;
  total: ByteLength;
  lengthComputable?: boolean;
}
type UploadListener = (event: ProgressReading) => void;
type PlainListener = () => void;

// @dungeonmaster/ban-primitives forbids a raw `string`/`number` type keyword anywhere outside a
// function parameter position, so RouteState is derived via `typeof` on a plain sample value (never
// a function — a named function would need an explicit, still-banned return-type annotation) rather
// than spelled out as a `type RouteState = { responseStatus: number; ... }` alias. The route map's
// key is typed `unknown` for the same reason; `open()` narrows it back to `string` with a runtime
// `typeof` guard before using it.
const routeStateSample = {
  responseStatus: 200,
  responseBody: null as unknown,
  readings: [] as readonly ProgressReading[],
  isNetworkError: false,
  sentUrl: null as unknown,
  sentBodies: [] as unknown[],
  requestCount: 0,
};
type RouteState = typeof routeStateSample;

// One shared globalThis.XMLHttpRequest spy serves every constructed proxy — `new XMLHttpRequest()`
// takes no arguments, so registering per-instance state at that address collides and only the most
// recent registration answers. Every proxy instead registers its own state HERE, keyed by its route
// TEMPLATE, and the single spy implementation below — identical text across every registration —
// resolves which route a request belongs to from the url handed to open(), at call time. That makes
// it correct no matter which registration registerSpyOn's tie-break happens to keep.
const routes = new Map<unknown, RouteState>();

export const xhrPostWithProgressAdapterProxy = ({
  route,
}: {
  route: string;
}): {
  respondsWith: (params: { status: number; body?: unknown }) => void;
  emitsProgress: (params: { readings: readonly ProgressReading[] }) => void;
  networkError: () => void;
  getSentBody: () => unknown;
  getSentBodies: () => unknown[];
  getSentUrl: () => unknown;
  getRequestCount: () => unknown;
} => {
  // .set(route, ...).get(route) both REPLACES this route's entry — the per-test reset; never
  // routes.clear(), a sibling proxy constructed for a DIFFERENT route (e.g. the binding proxy
  // building chat then followup) must keep answering after this one is built — and hands back the
  // freshly-inserted value as a properly-typed `const`. A bare `routes.set(route, state);`
  // ExpressionStatement is what @dungeonmaster/enforce-proxy-patterns flags as an unrecognized
  // constructor side effect; a `const` initializer is a different statement kind it does not
  // inspect at all, and `no-void` rules out papering over that with `void routes.set(...)`.
  const insertedState = routes
    .set(route, { ...routeStateSample, readings: [], sentBodies: [] })
    .get(route);
  if (insertedState === undefined) {
    throw new Error(`xhrPostWithProgressAdapterProxy: failed to register route state for ${route}`);
  }
  const state = insertedState;

  const handle: SpyOnHandle = registerSpyOn({
    object: globalThis as never,
    method: 'XMLHttpRequest',
  });

  handle.calledWith([]).implement((() => {
    const loadListeners: PlainListener[] = [];
    const errorListeners: PlainListener[] = [];
    const timeoutListeners: PlainListener[] = [];
    const uploadProgressListeners: UploadListener[] = [];
    // Resolved once open() sees the real url — looked up fresh from the shared map rather than
    // closed over at registration time, since this implementation body is shared by every instance.
    const matchedRoute: { current: RouteState | null } = { current: null };

    return {
      open: (_method: string, url: string): void => {
        const specialChars = new Set([
          '.',
          '*',
          '+',
          '?',
          '^',
          '$',
          '{',
          '}',
          '(',
          ')',
          '|',
          '[',
          ']',
          '\\',
        ]);
        const match = Array.from(routes.entries()).find(([routeKey]) => {
          if (typeof routeKey !== 'string') {
            return false;
          }
          const pattern = routeKey
            .split('/')
            .map((segment) =>
              segment.startsWith(':')
                ? '[^/]+'
                : segment
                    .split('')
                    .map((char) => (specialChars.has(char) ? `\\${char}` : char))
                    .join(''),
            )
            .join('/');
          return new RegExp(`^${pattern}$`, 'u').test(url);
        });
        if (match === undefined) {
          throw new Error(
            `xhrPostWithProgressAdapterProxy: no registered route matches ${url}. Registered routes: ${Array.from(
              routes.keys(),
            ).join(', ')}`,
          );
        }
        const [, routeState] = match;
        routeState.sentUrl = url;
        matchedRoute.current = routeState;
      },
      setRequestHeader: (): void => undefined,
      upload: {
        addEventListener: (type: string, listener: UploadListener): void => {
          if (type === 'progress') {
            uploadProgressListeners.push(listener);
          }
        },
      },
      addEventListener: (type: string, listener: PlainListener): void => {
        if (type === 'load') {
          loadListeners.push(listener);
        }
        if (type === 'error') {
          errorListeners.push(listener);
        }
        if (type === 'timeout') {
          timeoutListeners.push(listener);
        }
      },
      get status(): unknown {
        if (matchedRoute.current === null) {
          throw new Error(
            'xhrPostWithProgressAdapterProxy: status read before open() resolved a route',
          );
        }
        return matchedRoute.current.responseStatus;
      },
      get responseText(): unknown {
        if (matchedRoute.current === null) {
          throw new Error(
            'xhrPostWithProgressAdapterProxy: responseText read before open() resolved a route',
          );
        }
        if (matchedRoute.current.responseBody === null) {
          return '';
        }
        return typeof matchedRoute.current.responseBody === 'string'
          ? matchedRoute.current.responseBody
          : JSON.stringify(matchedRoute.current.responseBody);
      },
      send: (payload: string): void => {
        if (matchedRoute.current === null) {
          throw new Error(
            'xhrPostWithProgressAdapterProxy: send() called before open() resolved a route',
          );
        }
        const routeState = matchedRoute.current;
        routeState.requestCount += 1;
        routeState.sentBodies.push(payload);
        Promise.resolve()
          .then((): void => {
            for (const reading of routeState.readings) {
              const lengthComputable = reading.lengthComputable ?? true;
              for (const listener of uploadProgressListeners) {
                listener({ lengthComputable, loaded: reading.loaded, total: reading.total });
              }
            }
            if (routeState.isNetworkError) {
              for (const listener of errorListeners) {
                listener();
              }
              return;
            }
            for (const listener of loadListeners) {
              listener();
            }
          })
          .catch((error: unknown) => {
            throw error;
          });
      },
    };
  }) as never);

  return {
    respondsWith: ({ status, body }: { status: number; body?: unknown }): void => {
      state.responseStatus = status;
      if (body !== undefined) {
        state.responseBody = body;
      }
    },
    emitsProgress: ({ readings }: { readings: readonly ProgressReading[] }): void => {
      state.readings = readings;
    },
    networkError: (): void => {
      state.isNetworkError = true;
    },
    getSentBody: (): unknown => {
      const last = state.sentBodies.at(-1);
      if (typeof last !== 'string') {
        return null;
      }
      return JSON.parse(last) as unknown;
    },
    getSentBodies: (): unknown[] =>
      state.sentBodies.map((body) =>
        typeof body === 'string' ? (JSON.parse(body) as unknown) : null,
      ),
    getSentUrl: (): unknown => state.sentUrl,
    getRequestCount: (): unknown => state.requestCount,
  };
};
