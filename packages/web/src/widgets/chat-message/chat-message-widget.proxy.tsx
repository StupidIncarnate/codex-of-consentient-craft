import { InjectedPromptLayerWidgetProxy } from './injected-prompt-layer-widget.proxy';
import { ThinkingLayerWidgetProxy } from './thinking-layer-widget.proxy';
import { ToolUseLayerWidgetProxy } from './tool-use-layer-widget.proxy';

export const ChatMessageWidgetProxy = (): Record<PropertyKey, never> => {
  InjectedPromptLayerWidgetProxy();
  ThinkingLayerWidgetProxy();
  ToolUseLayerWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
