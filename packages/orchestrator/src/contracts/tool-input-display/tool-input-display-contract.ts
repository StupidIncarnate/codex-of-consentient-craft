/**
 * PURPOSE: Defines a branded string type for formatted tool input parameters display text
 *
 * USAGE:
 * const display: ToolInputDisplay = toolInputDisplayContract.parse('pattern="*.ts" path="src/"');
 * // Returns a branded ToolInputDisplay string type
 */

import { z } from 'zod';

export const toolInputDisplayContract = z.string().brand<'ToolInputDisplay'>();

export type ToolInputDisplay = z.infer<typeof toolInputDisplayContract>;
