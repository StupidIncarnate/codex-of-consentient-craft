/**
 * PURPOSE: Validates basic AST node structure with type, source location, and parent reference
 *
 * USAGE:
 * const node = astNodeContract.parse({ type: 'Identifier', range: [0, 10], loc: {...}, parent: null });
 * // Returns validated AstNode with branded properties
 */
import { z } from '#gateway/npm/zod';

export const astNodeContract = z
  .object({
    type: z.string().min(1).brand<'AstNodeType'>(),
    range: z
      .tuple([
        z.number().int().min(0).brand<'AstNodeRange0'>(),
        z.number().int().min(0).brand<'AstNodeRange1'>(),
      ])
      .optional(),
    loc: z
      .object({
        start: z
          .object({
            line: z.number().int().positive().brand<'AstNodeLocStartLine'>(),
            column: z.number().int().min(0).brand<'AstNodeLocStartColumn'>(),
          })
          .brand<'AstNodeLocStart'>(),
        end: z
          .object({
            line: z.number().int().positive().brand<'AstNodeLocEndLine'>(),
            column: z.number().int().min(0).brand<'AstNodeLocEndColumn'>(),
          })
          .brand<'AstNodeLocEnd'>(),
      })
      .brand<'AstNodeLoc'>()
      .optional(),
    parent: z.unknown().optional(),
  })
  .brand<'AstNode'>();

export type AstNode = z.infer<typeof astNodeContract>;
