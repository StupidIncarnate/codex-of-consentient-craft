/**
 * PURPOSE: What `dungeonmaster siegelense docs` hands back — the `about` preamble, and one document
 * per scope served, each a headed list of lines. `requested` is null for the whole-surface form, so
 * a caller can tell "all seven because none was asked for" from "all seven because seven were
 * asked for" without counting the array. Reach for this over `ContentText` alone when the manual
 * must stay ADDRESSABLE: the sections are the unit a session quotes back, and flattening the
 * document to one string is what makes a reader paste the whole page to cite one rule.
 *
 * USAGE:
 * docsAnswerContract.parse({ requested: null, about: [], scopes: [] });
 * // Returns a validated DocsAnswer
 */

import { z } from '#gateway/npm/zod';

import { docsScopeContract } from '../docs-scope/docs-scope-contract';

const docsSectionContract = z
  .object({
    heading: z.string().brand<'DocsSectionHeading'>(),
    lines: z.array(z.string().brand<'DocsSectionLines'>()),
  })
  .strict();

const docsScopeDocumentContract = z
  .object({
    scope: docsScopeContract,
    audience: z.string().brand<'DocsScopeDocumentAudience'>(),
    summary: z.string().brand<'DocsScopeDocumentSummary'>(),
    sections: z.array(docsSectionContract),
  })
  .strict();

export const docsAnswerContract = z
  .object({
    requested: docsScopeContract.nullable(),
    about: z.array(z.string().brand<'DocsAnswerAbout'>()),
    scopes: z.array(docsScopeDocumentContract),
  })
  .strict().brand<'DocsAnswer'>();

export type DocsAnswer = z.infer<typeof docsAnswerContract>;
