import { ProjectIdStub, ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { GuildListWidget } from './guild-list-widget';
import { GuildListWidgetProxy } from './guild-list-widget.proxy';

describe('GuildListWidget', () => {
  describe('rendering', () => {
    it('VALID: {projects} => renders GUILDS header', () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[]}
            selectedProjectId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.hasHeader()).toBe(true);
    });

    it('VALID: {projects with items} => renders project names', () => {
      const proxy = GuildListWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const project = ProjectListItemStub({ id: projectId, name: 'Test Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[project]}
            selectedProjectId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemVisible({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
    });
  });

  describe('selection', () => {
    it('VALID: {selectedProjectId matches} => renders item as selected', () => {
      const proxy = GuildListWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const project = ProjectListItemStub({ id: projectId, name: 'Selected Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[project]}
            selectedProjectId={projectId}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
    });

    it('VALID: {selectedProjectId does not match} => renders item as unselected', () => {
      const proxy = GuildListWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const otherId = ProjectIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const project = ProjectListItemStub({ id: projectId, name: 'Unselected Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[project]}
            selectedProjectId={otherId}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${projectId}` })).toBe(false);
    });
  });

  describe('interaction', () => {
    it('VALID: {click item} => calls onSelect with project id', async () => {
      const proxy = GuildListWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const project = ProjectListItemStub({ id: projectId, name: 'Clickable Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[project]}
            selectedProjectId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      await proxy.clickItem({ testId: `GUILD_ITEM_${projectId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ id: projectId });
    });

    it('VALID: {click add button} => calls onAdd', async () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[]}
            selectedProjectId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      await proxy.clickAddButton();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no projects} => renders only header', () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            projects={[]}
            selectedProjectId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.hasHeader()).toBe(true);
    });
  });
});
