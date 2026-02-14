import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ProjectEmptyStateWidget } from './project-empty-state-widget';
import { ProjectEmptyStateWidgetProxy } from './project-empty-state-widget.proxy';

describe('ProjectEmptyStateWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders NEW GUILD title', () => {
      const proxy = ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('VALID: {} => renders name input', () => {
      ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {} => renders path input', () => {
      ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_PATH_INPUT')).toBeInTheDocument();
    });

    it('VALID: {no onCancel} => does not render CANCEL button', () => {
      const proxy = ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(false);
    });

    it('VALID: {onCancel provided} => renders CANCEL button', () => {
      const proxy = ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} onCancel={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(true);
    });

    it('VALID: {} => renders BROWSE button', () => {
      const proxy = ProjectEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} />,
      });

      expect(proxy.isBrowseVisible()).toBe(true);
    });
  });

  describe('interactions', () => {
    it('VALID: {click CANCEL} => calls onCancel', async () => {
      const proxy = ProjectEmptyStateWidgetProxy();
      const onCancel = jest.fn();

      mantineRenderAdapter({
        ui: <ProjectEmptyStateWidget onAddProject={jest.fn()} onCancel={onCancel} />,
      });

      await proxy.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
