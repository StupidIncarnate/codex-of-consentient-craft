import { waitFor } from '#gateway/npm/testing-library__react';

import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts/ask-user-question/ask-user-question.stub';
import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { QuestClarifyPanelWidget } from './quest-clarify-panel-widget';
import { QuestClarifyPanelWidgetProxy } from './quest-clarify-panel-widget.proxy';

describe('QuestClarifyPanelWidget', () => {
  describe('rendering', () => {
    it('VALID: {questTitle} => renders quest title', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
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

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={'Build Login Feature' as never}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      expect(proxy.getQuestionText()).toBe('Which DB?');
    });

    it('VALID: {2 questions} => renders counter "Question 1 of 2" and the option labels', () => {
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
          {
            question: 'Second question?',
            header: 'Q2',
            options: [{ label: 'No', description: 'Disagree' }],
            multiSelect: false,
          },
        ],
      });

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      expect({ counter: proxy.getCounter(), labels: proxy.getOptionLabels() }).toStrictEqual({
        counter: 'Question 1 of 2',
        labels: ['ReactUI library', 'VueProgressive framework'],
      });
    });
  });

  describe('multiSelect question', () => {
    it('VALID: {Letters multiSelect, first render} => three unchecked checkboxes, one per card', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
              { label: 'Gamma', description: 'G' },
            ],
            multiSelect: true,
          },
        ],
      });

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      expect({
        checkboxes: proxy.getCheckboxCount(),
        options: proxy.getOptionCount(),
        checked: proxy.getCheckedLabels(),
      }).toStrictEqual({ checkboxes: 3, options: 3, checked: [] });
    });

    it('VALID: {click Alpha} => Alpha is checked, nothing advances and nothing is submitted', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
              { label: 'Gamma', description: 'G' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which size?',
            header: 'Size',
            options: [
              { label: 'Small', description: 'S' },
              { label: 'Large', description: 'L' },
            ],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });

      expect({
        checked: proxy.getCheckedLabels(),
        counter: proxy.getCounter(),
        questionText: proxy.getQuestionText(),
        submitCalls: onSubmitAnswers.mock.calls,
      }).toStrictEqual({
        checked: ['Alpha'],
        counter: 'Question 1 of 2',
        questionText: 'Which letters?',
        submitCalls: [],
      });
    });

    it('VALID: {click Alpha then Gamma} => Alpha and Gamma stay checked together and Beta is unchecked', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
              { label: 'Gamma', description: 'G' },
            ],
            multiSelect: true,
          },
        ],
      });

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });
      await proxy.clickOption({ label: 'Gamma' as never });

      expect(proxy.getCheckedLabels()).toStrictEqual(['Alpha', 'Gamma']);
    });

    it('VALID: {click Alpha twice} => Alpha is unchecked again and the counter is unchanged', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which size?',
            header: 'Size',
            options: [{ label: 'Small', description: 'S' }],
            multiSelect: false,
          },
        ],
      });

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });
      await proxy.clickOption({ label: 'Alpha' as never });

      expect({ checked: proxy.getCheckedLabels(), counter: proxy.getCounter() }).toStrictEqual({
        checked: [],
        counter: 'Question 1 of 2',
      });
    });

    it('VALID: {Gamma then Alpha checked, click send} => advances to question 2, which has no checkboxes, and submits labels in option order', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
              { label: 'Gamma', description: 'G' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which size?',
            header: 'Size',
            options: [
              { label: 'Small', description: 'S' },
              { label: 'Large', description: 'L' },
            ],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: 'Gamma' as never });
      await proxy.clickOption({ label: 'Alpha' as never });
      proxy.clickComposerSend();

      expect({
        counter: proxy.getCounter(),
        questionText: proxy.getQuestionText(),
        checkboxes: proxy.getCheckboxCount(),
        options: proxy.getOptionCount(),
        submitCalls: onSubmitAnswers.mock.calls,
      }).toStrictEqual({
        counter: 'Question 2 of 2',
        questionText: 'Which size?',
        checkboxes: 0,
        options: 2,
        submitCalls: [],
      });

      await proxy.clickOption({ label: 'Small' as never });

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [
          {
            answers: [
              { question: parsed.questions[0], labels: ['Alpha', 'Gamma'] },
              { question: parsed.questions[1], labels: ['Small'] },
            ],
          },
        ],
      ]);
    });

    it('VALID: {Alpha and Gamma checked, Enter in composer} => advances to question 2 and records both labels with no text key', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
              { label: 'Gamma', description: 'G' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which size?',
            header: 'Size',
            options: [{ label: 'Small', description: 'S' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });
      await proxy.clickOption({ label: 'Gamma' as never });
      proxy.pressEnterInComposer();

      expect(proxy.getCounter()).toBe('Question 2 of 2');

      await proxy.clickOption({ label: 'Small' as never });

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [
          {
            answers: [
              { question: parsed.questions[0], labels: ['Alpha', 'Gamma'] },
              { question: parsed.questions[1], labels: ['Small'] },
            ],
          },
        ],
      ]);
    });

    it('VALID: {Alpha checked, text typed, send} => the answer carries labels and the trimmed text', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
            ],
            multiSelect: true,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });
      proxy.typeInComposer({ text: '  prefer Alpha  ' });
      proxy.clickComposerSend();

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [{ answers: [{ question: parsed.questions[0], labels: ['Alpha'], text: 'prefer Alpha' }] }],
      ]);
    });

    it('EMPTY: {nothing checked, whitespace in composer, click send} => records no answer and the counter stays on question 1', () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which size?',
            header: 'Size',
            options: [{ label: 'Small', description: 'S' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      proxy.typeInComposer({ text: '   ' });
      proxy.clickComposerSend();

      expect({
        counter: proxy.getCounter(),
        submitCalls: onSubmitAnswers.mock.calls,
      }).toStrictEqual({ counter: 'Question 1 of 2', submitCalls: [] });
    });

    it('VALID: {question 1 sent with text and a pasted image} => question 2 starts with an empty composer, no thumbnail and nothing checked, and the answer keeps the text and image', async () => {
      const proxy = QuestClarifyPanelWidgetProxy();
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which letters?',
            header: 'Letters',
            options: [
              { label: 'Alpha', description: 'A' },
              { label: 'Beta', description: 'B' },
            ],
            multiSelect: true,
          },
          {
            question: 'Which letters again?',
            header: 'Letters2',
            options: [
              { label: 'Delta', description: 'D' },
              { label: 'Epsilon', description: 'E' },
            ],
            multiSelect: true,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: 'Alpha' as never });
      proxy.typeInComposer({ text: 'prefer Gamma' });
      proxy.pasteImageInComposer({
        mediaType: 'image/png',
        bytes: new Uint8Array([137, 80, 78, 71]),
        attachment: ComposerAttachmentStub({
          attachmentId: 'c0000000-0000-4000-8000-000000000001',
        }),
      });

      await waitFor(() => {
        expect(proxy.hasComposerThumbnail()).toBe(true);
      });

      proxy.clickComposerSend();

      expect({
        counter: proxy.getCounter(),
        composerText: proxy.getComposerText(),
        thumbnail: proxy.hasComposerThumbnail(),
        checked: proxy.getCheckedLabels(),
      }).toStrictEqual({
        counter: 'Question 2 of 2',
        composerText: '',
        thumbnail: false,
        checked: [],
      });

      await proxy.clickOption({ label: 'Delta' as never });
      proxy.pressEnterInComposer();

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [
          {
            answers: [
              {
                question: parsed.questions[0],
                labels: ['Alpha'],
                text: 'prefer Gamma[Pasted Image 1]',
                images: [{ dataBase64: 'iVBORw==', mediaType: 'image/png' }],
              },
              { question: parsed.questions[1], labels: ['Delta'] },
            ],
          },
        ],
      ]);
    });
  });

  describe('single-select question', () => {
    it('VALID: {single question, click option} => commits that label alone and submits', async () => {
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
      const onSubmitAnswers = jest.fn();

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: firstQuestion.options[1]!.label });

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [{ answers: [{ question: firstQuestion, labels: ['Beta'] }] }],
      ]);
    });

    it('VALID: {2 questions, click first option} => advances without submitting', async () => {
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

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      await proxy.clickOption({ label: parsed.questions[0]!.options[0]!.label });

      expect({
        submitCalls: onSubmitAnswers.mock.calls,
        counter: proxy.getCounter(),
        questionText: proxy.getQuestionText(),
      }).toStrictEqual({
        submitCalls: [],
        counter: 'Question 2 of 2',
        questionText: 'Second question?',
      });
    });

    it('VALID: {typed text, Enter, nothing to check} => commits no labels and the text', () => {
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

      mantineRenderMiddleware({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      proxy.typeInComposer({ text: 'Custom answer' });
      proxy.pressEnterInComposer();

      expect(onSubmitAnswers.mock.calls).toStrictEqual([
        [{ answers: [{ question: firstQuestion, labels: [], text: 'Custom answer' }] }],
      ]);
    });
  });
});
