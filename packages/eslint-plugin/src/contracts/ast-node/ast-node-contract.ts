import { z } from 'zod';

/**
 * PURPOSE: Validates basic AST node structure with type, source location, and parent reference
 *
 * USAGE:
 * const node = astNodeContract.parse({ type: 'Identifier', range: [0, 10], loc: {...}, parent: null });
 * // Returns validated AstNode with branded properties
 */
export const astNodeContract = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
  range: z
    .tuple([
      z.number().int().min(0).brand<'SourcePosition'>(),
      z.number().int().min(0).brand<'SourcePosition'>(),
    ])
    .optional(),
  loc: z
    .object({
      start: z.object({
        line: z.number().int().positive().brand<'LineNumber'>(),
        column: z.number().int().min(0).brand<'ColumnNumber'>(),
      }),
      end: z.object({
        line: z.number().int().positive().brand<'LineNumber'>(),
        column: z.number().int().min(0).brand<'ColumnNumber'>(),
      }),
    })
    .optional(),
  parent: z.unknown().optional(),
});

export type AstNode = z.infer<typeof astNodeContract>;
