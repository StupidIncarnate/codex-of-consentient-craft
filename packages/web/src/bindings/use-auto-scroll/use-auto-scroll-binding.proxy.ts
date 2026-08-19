import { disclosureAnchorStateProxy } from '../../state/disclosure-anchor/disclosure-anchor-state.proxy';

export const useAutoScrollBindingProxy = (): {
  setup: () => void;
  setupDisclosureSettling: () => void;
} => {
  const anchorProxy = disclosureAnchorStateProxy();

  return {
    setup: (): void => {
      // No external state to mock — hook is self-contained with refs
    },

    setupDisclosureSettling: (): void => {
      anchorProxy.setupHeld();
    },
  };
};
