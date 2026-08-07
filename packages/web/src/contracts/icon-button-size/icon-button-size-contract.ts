/**
 * PURPOSE: Names the size scale every icon button in this app draws from — Mantine's own ActionIcon
 * enum, reused rather than paralleled so a call site cannot invent a one-off pixel value. Reach for
 * this over buttonVariantContract when the question is how BIG a control is; the variant contract
 * answers what colour it is, and the two are chosen independently at each call site.
 *
 * USAGE:
 * iconButtonSizeContract.parse('sm');
 * // Returns: IconButtonSize branded string
 */

import { z } from 'zod';

export const iconButtonSizeContract = z
  .enum(['xs', 'sm', 'md', 'lg', 'xl'])
  .brand<'IconButtonSize'>();

export type IconButtonSize = z.infer<typeof iconButtonSizeContract>;
