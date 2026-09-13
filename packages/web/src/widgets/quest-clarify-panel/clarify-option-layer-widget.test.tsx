import { screen } from '@testing-library/react';

import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ClarifyOptionLayerWidget } from './clarify-option-layer-widget';
import { ClarifyOptionLayerWidgetProxy } from './clarify-option-layer-widget.proxy';

describe('ClarifyOptionLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {option} => renders label and description', () => {
      ClarifyOptionLayerWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick a framework',
            header: 'Framework',
            options: [{ label: 'React', description: 'UI library' }],
            multiSelect: false,
          },
        ],
      });
      const option = parsed.questions[0]!.options[0]!;

      mantineRenderAdapter({
        ui: <ClarifyOptionLayerWidget option={option} onSelect={jest.fn()} />,
      });

      expect(screen.getByTestId('CLARIFY_OPTION').textContent).toBe('ReactUI library');
    });
  });

  describe('selection', () => {
    it('VALID: {click} => calls onSelect once with the option label', async () => {
      const proxy = ClarifyOptionLayerWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick a framework',
            header: 'Framework',
            options: [{ label: 'Vue', description: 'Progressive framework' }],
            multiSelect: false,
          },
        ],
      });
      const option = parsed.questions[0]!.options[0]!;
      const onSelect = jest.fn();

      mantineRenderAdapter({
        ui: <ClarifyOptionLayerWidget option={option} onSelect={onSelect} />,
      });

      await proxy.clickOption();

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ label: option.label });
    });
  });
});
