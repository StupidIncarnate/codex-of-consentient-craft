/**
 * PURPOSE: Names the content-identity of a flow, so the diagram can tell an actual spec edit apart
 * from a re-parse. Reach for this over comparing `Flow` objects by reference: a quest refresh hands
 * the diagram a structurally identical flow several times a second, and reference equality reports
 * every one of those as a change.
 *
 * USAGE:
 * flowLayoutSignatureContract.parse(JSON.stringify(flow));
 * // Returns: FlowLayoutSignature branded string
 */

import { z } from 'zod';

export const flowLayoutSignatureContract = z.string().min(1).brand<'FlowLayoutSignature'>();

export type FlowLayoutSignature = z.infer<typeof flowLayoutSignatureContract>;
