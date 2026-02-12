import { screen } from '@testing-library/react';

import { OrchestrationSlotStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SlotGridWidget } from './slot-grid-widget';
import { SlotGridWidgetProxy } from './slot-grid-widget.proxy';

describe('SlotGridWidget', () => {
  describe('with slots', () => {
    it('VALID: {slots: [running, idle]} => renders slot cards with correct status badges', () => {
      SlotGridWidgetProxy();

      const slots = [
        OrchestrationSlotStub({
          slotId: 0 as never,
          status: 'running',
          step: 'Create user model' as never,
        }),
        OrchestrationSlotStub({ slotId: 1 as never, status: 'idle' }),
      ];

      mantineRenderAdapter({ ui: <SlotGridWidget slots={slots} /> });

      expect(screen.getByTestId('SLOT_CARD_0')).toBeInTheDocument();
      expect(screen.getByTestId('SLOT_CARD_1')).toBeInTheDocument();
      expect(screen.getByTestId('SLOT_STATUS_0')).toHaveTextContent('running');
      expect(screen.getByTestId('SLOT_STATUS_1')).toHaveTextContent('idle');
    });

    it('VALID: {slots: [running with step]} => renders step text for slot', () => {
      SlotGridWidgetProxy();

      const slots = [
        OrchestrationSlotStub({
          slotId: 0 as never,
          status: 'running',
          step: 'Create user model' as never,
        }),
      ];

      mantineRenderAdapter({ ui: <SlotGridWidget slots={slots} /> });

      expect(screen.getByTestId('SLOT_STEP_0')).toHaveTextContent('Create user model');
    });

    it('VALID: {slots: [idle without step]} => does not render step text', () => {
      SlotGridWidgetProxy();

      const slots = [OrchestrationSlotStub({ slotId: 0 as never, status: 'idle' })];

      mantineRenderAdapter({ ui: <SlotGridWidget slots={slots} /> });

      expect(screen.queryByTestId('SLOT_STEP_0')).toBeNull();
    });

    it('VALID: {slots: [running]} => renders slot ID label', () => {
      SlotGridWidgetProxy();

      const slots = [OrchestrationSlotStub({ slotId: 2 as never, status: 'running' })];

      mantineRenderAdapter({ ui: <SlotGridWidget slots={slots} /> });

      expect(screen.getByTestId('SLOT_ID_2')).toHaveTextContent('Slot 2');
    });
  });

  describe('empty state', () => {
    it('EMPTY: {slots: []} => renders empty state message', () => {
      SlotGridWidgetProxy();

      mantineRenderAdapter({ ui: <SlotGridWidget slots={[]} /> });

      expect(screen.getByTestId('SLOT_GRID_EMPTY')).toHaveTextContent('No active slots');
    });
  });
});
