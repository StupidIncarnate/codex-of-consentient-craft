/**
 * PURPOSE: Defines a branded string type for markdown header text
 *
 * USAGE:
 * const header: HeaderText = headerTextContract.parse('## Standards');
 * // Returns a branded HeaderText string type
 */
import { z } from 'zod';

export const headerTextContract = z.string().brand<'HeaderText'>();

export type HeaderText = z.infer<typeof headerTextContract>;
