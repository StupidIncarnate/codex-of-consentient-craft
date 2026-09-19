/**
 * PURPOSE: The seven `docs --for <scope>` values — one per tool-using role — derived from
 * `siegelenseCallStatics.docs.scopes` rather than retyped, the same way `stepVerbContract` derives
 * its enum, so an eighth role never leaves two lists to keep in sync. Reach for this over a raw
 * scope string anywhere a value is validated as belonging to the closed set rather than merely
 * being shaped like one of its members — the argv parser's refusal for an unknown scope is built
 * from this contract's own option list.
 *
 * USAGE:
 * docsScopeContract.parse('walking');
 * // Returns a branded DocsScope
 */

import { z } from 'zod';

import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';

export const docsScopeContract = z.enum(siegelenseCallStatics.docs.scopes).brand<'DocsScope'>();

export type DocsScope = z.infer<typeof docsScopeContract>;
