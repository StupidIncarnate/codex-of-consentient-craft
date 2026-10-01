/**
 * PURPOSE: Every module specifier a gateway module mock answers, mapped to the absolute path of that
 * mock — `#gateway/npm/<folder>` and the raw package name both point at the same file. The shape the
 * gateway module-mock Jest resolver looks a request up in.
 *
 * USAGE:
 * gatewayModuleMockMapContract.parse({ elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs' });
 * // Returns a GatewayModuleMockMap; a top-level record's keys and values are not fields, so stay plain
 */

import { z } from '#gateway/npm/zod';

export const gatewayModuleMockMapContract = z.record(z.string(), z.string());

export type GatewayModuleMockMap = z.infer<typeof gatewayModuleMockMapContract>;
