import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FormattedToolFieldStub } from '../../contracts/formatted-tool-field/formatted-tool-field.stub';
import { ToolNameStub } from '../../contracts/tool-name/tool-name.stub';
import { ToolRowFieldLayerWidget } from './tool-row-field-layer-widget';
import { ToolRowFieldLayerWidgetProxy } from './tool-row-field-layer-widget.proxy';

describe('ToolRowFieldLayerWidget', () => {
  describe('inline field', () => {
    it('VALID: {short value, isLong: false} => renders "key: value" with no toggle', () => {
      ToolRowFieldLayerWidgetProxy();
      const field = FormattedToolFieldStub({
        key: 'file_path',
        value: '/src/index.ts',
        isLong: false,
      });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Read' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_ROW_FIELD_INLINE').textContent).toBe(
        'file_path: /src/index.ts',
      );
      expect(screen.queryByTestId('TOOL_ROW_FIELD_TOGGLE')).toBe(null);
    });

    it('VALID: {isLong: true} => elides the value and offers a toggle', () => {
      ToolRowFieldLayerWidgetProxy();
      const filePath =
        '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/.quest-plans/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md';
      const field = FormattedToolFieldStub({ key: 'file_path', value: filePath, isLong: true });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Write' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_ROW_FIELD_INLINE').textContent).toBe(
        'file_path: /home/brutus-home/projects/codex-of-consentient-craft/worktrees/…/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.mdshow more',
      );
    });

    it('VALID: {isLong: true, show more clicked} => reveals the value untouched and holds the anchor', async () => {
      ToolRowFieldLayerWidgetProxy();
      const filePath =
        '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/.quest-plans/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md';
      const field = FormattedToolFieldStub({ key: 'file_path', value: filePath, isLong: true });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Write' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_FIELD_TOGGLE'));

      expect(screen.getByTestId('TOOL_ROW_FIELD_INLINE').textContent).toBe(
        `file_path: ${filePath}show less`,
      );
      expect(holdAnchor).toHaveBeenCalledTimes(1);
    });
  });

  describe('block field: multi-line value', () => {
    it('VALID: {content within both limits} => renders the label and the whole content with no toggle', () => {
      ToolRowFieldLayerWidgetProxy();
      const field = FormattedToolFieldStub({
        key: 'content',
        value: 'const a = 1;\nconst b = 2;',
        isLong: false,
      });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Write' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_ROW_FIELD_LABEL').textContent).toBe('content');
      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(
        'const a = 1;\nconst b = 2;',
      );
      expect(screen.queryByTestId('TOOL_ROW_FIELD_TOGGLE')).toBe(null);
    });

    it('VALID: {content over the line limit} => previews whole lines and offers the rest', async () => {
      ToolRowFieldLayerWidgetProxy();
      const lines = Array.from({ length: 30 }, (_, index) => `line ${String(index)}`);
      const field = FormattedToolFieldStub({
        key: 'content',
        value: lines.join('\n'),
        isLong: false,
      });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Write' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(
        lines.slice(0, 12).join('\n'),
      );

      await userEvent.click(screen.getByTestId('TOOL_ROW_FIELD_TOGGLE'));

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(lines.join('\n'));
      expect(holdAnchor).toHaveBeenCalledTimes(1);
    });
  });

  describe('block field: Bash command', () => {
    it('VALID: {toolName: Bash, single-line command} => takes the block surface with no caption', () => {
      ToolRowFieldLayerWidgetProxy();
      const field = FormattedToolFieldStub({
        key: 'command',
        value: 'npm run ward',
        isLong: false,
      });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Bash' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_ROW_BLOCK_FIELD').textContent).toBe('npm run ward');
      expect(screen.queryByTestId('TOOL_ROW_FIELD_LABEL')).toBe(null);
    });

    it('VALID: {toolName: Read, single-line path} => stays inline and takes no block surface', () => {
      ToolRowFieldLayerWidgetProxy();
      const field = FormattedToolFieldStub({
        key: 'file_path',
        value: '/src/index.ts',
        isLong: false,
      });
      const holdAnchor = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ToolRowFieldLayerWidget
            field={field}
            toolName={ToolNameStub({ value: 'Read' })}
            holdAnchor={holdAnchor}
          />
        ),
      });

      expect(screen.queryByTestId('TOOL_ROW_BLOCK_FIELD')).toBe(null);
    });
  });
});
