/**
 * PURPOSE: A real router, built through the real `createMemoryRouter()` — for a caller staging
 * this subpath's own value instead of hand-typing a fake one.
 *
 * USAGE:
 * const router = MemoryRouterStub();
 * // Returns a real, initialized in-memory router at '/'
 */
import { createMemoryRouter } from 'react-router-dom';

export const MemoryRouterStub = (): ReturnType<typeof createMemoryRouter> =>
  createMemoryRouter([{ path: '/', element: null }]);
