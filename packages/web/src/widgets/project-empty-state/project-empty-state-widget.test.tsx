import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ProjectEmptyStateWidget } from './project-empty-state-widget';
import { ProjectEmptyStateWidgetProxy } from './project-empty-state-widget.proxy';

describe('ProjectEmptyStateWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders welcome title', () => {
      ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(screen.getByText('Welcome to Dungeonmaster')).toBeInTheDocument();
    });

    it('VALID: {} => renders description text', () => {
      ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(screen.getByText('Get started by creating your first project.')).toBeInTheDocument();
    });

    it('VALID: {} => renders create first project button', () => {
      ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(screen.getByTestId('CREATE_FIRST_PROJECT_BUTTON')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('VALID: {click create first project} => calls onAddProject', async () => {
      const proxy = ProjectEmptyStateWidgetProxy();
      const onAddProject = jest.fn();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={onAddProject} />,
      });

      await proxy.clickCreateFirstProject();

      expect(onAddProject).toHaveBeenCalledTimes(1);
    });
  });
});
