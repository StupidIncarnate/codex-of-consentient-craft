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

const baseWidgetNodeContract = z.object({
  widgetName: contentTextContract,
  filePath: absoluteFilePathContract,
  bindingsAttached: z.array(contentTextContract),
});

export type WidgetNode = z.infer<typeof baseWidgetNodeContract> & {
  children: WidgetNode[];
};

type WidgetNodeInput = z.input<typeof baseWidgetNodeContract> & {
  children: WidgetNodeInput[];
};

export const widgetNodeContract: z.ZodType<WidgetNode, z.ZodTypeDef, WidgetNodeInput> =
  baseWidgetNodeContract.extend({
    children: z.lazy(() => z.array(widgetNodeContract)),
  }) as unknown as z.ZodType<WidgetNode, z.ZodTypeDef, WidgetNodeInput>;
