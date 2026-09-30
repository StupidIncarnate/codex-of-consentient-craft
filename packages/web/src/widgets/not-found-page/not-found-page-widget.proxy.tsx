import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const NotFoundPageWidgetProxy = (): {
  getShownPath: () => HTMLElement['textContent'];
  getHomeLinkHref: () => ReturnType<HTMLElement['getAttribute']>;
  clickHomeLink: () => Promise<void>;
  hasNotFoundPage: () => boolean;
} => ({
  getShownPath: (): HTMLElement['textContent'] => screen.getByTestId('NOT_FOUND_PATH').textContent,
  getHomeLinkHref: (): ReturnType<HTMLElement['getAttribute']> =>
    screen.getByTestId('NOT_FOUND_HOME_LINK').getAttribute('href'),
  clickHomeLink: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('NOT_FOUND_HOME_LINK'), userEventStatics.options);
  },
  hasNotFoundPage: (): boolean => screen.queryByTestId('NOT_FOUND_PAGE') !== null,
});
