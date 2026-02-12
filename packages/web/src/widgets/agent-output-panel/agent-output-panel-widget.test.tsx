import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { AgentOutputPanelWidget } from './agent-output-panel-widget';
import { AgentOutputPanelWidgetProxy } from './agent-output-panel-widget.proxy';

type SlotId = Parameters<typeof AgentOutputPanelWidget>[0]['slotIndex'];

describe('AgentOutputPanelWidget', () => {
  describe('line rendering', () => {
    it('VALID: {slotIndex: 0, lines: [2 lines]} => renders output lines', () => {
      AgentOutputPanelWidgetProxy();

      const lines = [
        AgentOutputLineStub({ value: 'Compiling...' }),
        AgentOutputLineStub({ value: 'Done.' }),
      ];

      mantineRenderAdapter({
        ui: <AgentOutputPanelWidget slotIndex={0 as SlotId} lines={lines} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_LINE_0_0')).toHaveTextContent('Compiling...');
      expect(screen.getByTestId('AGENT_OUTPUT_LINE_0_1')).toHaveTextContent('Done.');
    });

    it('VALID: {slotIndex: 2} => renders slot number in header', () => {
      AgentOutputPanelWidgetProxy();

      const lines = [AgentOutputLineStub({ value: 'Working...' })];

      mantineRenderAdapter({
        ui: <AgentOutputPanelWidget slotIndex={2 as SlotId} lines={lines} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_HEADER_2')).toHaveTextContent('Slot 2');
    });

    it('VALID: {lines: []} => renders panel with zero line count', () => {
      AgentOutputPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <AgentOutputPanelWidget slotIndex={0 as SlotId} lines={[]} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_LINE_COUNT_0')).toHaveTextContent('0 / 500');
    });
  });

  describe('line count warning', () => {
    it('VALID: {lines: 10 lines} => renders line count without warning color', () => {
      AgentOutputPanelWidgetProxy();

      const lines = Array.from({ length: 10 }, (_, i) =>
        AgentOutputLineStub({ value: `Line ${String(i)}` }),
      );

      mantineRenderAdapter({
        ui: <AgentOutputPanelWidget slotIndex={0 as SlotId} lines={lines} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_LINE_COUNT_0')).toHaveTextContent('10 / 500');
    });

    it('EDGE: {lines: 400 lines} => renders line count with warning color', () => {
      AgentOutputPanelWidgetProxy();

      const lines = Array.from({ length: 400 }, (_, i) =>
        AgentOutputLineStub({ value: `Line ${String(i)}` }),
      );

      mantineRenderAdapter({
        ui: <AgentOutputPanelWidget slotIndex={0 as SlotId} lines={lines} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_LINE_COUNT_0')).toHaveTextContent('400 / 500');
    });
  });
});
