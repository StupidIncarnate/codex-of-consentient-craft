/**
 * PURPOSE: The pair of ports one siegelense instance claims in the registry BEFORE it binds either —
 * claiming ahead of binding is what stops two sessions asking the OS for a free pair in the same
 * moment from overlapping, where two instances landing on one port would read as a walk measuring
 * another walk's own state. The refine rejecting `api === web` guards a second, narrower failure:
 * this repo's own root CLAUDE.md records that when the API port and the web port collide, Playwright
 * waits on one port while Vite binds the other and the run dies on
 * `Timed out waiting 60000ms from config.webServer`.
 *
 * USAGE:
 * const ports = portPairContract.parse({ api: 34172, web: 34173 });
 * // Returns a validated PortPair
 */

import { z } from 'zod';

import { networkPortContract } from '@dungeonmaster/shared/contracts';

export const portPairContract = z
  .object({
    api: networkPortContract,
    web: networkPortContract,
  })
  .refine((pair) => pair.api !== pair.web, {
    message: 'api and web ports must differ — Playwright waits on one while Vite binds the other',
    path: ['web'],
  });

export type PortPair = z.infer<typeof portPairContract>;
