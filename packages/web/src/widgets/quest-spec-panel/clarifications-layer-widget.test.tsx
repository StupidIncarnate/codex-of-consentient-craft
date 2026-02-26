import { screen } from '@testing-library/react';

import { QuestClarificationStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ClarificationsLayerWidget } from './clarifications-layer-widget';
import { ClarificationsLayerWidgetProxy } from './clarifications-layer-widget.proxy';

type QuestClarification = ReturnType<typeof QuestClarificationStub>;

describe('ClarificationsLayerWidget', () => {
  describe('read mode', () => {
    it('VALID: {clarifications: [clarification]} => renders question text', () => {
      ClarificationsLayerWidgetProxy();
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Design Choice',
            options: [
              { label: 'Option A', description: 'First approach' },
              { label: 'Option B', description: 'Second approach' },
            ],
            multiSelect: false,
          },
        ] as never,
      });

      mantineRenderAdapter({
        ui: <ClarificationsLayerWidget clarifications={[clarification]} />,
      });

      expect(screen.getByTestId('CLARIFICATION_QUESTION').textContent).toBe(
        'Which approach do you prefer?',
      );
    });

    it('VALID: {clarifications: [clarification]} => renders answer', () => {
      ClarificationsLayerWidgetProxy();
      const clarification = QuestClarificationStub({ answer: 'Option A' as never });

      mantineRenderAdapter({
        ui: <ClarificationsLayerWidget clarifications={[clarification]} />,
      });

      expect(screen.getByTestId('CLARIFICATION_ANSWER').textContent).toBe('Option A');
    });

    it('VALID: {clarifications: [clarification]} => renders timestamp', () => {
      ClarificationsLayerWidgetProxy();
      const clarification = QuestClarificationStub({
        timestamp: '2024-01-15T10:00:00.000Z' as never,
      });

      mantineRenderAdapter({
        ui: <ClarificationsLayerWidget clarifications={[clarification]} />,
      });

      expect(screen.getByTestId('CLARIFICATION_TIMESTAMP').textContent).toBe(
        '2024-01-15T10:00:00.000Z',
      );
    });

    it('VALID: {clarifications: [clarification with multiple questions]} => renders all questions', () => {
      ClarificationsLayerWidgetProxy();
      const clarification = QuestClarificationStub({
        questions: [
          {
            question: 'First question?',
            header: 'Q1',
            options: [{ label: 'A', description: 'a' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Q2',
            options: [{ label: 'B', description: 'b' }],
            multiSelect: false,
          },
        ] as never,
      });

      mantineRenderAdapter({
        ui: <ClarificationsLayerWidget clarifications={[clarification]} />,
      });

      const questions = screen.getAllByTestId('CLARIFICATION_QUESTION');

      expect(questions[0]?.textContent).toBe('First question?');
      expect(questions[1]?.textContent).toBe('Second question?');
    });

    it('EMPTY: {clarifications: []} => renders section with CLARIFICATIONS header', () => {
      ClarificationsLayerWidgetProxy();
      const clarifications: QuestClarification[] = [];

      mantineRenderAdapter({
        ui: <ClarificationsLayerWidget clarifications={clarifications} />,
      });

      expect(screen.getByText('CLARIFICATIONS')).toBeInTheDocument();
    });
  });
});
