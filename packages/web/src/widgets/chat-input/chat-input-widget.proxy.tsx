export const ChatInputWidgetProxy = (): {
  clearStorage: () => void;
} => ({
  clearStorage: (): void => {
    localStorage.clear();
  },
});
