/**
 * PURPOSE: A key into a transcript tool_use item's `input` record — a tool-specific parameter
 * name (e.g. `folderType`, `workItemId`). A caller reading a known parameter re-parses it through
 * this contract to index the branded `Record` `transcriptLineContract`'s `input` field returns.
 *
 * USAGE:
 * toolInputParamNameContract.parse('folderType');
 * // Returns a branded ToolInputParamName
 */
import { z } from '#gateway/npm/zod';

export const toolInputParamNameContract = z.string().brand<'ToolInputParamName'>();

export type ToolInputParamName = z.infer<typeof toolInputParamNameContract>;
