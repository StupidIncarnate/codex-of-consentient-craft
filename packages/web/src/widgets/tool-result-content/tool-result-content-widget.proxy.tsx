import { MarkdownTextWidgetProxy } from '../markdown-text/markdown-text-widget.proxy';

export const ToolResultContentWidgetProxy = (): Record<PropertyKey, never> => {
  MarkdownTextWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
