import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ProjectAddModalWidget } from './project-add-modal-widget';
import { ProjectAddModalWidgetProxy } from './project-add-modal-widget.proxy';

describe('ProjectAddModalWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders modal with Add Project title', () => {
      ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByText('Add Project')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders project name input', () => {
      ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByTestId('PROJECT_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Browse button', () => {
      ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByTestId('BROWSE_BUTTON')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders path input with empty value', () => {
      const proxy = ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(proxy.getPathDisplay()).toBe('');
    });

    it('VALID: {opened: true} => renders Create button disabled initially', () => {
      const proxy = ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(proxy.isCreateDisabled()).toBe(true);
    });
  });

  describe('interactions', () => {
    it('VALID: {type name only} => Create button remains disabled', async () => {
      const proxy = ProjectAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      await proxy.typeName({ name: 'My Project' });

      expect(proxy.isCreateDisabled()).toBe(true);
    });

    it('VALID: {click cancel} => calls onClose', async () => {
      const proxy = ProjectAddModalWidgetProxy();
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <ProjectAddModalWidget opened={true} onClose={onClose} onSubmit={jest.fn()} />,
      });

      await proxy.clickCancel();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
