import { screen } from '@testing-library/react';

import { useAutoScrollBindingProxy } from '../../bindings/use-auto-scroll/use-auto-scroll-binding.proxy';

export const AutoScrollContainerWidgetProxy = (): {
  isVisible: (params: { testId: string }) => boolean;
} => {
  useAutoScrollBindingProxy();

  return {
    isVisible: ({ testId }: { testId: string }): boolean => screen.queryByTestId(testId) !== null,
  };
};
