import { useDisclosureAnchorBindingProxy } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy';
import { MarkdownTextWidgetProxy } from '../markdown-text/markdown-text-widget.proxy';
import { ThinkingRowWidgetProxy } from '../thinking-row/thinking-row-widget.proxy';
import { ToolResultContentWidgetProxy } from '../tool-result-content/tool-result-content-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';
import { ImageContentLayerWidgetProxy } from './image-content-layer-widget.proxy';
import { InjectedPromptLayerWidgetProxy } from './injected-prompt-layer-widget.proxy';

export const ChatMessageWidgetProxy = (): {
  setupAutoScrollReleased: () => void;
  isAutoScrollHeld: () => boolean;
} => {
  const anchorProxy = useDisclosureAnchorBindingProxy();
  ImageContentLayerWidgetProxy();
  InjectedPromptLayerWidgetProxy();
  MarkdownTextWidgetProxy();
  ThinkingRowWidgetProxy();
  ToolResultContentWidgetProxy();
  ToolRowWidgetProxy();

  return {
    setupAutoScrollReleased: (): void => {
      anchorProxy.setupReleased();
    },

    isAutoScrollHeld: (): boolean => anchorProxy.isHeld(),
  };
};
