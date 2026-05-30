import { screen, waitFor } from '@testing-library/react';

import { QuestIdStub, WardResultStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { WardDetailStub } from '../../contracts/ward-detail/ward-detail.stub';

import { WardResultDetailLayerWidget } from './ward-result-detail-layer-widget';
import { WardResultDetailLayerWidgetProxy } from './ward-result-detail-layer-widget.proxy';

describe('WardResultDetailLayerWidget', () => {
  describe('breakdown rendering', () => {
    it('VALID: {detail with one lint error} => renders the breakdown line after fetch', async () => {
      const proxy = WardResultDetailLayerWidgetProxy();
      proxy.setupDetail({ detail: WardDetailStub() });
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'changed' });

      mantineRenderAdapter({
        ui: <WardResultDetailLayerWidget questId={questId} wardResult={wardResult} />,
      });

      const breakdown = await screen.findByTestId('execution-row-ward-detail');

      expect(breakdown.textContent).toBe(
        'lint: packages/web/src/index.ts:10 — Unexpected any [@typescript-eslint/no-explicit-any]',
      );
    });

    it('EMPTY: {detail not available} => renders no breakdown element', async () => {
      const proxy = WardResultDetailLayerWidgetProxy();
      proxy.setupNotFound();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'changed' });

      mantineRenderAdapter({
        ui: <WardResultDetailLayerWidget questId={questId} wardResult={wardResult} />,
      });

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(1);
      });

      expect(screen.queryByTestId('execution-row-ward-detail')).toBe(null);
    });
  });
});
