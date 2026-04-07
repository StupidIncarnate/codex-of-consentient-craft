export const useAutoScrollBindingProxy = (): {
  setup: () => void;
} => ({
  setup: (): void => {
    // No external state to mock — hook is self-contained with refs
  },
});
