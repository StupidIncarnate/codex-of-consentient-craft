import { screen, waitFor } from '@testing-library/react';

import { QuestIdStub, WardResultStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { WardDetailStub } from '../../contracts/ward-detail/ward-detail.stub';

import { WardResultRowLayerWidget } from './ward-result-row-layer-widget';
import { WardResultRowLayerWidgetProxy } from './ward-result-row-layer-widget.proxy';

describe('WardResultRowLayerWidget', () => {
  describe('exit code line', () => {
    it('VALID: {exitCode: 0, no wardMode} => renders exit code with no mode suffix', () => {
      WardResultRowLayerWidgetProxy();
      const wardResult = WardResultStub({ exitCode: 0 as never });

      mantineRenderAdapter({
        ui: <WardResultRowLayerWidget wardResult={wardResult} />,
      });

      expect(screen.getByTestId('execution-row-ward-result').textContent).toBe('Ward exit code: 0');
    });

    it('VALID: {exitCode: 1, wardMode: "committed"} => renders exit code and mode', () => {
      WardResultRowLayerWidgetProxy();
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'committed' });

      mantineRenderAdapter({
        ui: <WardResultRowLayerWidget wardResult={wardResult} />,
      });

      expect(screen.getByTestId('execution-row-ward-result').textContent).toBe(
        'Ward exit code: 1 (committed)',
      );
    });
  });

  describe('detail fetch gating', () => {
    it('EMPTY: {no questId} => renders no ward detail element and fetches nothing', () => {
      const proxy = WardResultRowLayerWidgetProxy();
      const wardResult = WardResultStub({ exitCode: 1 as never });

      mantineRenderAdapter({
        ui: <WardResultRowLayerWidget wardResult={wardResult} />,
      });

      expect(screen.queryByTestId('execution-row-ward-detail')).toBe(null);
      expect(proxy.getDetailRequestCount()).toBe(0);
    });

    it('VALID: {questId provided, detail with one lint error} => renders the fetched breakdown line', async () => {
      const proxy = WardResultRowLayerWidgetProxy();
      proxy.setupDetail({ detail: WardDetailStub() });
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub({ exitCode: 1 as never, wardMode: 'committed' });

      mantineRenderAdapter({
        ui: <WardResultRowLayerWidget wardResult={wardResult} questId={questId} />,
      });

      const breakdown = await screen.findByTestId('execution-row-ward-detail');

      expect(breakdown.textContent).toBe(
        'lint: packages/web/src/index.ts:10 — Unexpected any [@typescript-eslint/no-explicit-any]',
      );
    });

    it('EMPTY: {questId provided, detail not available} => renders no ward detail element', async () => {
      const proxy = WardResultRowLayerWidgetProxy();
      proxy.setupNotFound();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub({ exitCode: 1 as never });

      mantineRenderAdapter({
        ui: <WardResultRowLayerWidget wardResult={wardResult} questId={questId} />,
      });

      await waitFor(() => {
        expect(proxy.getDetailRequestCount()).toBe(1);
      });

      expect(screen.queryByTestId('execution-row-ward-detail')).toBe(null);
    });
  });
});
