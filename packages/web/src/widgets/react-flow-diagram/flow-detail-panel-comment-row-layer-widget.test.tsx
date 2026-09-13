import { screen } from '@testing-library/react';

import { QuestCommentStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowDetailPanelCommentRowLayerWidget } from './flow-detail-panel-comment-row-layer-widget';
import { FlowDetailPanelCommentRowLayerWidgetProxy } from './flow-detail-panel-comment-row-layer-widget.proxy';

describe('FlowDetailPanelCommentRowLayerWidget', () => {
  describe('comment row content', () => {
    it('VALID: {comment text and createdAt} => renders both in FLOW_DETAIL_PANEL_COMMENT_ROW', () => {
      const proxy = FlowDetailPanelCommentRowLayerWidgetProxy();
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      mantineRenderAdapter({ ui: <FlowDetailPanelCommentRowLayerWidget comment={comment} /> });

      expect(proxy.getRow()).toBeInTheDocument();
      expect(proxy.getText()).toBe('This assertion looks wrong');
      expect(proxy.getTime()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('EDGE: {comment text contains a newline} => FLOW_DETAIL_PANEL_COMMENT_TEXT keeps pre-wrap and break-word styling', () => {
      const proxy = FlowDetailPanelCommentRowLayerWidgetProxy();
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'first line\nsecond line',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      mantineRenderAdapter({ ui: <FlowDetailPanelCommentRowLayerWidget comment={comment} /> });

      expect(proxy.getText()).toBe('first line\nsecond line');
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT').style.whiteSpace).toBe(
        'pre-wrap',
      );
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT').style.overflowWrap).toBe(
        'break-word',
      );
    });
  });
});
