/**
 * PURPOSE: A filename with its extension already stripped — what
 * `stripJsonlExtensionTransformer` hands back before a caller re-parses it through its own real
 * id brand (`sessionIdContract`, `agentIdContract`).
 *
 * USAGE:
 * fileStemContract.parse('seed-session-1');
 * // Returns branded FileStem
 */
import { z } from 'zod';

export const fileStemContract = z.string().min(1).brand<'FileStem'>();

export type FileStem = z.infer<typeof fileStemContract>;
