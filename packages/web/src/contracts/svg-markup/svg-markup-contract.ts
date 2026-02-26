/**
 * PURPOSE: Defines a branded string type for SVG markup content
 *
 * USAGE:
 * svgMarkupContract.parse('<svg>...</svg>');
 * // Returns: SvgMarkup branded string
 */

import { z } from 'zod';

export const svgMarkupContract = z.string().min(1).brand<'SvgMarkup'>();

export type SvgMarkup = z.infer<typeof svgMarkupContract>;
