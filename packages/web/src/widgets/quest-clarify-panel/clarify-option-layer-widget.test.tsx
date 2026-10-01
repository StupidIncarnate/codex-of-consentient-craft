import { screen } from '#gateway/npm/testing-library__react';

import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts/ask-user-question/ask-user-question.stub';
import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
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

      mantineRenderMiddleware({
        ui: (
          <ClarifyOptionLayerWidget
            option={option}
            multiSelect={false}
            checked={false}
            onSelect={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CLARIFY_OPTION').textContent).toBe('ReactUI library');
    });
  });

  describe('checkbox', () => {
    it('VALID: {multiSelect: true, checked: false} => renders one unchecked checkbox', () => {
      const proxy = ClarifyOptionLayerWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick letters',
            header: 'Letters',
            options: [{ label: 'Alpha', description: 'First' }],
            multiSelect: true,
          },
        ],
      });
      const option = parsed.questions[0]!.options[0]!;

      mantineRenderMiddleware({
        ui: (
          <ClarifyOptionLayerWidget
            option={option}
            multiSelect={true}
            checked={false}
            onSelect={jest.fn()}
          />
        ),
      });

      expect({ hasCheckbox: proxy.hasCheckbox(), isChecked: proxy.isChecked() }).toStrictEqual({
        hasCheckbox: true,
        isChecked: false,
      });
    });

    it('VALID: {multiSelect: true, checked: true} => renders a checked checkbox', () => {
      const proxy = ClarifyOptionLayerWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick letters',
            header: 'Letters',
            options: [{ label: 'Alpha', description: 'First' }],
            multiSelect: true,
          },
        ],
      });
      const option = parsed.questions[0]!.options[0]!;

      mantineRenderMiddleware({
        ui: (
          <ClarifyOptionLayerWidget
            option={option}
            multiSelect={true}
            checked={true}
            onSelect={jest.fn()}
          />
        ),
      });

      expect({ hasCheckbox: proxy.hasCheckbox(), isChecked: proxy.isChecked() }).toStrictEqual({
        hasCheckbox: true,
        isChecked: true,
      });
    });

    it('VALID: {multiSelect: false} => renders no checkbox', () => {
      const proxy = ClarifyOptionLayerWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick a size',
            header: 'Size',
            options: [{ label: 'Small', description: 'Little' }],
            multiSelect: false,
          },
        ],
      });
      const option = parsed.questions[0]!.options[0]!;

      mantineRenderMiddleware({
        ui: (
          <ClarifyOptionLayerWidget
            option={option}
            multiSelect={false}
            checked={false}
            onSelect={jest.fn()}
          />
        ),
      });

      expect(proxy.hasCheckbox()).toBe(false);
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

      mantineRenderMiddleware({
        ui: (
          <ClarifyOptionLayerWidget
            option={option}
            multiSelect={false}
            checked={false}
            onSelect={onSelect}
          />
        ),
      });

      await proxy.clickOption();

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ label: option.label });
    });
  });
});
