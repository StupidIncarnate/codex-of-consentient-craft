import { ThinkingRowWidgetProxy } from '../thinking-row/thinking-row-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';
import { InjectedPromptLayerWidgetProxy } from './injected-prompt-layer-widget.proxy';

export const ChatMessageWidgetProxy = (): Record<PropertyKey, never> => {
  InjectedPromptLayerWidgetProxy();
  ThinkingRowWidgetProxy();
  ToolRowWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
