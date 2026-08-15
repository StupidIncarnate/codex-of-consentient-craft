import { screen, waitFor } from '@testing-library/react';

import { QuestIdStub, RiftcarverResultStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RiftcarverDetailStub } from '../../contracts/riftcarver-detail/riftcarver-detail.stub';

import { RiftcarverResultDetailLayerWidget } from './riftcarver-result-detail-layer-widget';
import { RiftcarverResultDetailLayerWidgetProxy } from './riftcarver-result-detail-layer-widget.proxy';

describe('RiftcarverResultDetailLayerWidget', () => {
  describe('log rendering', () => {
    it('VALID: {detail with a two-line log} => renders the log after fetch', async () => {
      const proxy = RiftcarverResultDetailLayerWidgetProxy();
      proxy.setupDetail({ detail: RiftcarverDetailStub({ log: 'git worktree add\nbuild ok\n' }) });
      const questId = QuestIdStub({ value: 'test-quest' });
      const riftcarverResult = RiftcarverResultStub();

      mantineRenderAdapter({
        ui: (
          <RiftcarverResultDetailLayerWidget
            questId={questId}
            riftcarverResult={riftcarverResult}
          />
        ),
      });

      const log = await screen.findByTestId('execution-row-riftcarver-detail');

      expect(log.textContent).toBe('git worktree add\nbuild ok');
    });

    it('EMPTY: {detail not available} => renders no log element', async () => {
      const proxy = RiftcarverResultDetailLayerWidgetProxy();
      proxy.setupNotFound();
      const questId = QuestIdStub({ value: 'test-quest' });
      const riftcarverResult = RiftcarverResultStub();

      mantineRenderAdapter({
        ui: (
          <RiftcarverResultDetailLayerWidget
            questId={questId}
            riftcarverResult={riftcarverResult}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(1);
      });

      expect(screen.queryByTestId('execution-row-riftcarver-detail')).toBe(null);
    });
  });
});
