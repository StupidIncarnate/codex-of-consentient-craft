/**
 * PURPOSE: Everything the census knows about one adapter: what shape it has, the gateway exports
 * that could replace it, and who depends on it. This is the unit a planner batches by.
 *
 * USAGE:
 * adapterRecordContract.parse({ file: 'packages/a/src/adapters/x/x-adapter.ts', exportNames: ['xAdapter'], shape: 'logic', reasons: [], outsideCalls: [], gateway: [], productionCallers: [], testFiles: [], proxyFiles: [], adapterProxy: null });
 * // Returns: AdapterRecord
 */
import { z } from 'zod';
import { censusPathContract } from '../census-path/census-path-contract';
import { exportNameContract } from '../export-name/export-name-contract';
import { adapterLogicReasonContract } from '../adapter-logic-reason/adapter-logic-reason-contract';
import { outsideCallContract } from '../outside-call/outside-call-contract';
import { gatewayExportContract } from '../gateway-export/gateway-export-contract';
import { adapterCallerContract } from '../adapter-caller/adapter-caller-contract';
import { catchAllSiteContract } from '../catch-all-site/catch-all-site-contract';

export const adapterRecordContract = z.object({
  file: censusPathContract,
  exportNames: z.array(exportNameContract),
  shape: z.enum(['pass-through', 'logic']),
  reasons: z.array(adapterLogicReasonContract),
  outsideCalls: z.array(outsideCallContract),
  gateway: z.array(gatewayExportContract),
  productionCallers: z.array(adapterCallerContract),
  testFiles: z.array(censusPathContract),
  proxyFiles: z.array(censusPathContract),
  adapterProxy: z
    .object({
      file: censusPathContract,
      catchAll: z.array(catchAllSiteContract),
      composedBy: z.array(censusPathContract),
    })
    .nullable(),
});

export type AdapterRecord = z.infer<typeof adapterRecordContract>;
