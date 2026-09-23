import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CompletedCountStub } from '@dungeonmaster/shared/contracts';
import { TotalCountStub } from '@dungeonmaster/shared/contracts';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';

describe('ExecutionStatusBarLayerWidget', () => {
  describe('awaiting plan', () => {
    it('EMPTY: {totalCount: 0, source: ledger} => renders AWAITING PLAN text', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 0 })}
            source="ledger"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTIONAWAITING PLAN');
    });

    it('EMPTY: {totalCount: 0, source: projection} => renders AWAITING PLAN text regardless of source', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 0 })}
            source="projection"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTIONAWAITING PLAN');
    });
  });

  describe('ledger-sourced progress', () => {
    it('VALID: {completedCount: 3, totalCount: 8, source: ledger} => renders the count labeled OPERATIONS', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 3 })}
            totalCount={TotalCountStub({ value: 8 })}
            source="ledger"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTION3/8 OPERATIONS');
    });

    it('VALID: {completedCount: 0, totalCount: 5, source: ledger} => renders zero completion', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 5 })}
            source="ledger"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTION0/5 OPERATIONS');
    });
  });

  describe('projection-sourced progress', () => {
    it('VALID: {completedCount: 1, totalCount: 4, source: projection} => renders the count labeled STEPS', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 1 })}
            totalCount={TotalCountStub({ value: 4 })}
            source="projection"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.textContent).toBe('EXECUTION1/4 STEPS');
    });
  });

  describe('styling', () => {
    it('VALID: {any props} => renders border-bottom', () => {
      ExecutionStatusBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionStatusBarLayerWidget
            completedCount={CompletedCountStub({ value: 0 })}
            totalCount={TotalCountStub({ value: 8 })}
            source="ledger"
          />
        ),
      });

      const bar = screen.getByTestId('execution-status-bar-layer-widget');

      expect(bar.style.borderBottom).toBe('1px solid rgb(61, 42, 30)');
    });
  });
});
