import { useDisclosureAnchorBindingProxy } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy';
import { ToolResultContentWidgetProxy } from '../tool-result-content/tool-result-content-widget.proxy';
import { ToolRowFieldLayerWidgetProxy } from './tool-row-field-layer-widget.proxy';

export const ToolRowWidgetProxy = (): {
  setupAutoScrollReleased: () => void;
  isAutoScrollHeld: () => boolean;
} => {
  const anchorProxy = useDisclosureAnchorBindingProxy();
  ToolResultContentWidgetProxy();
  ToolRowFieldLayerWidgetProxy();

  return {
    setupAutoScrollReleased: (): void => {
      anchorProxy.setupReleased();
    },

    isAutoScrollHeld: (): boolean => anchorProxy.isHeld(),
  };
};
