import { MarkdownSpanLayerWidgetProxy } from './markdown-span-layer-widget.proxy';

export const MarkdownBlockLayerWidgetProxy = (): Record<PropertyKey, never> => {
  MarkdownSpanLayerWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
