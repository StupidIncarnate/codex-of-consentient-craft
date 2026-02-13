import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const ProjectEmptyStateWidgetProxy = (): {
  clickCreateFirstProject: () => Promise<void>;
  isWelcomeVisible: () => boolean;
} => ({
  clickCreateFirstProject: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('CREATE_FIRST_PROJECT_BUTTON'));
  },
  isWelcomeVisible: (): boolean => screen.queryByText('Welcome to Dungeonmaster') !== null,
});
