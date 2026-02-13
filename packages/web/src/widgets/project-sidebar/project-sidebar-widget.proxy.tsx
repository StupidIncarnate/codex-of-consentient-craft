import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const ProjectSidebarWidgetProxy = (): {
  clickAddProject: () => Promise<void>;
  clickProject: (params: { name: string }) => Promise<void>;
  isProjectVisible: (params: { name: string }) => boolean;
} => ({
  clickAddProject: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('ADD_PROJECT_BUTTON'));
  },
  clickProject: async ({ name }: { name: string }): Promise<void> => {
    await userEvent.click(screen.getByText(name));
  },
  isProjectVisible: ({ name }: { name: string }): boolean => screen.queryByText(name) !== null,
});
