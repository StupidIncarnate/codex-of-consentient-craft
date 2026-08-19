import { useDisclosureAnchorBindingProxy } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy';

export const ShowEarlierToggleWidgetProxy = (): {
  setupAutoScrollReleased: () => void;
  isAutoScrollHeld: () => boolean;
} => {
  const anchorProxy = useDisclosureAnchorBindingProxy();

  return {
    setupAutoScrollReleased: (): void => {
      anchorProxy.setupReleased();
    },

    isAutoScrollHeld: (): boolean => anchorProxy.isHeld(),
  };
};
