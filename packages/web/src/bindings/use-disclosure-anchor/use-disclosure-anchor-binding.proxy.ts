import { disclosureAnchorStateProxy } from '../../state/disclosure-anchor/disclosure-anchor-state.proxy';

export const useDisclosureAnchorBindingProxy = (): {
  setupReleased: () => void;
  isHeld: () => boolean;
} => {
  const stateProxy = disclosureAnchorStateProxy();

  return {
    setupReleased: (): void => {
      stateProxy.setupReleased();
    },

    isHeld: (): boolean => stateProxy.isHeld(),
  };
};
