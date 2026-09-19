/**
 * PURPOSE: The text extraction mode for a `dom` step — 'own' (default, reading child nodeType === 3
 * text nodes only) or 'full' (opting into textContent) (siegelense-tooling.md line 653: "own text by
 * default; text: 'full' opts into textContent").
 *
 * USAGE:
 * domTextModeContract.parse('full');
 * // Returns 'full' as a validated DomTextMode
 */

import { z } from 'zod';

import { domStatics } from '../../statics/dom/dom-statics';

export const domTextModeContract = z.enum(domStatics.textModes.all);

export type DomTextMode = z.infer<typeof domTextModeContract>;
