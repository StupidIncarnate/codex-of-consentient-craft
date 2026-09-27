/**
 * PURPOSE: A real `Hono` app instance, built through the real constructor — for a caller staging
 * this subpath's own value instead of hand-typing a fake app.
 *
 * USAGE:
 * const app = HonoAppStub();
 * // Returns a real, freshly constructed Hono app with no routes registered
 */
import { Hono } from 'hono';

export const HonoAppStub = (): Hono => new Hono();
