import { screen, waitFor } from '@testing-library/react';

import { QuestIdStub, RiftcarverResultStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RiftcarverDetailStub } from '../../contracts/riftcarver-detail/riftcarver-detail.stub';

import { RiftcarverResultRowLayerWidget } from './riftcarver-result-row-layer-widget';
import { RiftcarverResultRowLayerWidgetProxy } from './riftcarver-result-row-layer-widget.proxy';

describe('RiftcarverResultRowLayerWidget', () => {
  describe('exit code line', () => {
    it('VALID: {exitCode: 0, outcome: "green"} => renders exit code and outcome', () => {
      RiftcarverResultRowLayerWidgetProxy();
      const riftcarverResult = RiftcarverResultStub({ exitCode: 0 as never, outcome: 'green' });

      mantineRenderAdapter({
        ui: <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} />,
      });

      expect(screen.getByTestId('execution-row-riftcarver-result').textContent).toBe(
        'Riftcarver exit code: 0 (green)',
      );
    });

    it('VALID: {exitCode: 1, outcome: "repairable"} => renders exit code and outcome', () => {
      RiftcarverResultRowLayerWidgetProxy();
      const riftcarverResult = RiftcarverResultStub({
        exitCode: 1 as never,
        outcome: 'repairable',
      });

      mantineRenderAdapter({
        ui: <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} />,
      });

      expect(screen.getByTestId('execution-row-riftcarver-result').textContent).toBe(
        'Riftcarver exit code: 1 (repairable)',
      );
    });
  });

  describe('detail fetch gating', () => {
    it('EMPTY: {no questId} => renders no riftcarver detail element and fetches nothing', () => {
      const proxy = RiftcarverResultRowLayerWidgetProxy();
      const riftcarverResult = RiftcarverResultStub({ exitCode: 1 as never });

      mantineRenderAdapter({
        ui: <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} />,
      });

      expect(screen.queryByTestId('execution-row-riftcarver-detail')).toBe(null);
      expect(proxy.getDetailRequestCount()).toBe(0);
    });

    it('VALID: {questId provided, detail with a two-line log} => renders the fetched log', async () => {
      const proxy = RiftcarverResultRowLayerWidgetProxy();
      proxy.setupDetail({ detail: RiftcarverDetailStub({ log: 'git worktree add\nbuild ok\n' }) });
      const questId = QuestIdStub({ value: 'test-quest' });
      const riftcarverResult = RiftcarverResultStub();

      mantineRenderAdapter({
        ui: (
          <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} questId={questId} />
        ),
      });

      const log = await screen.findByTestId('execution-row-riftcarver-detail');

      expect(log.textContent).toBe('git worktree add\nbuild ok');
    });

    it('EMPTY: {questId provided, detail not available} => renders no riftcarver detail element', async () => {
      const proxy = RiftcarverResultRowLayerWidgetProxy();
      proxy.setupNotFound();
      const questId = QuestIdStub({ value: 'test-quest' });
      const riftcarverResult = RiftcarverResultStub();

      mantineRenderAdapter({
        ui: (
          <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} questId={questId} />
        ),
      });

      await waitFor(() => {
        expect(proxy.getDetailRequestCount()).toBe(1);
      });

      expect(screen.queryByTestId('execution-row-riftcarver-detail')).toBe(null);
    });
  });
});
