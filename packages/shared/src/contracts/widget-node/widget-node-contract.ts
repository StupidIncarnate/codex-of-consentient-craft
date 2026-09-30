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

import { z } from '#gateway/npm/zod';

const widgetNodeFields = z.object({
  widgetName: z.string().brand<'WidgetNodeWidgetName'>(),
  filePath: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'WidgetNodeFieldsFilePath'>(),
  bindingsAttached: z.array(z.string().brand<'WidgetNodeBindingsAttached'>()),
});

type WidgetNodeSelf = z.infer<typeof widgetNodeFields> & {
  children: WidgetNodeSelf[];
} & z.$brand<'WidgetNode'>;

// A getter, not `z.lazy` + a cast — the getter's return type wraps `z.core.$ZodType`, which is
// the only self-reference form `contracts/` allows (zod v4 dropped the old `z.ZodTypeDef` type
// param `z.lazy` needed here).
export const widgetNodeContract = z.object({
  ...widgetNodeFields.shape,
  get children(): z.ZodArray<z.core.$ZodType<WidgetNodeSelf>> {
    return z.array(widgetNodeContract);
  },
}).brand<'WidgetNode'>();

export type WidgetNode = z.infer<typeof widgetNodeContract>;
