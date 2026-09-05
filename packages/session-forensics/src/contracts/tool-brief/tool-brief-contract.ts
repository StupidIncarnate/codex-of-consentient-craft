/**
 * PURPOSE: The name and one-line brief a tool_use content block boils down to, for a forensics
 * timeline. Both fields use a branded type — a plain string that zod tags with a name, so it
 * cannot be passed where a different string belongs. Branding here means a raw string can never
 * stand in for either half. Reach for this instead of hand-rolling `{name: string; brief: string}`
 * wherever a caller carries the pair together. That way nothing downstream can mix a brief up with
 * any other string in the digest.
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
