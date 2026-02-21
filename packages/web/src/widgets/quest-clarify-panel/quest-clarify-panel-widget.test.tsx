import { screen } from '@testing-library/react';

import { AskUserQuestionStub } from '../../contracts/ask-user-question/ask-user-question.stub';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestClarifyPanelWidget } from './quest-clarify-panel-widget';
import { QuestClarifyPanelWidgetProxy } from './quest-clarify-panel-widget.proxy';

describe('QuestClarifyPanelWidget', () => {
  describe('rendering', () => {
    it('VALID: {questTitle} => renders quest title', () => {
      QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which DB?',
            header: 'DB',
            options: [{ label: 'Postgres', description: 'SQL DB' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={'Build Login Feature' as never}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(screen.getByTestId('CLARIFY_QUEST_TITLE').textContent).toBe('Build Login Feature');
    });

    it('VALID: {questions with text} => renders question text', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which database do you prefer?',
            header: 'DB Choice',
            options: [{ label: 'PostgreSQL', description: 'Relational DB' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(proxy.getQuestionText()).toBe('Which database do you prefer?');
    });

    it('VALID: {2 questions} => renders counter "Question 1 of 2"', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'First question?',
            header: 'Q1',
            options: [{ label: 'Yes', description: 'Agree' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Q2',
            options: [{ label: 'No', description: 'Disagree' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(proxy.getCounter()).toBe('Question 1 of 2');
    });

    it('VALID: {question with 2 options} => renders all option labels', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick a framework',
            header: 'Framework',
            options: [
              { label: 'React', description: 'UI library' },
              { label: 'Vue', description: 'Progressive framework' },
            ],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(proxy.getOptionLabels()).toStrictEqual([
        'ReactUI library',
        'VueProgressive framework',
      ]);
    });
  });

  describe('option selection', () => {
    it('VALID: {single question, click option} => calls onSubmitAnswers with answer', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Pick one',
            header: 'Choice',
            options: [
              { label: 'Alpha', description: 'First' },
              { label: 'Beta', description: 'Second' },
            ],
            multiSelect: false,
          },
        ],
      });
      const firstQuestion = parsed.questions[0]!;
      const secondOption = firstQuestion.options[1]!;
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: secondOption.label });

      expect(onSubmitAnswers).toHaveBeenCalledTimes(1);
      expect(onSubmitAnswers).toHaveBeenCalledWith({
        answers: [
          {
            header: firstQuestion.header,
            question: firstQuestion.question,
            label: secondOption.label,
          },
        ],
      });
    });

    it('VALID: {2 questions, click first option} => does not submit yet', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'First question?',
            header: 'Q1',
            options: [{ label: 'Yes', description: 'Agree' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Q2',
            options: [{ label: 'No', description: 'Disagree' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: parsed.questions[0]!.options[0]!.label });

      expect(onSubmitAnswers).not.toHaveBeenCalled();
      expect(proxy.getCounter()).toBe('Question 2 of 2');
      expect(proxy.getQuestionText()).toBe('Second question?');
    });

    it('VALID: {2 questions, click both options} => submits all answers', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'First question?',
            header: 'Q1',
            options: [{ label: 'Yes', description: 'Agree' }],
            multiSelect: false,
          },
          {
            question: 'Second question?',
            header: 'Q2',
            options: [{ label: 'No', description: 'Disagree' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: parsed.questions[0]!.options[0]!.label });
      await proxy.clickOption({ label: parsed.questions[1]!.options[0]!.label });

      expect(onSubmitAnswers).toHaveBeenCalledTimes(1);
      expect(onSubmitAnswers).toHaveBeenCalledWith({
        answers: [
          {
            header: parsed.questions[0]!.header,
            question: parsed.questions[0]!.question,
            label: parsed.questions[0]!.options[0]!.label,
          },
          {
            header: parsed.questions[1]!.header,
            question: parsed.questions[1]!.question,
            label: parsed.questions[1]!.options[0]!.label,
          },
        ],
      });
    });
  });

  describe('freeform input', () => {
    it('VALID: {click Other then type and submit} => calls onSubmitAnswers with freeform text', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Any preference?',
            header: 'Pref',
            options: [{ label: 'Default', description: 'Standard option' }],
            multiSelect: false,
          },
        ],
      });
      const firstQuestion = parsed.questions[0]!;
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOther();
      await proxy.typeFreeform({ text: 'Custom answer' as never });
      await proxy.submitFreeform();

      expect(onSubmitAnswers).toHaveBeenCalledTimes(1);
    });

    it('EDGE: {click Other then submit without typing} => does not call onSubmitAnswers', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Any preference?',
            header: 'Pref',
            options: [{ label: 'Default', description: 'Standard option' }],
            multiSelect: false,
          },
        ],
      });
      const firstQuestion = parsed.questions[0]!;
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOther();
      await proxy.submitFreeform();

      expect(onSubmitAnswers).not.toHaveBeenCalled();
    });
  });
});
