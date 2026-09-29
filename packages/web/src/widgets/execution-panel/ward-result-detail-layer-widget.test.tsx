import { screen, waitFor } from '#gateway/npm/testing-library__react';

import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { WardDetailStub } from '@dungeonmaster/shared/contracts/ward-detail/ward-detail.stub';
import { WardResultStub } from '@dungeonmaster/shared/contracts/ward-result/ward-result.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';

import { WardResultDetailLayerWidget } from './ward-result-detail-layer-widget';
import { WardResultDetailLayerWidgetProxy } from './ward-result-detail-layer-widget.proxy';

describe('WardResultDetailLayerWidget', () => {
  describe('breakdown rendering', () => {
    it('VALID: {detail with one lint error} => renders the breakdown line after fetch', async () => {
      const proxy = WardResultDetailLayerWidgetProxy();
      proxy.setupDetail({ detail: WardDetailStub() });
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'committed' });

      mantineRenderMiddleware({
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
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'committed' });

      mantineRenderMiddleware({
        ui: <WardResultDetailLayerWidget questId={questId} wardResult={wardResult} />,
      });

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(1);
      });

      expect(screen.queryByTestId('execution-row-ward-detail')).toBe(null);
    });
  });
});
