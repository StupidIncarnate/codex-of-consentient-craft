/**
 * PURPOSE: A `/`-rooted path with no origin — a lane process's `readyPath`, or a step's `goto`
 * target. The origin (host and port) is assigned per-instance at boot, never known to a spec, so
 * this brand rejects a full URL the way a spec-authoring mistake would produce one. Reach for this
 * over `contentTextContract` whenever the value is specifically a path a browser or an HTTP probe
 * is pointed at, never free text.
 *
 * USAGE:
 * urlPathContract.parse('/api/guilds');
 * // Returns: '/api/guilds' as UrlPath
 */

import { z } from 'zod';

export const urlPathContract = z.string().startsWith('/').brand<'UrlPath'>();

export type UrlPath = z.infer<typeof urlPathContract>;
