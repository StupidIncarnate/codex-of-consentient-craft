/**
 * PURPOSE: The name and one-line brief a tool_use content block reduces to for a forensics timeline.
 * Both fields are branded so a raw string can never stand in for either half — reach for this over
 * hand-rolling `{name: string; brief: string}` wherever a caller carries the pair together, so nothing
 * downstream can mix a brief up with any other string in the digest.
 *
 * USAGE:
 * toolBriefContract.parse({ name: 'Read', brief: 'file_path=/tmp/x.ts' });
 * // Returns the branded ToolBrief
 */
import { z } from 'zod';

export const toolBriefContract = z
  .object({
    name: z.string().brand<'ToolBriefName'>(),
    brief: z.string().brand<'ToolBriefText'>(),
  })
  .brand<'ToolBrief'>();

export type ToolBrief = z.infer<typeof toolBriefContract>;
