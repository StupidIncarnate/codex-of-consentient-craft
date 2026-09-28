/**
 * PURPOSE: Defines the WidgetNode structure for the widget composition tree in project-map output
 *
 * USAGE:
 * widgetNodeContract.parse({
 *   widgetName: 'quest-chat-widget',
 *   filePath: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
 *   bindingsAttached: [],
 *   children: [],
 * });
 * // Returns validated WidgetNode
 *
 * WHEN-TO-USE: Building the frontend-react widget tree for project-map headline rendering
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

const widgetNodeFields = z.object({
  widgetName: contentTextContract,
  filePath: absoluteFilePathContract,
  bindingsAttached: z.array(contentTextContract),
});

type WidgetNodeSelf = z.infer<typeof widgetNodeFields> & {
  children: WidgetNodeSelf[];
};

// A getter, not `z.lazy` + a cast — the getter's return type wraps `z.core.$ZodType`, which is
// the only self-reference form `contracts/` allows (zod v4 dropped the old `z.ZodTypeDef` type
// param `z.lazy` needed here).
export const widgetNodeContract = z.object({
  ...widgetNodeFields.shape,
  get children(): z.ZodArray<z.core.$ZodType<WidgetNodeSelf>> {
    return z.array(widgetNodeContract);
  },
});

export type WidgetNode = z.infer<typeof widgetNodeContract>;
