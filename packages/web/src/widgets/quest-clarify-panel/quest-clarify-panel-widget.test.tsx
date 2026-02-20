import { AskUserQuestionStub } from '../../contracts/ask-user-question/ask-user-question.stub';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestClarifyPanelWidget } from './quest-clarify-panel-widget';
import { QuestClarifyPanelWidgetProxy } from './quest-clarify-panel-widget.proxy';

describe('QuestClarifyPanelWidget', () => {
  describe('rendering', () => {
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
      const onSelectOption = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSelectOption={onSelectOption}
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
      const onSelectOption = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSelectOption={onSelectOption}
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
      const onSelectOption = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={parsed.questions[0]!.question}
            onSelectOption={onSelectOption}
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
    it('VALID: {click option} => calls onSelectOption with option label', async () => {
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
      const onSelectOption = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSelectOption={onSelectOption}
          />
        ),
      });

      await proxy.clickOption({ label: secondOption.label });

      expect(onSelectOption).toHaveBeenCalledTimes(1);
      expect(onSelectOption).toHaveBeenCalledWith({ label: secondOption.label });
    });
  });

  describe('freeform input', () => {
    it('VALID: {click Other then type and submit} => calls onSelectOption with freeform text', async () => {
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
      const onSelectOption = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestClarifyPanelWidget
            questions={parsed.questions}
            questTitle={firstQuestion.question}
            onSelectOption={onSelectOption}
          />
        ),
      });

      await proxy.clickOther();
      await proxy.typeFreeform({ text: 'Custom answer' as never });
      await proxy.submitFreeform();

      expect(onSelectOption).toHaveBeenCalledTimes(1);
    });
  });
});
