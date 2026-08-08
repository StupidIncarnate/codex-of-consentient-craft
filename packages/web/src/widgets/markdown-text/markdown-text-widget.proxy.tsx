import { MarkdownBlockLayerWidgetProxy } from './markdown-block-layer-widget.proxy';

export const MarkdownTextWidgetProxy = (): Record<PropertyKey, never> => {
  MarkdownBlockLayerWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
