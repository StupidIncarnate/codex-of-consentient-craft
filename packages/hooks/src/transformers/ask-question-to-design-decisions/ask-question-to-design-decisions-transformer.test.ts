import { AskUserQuestionStub, AskUserQuestionResponseStub } from '@dungeonmaster/shared/contracts';
import { askQuestionToDesignDecisionsTransformer } from './ask-question-to-design-decisions-transformer';

describe('askQuestionToDesignDecisionsTransformer', () => {
  describe('single-select answer', () => {
    it('VALID: {header present, string answer} => returns DesignDecision with header-based id', () => {
      const response = AskUserQuestionResponseStub({
        questions: [
          {
            question: 'Which naming style do you prefer?',
            header: 'Naming Style',
            options: [{ label: 'Smart title case', description: 'Capitalize important words' }],
            multiSelect: false,
          },
        ],
        answers: { 'Which naming style do you prefer?': 'Smart title case' },
      });

      const result = askQuestionToDesignDecisionsTransformer({
        toolInput: { questions: response.questions },
        answers: response.answers,
        nowMs: 500,
      });

      expect(result).toStrictEqual([
        {
          id: 'naming-style-500',
          title: 'Which naming style do you prefer?',
          rationale: 'Smart title case',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('multi-select answer', () => {
    it('VALID: {multi-select string[] answer} => joins rationale with ", "', () => {
      const response = AskUserQuestionResponseStub({
        questions: [
          {
            question: 'Which packages are affected?',
            header: 'Packages',
            options: [
              { label: 'hooks', description: 'Hooks package' },
              { label: 'shared', description: 'Shared package' },
            ],
            multiSelect: true,
          },
        ],
        answers: { 'Which packages are affected?': ['hooks', 'shared'] },
      });

      const result = askQuestionToDesignDecisionsTransformer({
        toolInput: { questions: response.questions },
        answers: response.answers,
        nowMs: 99,
      });

      expect(result).toStrictEqual([
        {
          id: 'packages-99',
          title: 'Which packages are affected?',
          rationale: 'hooks, shared',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('empty header falls back to question text for id', () => {
    it('VALID: {empty header} => uses question text slug as id prefix', () => {
      const response = AskUserQuestionResponseStub({
        questions: [
          {
            question: 'What is the primary goal?',
            header: '',
            options: [{ label: 'Performance', description: 'Optimize for speed' }],
            multiSelect: false,
          },
        ],
        answers: { 'What is the primary goal?': 'Performance' },
      });

      const result = askQuestionToDesignDecisionsTransformer({
        toolInput: { questions: response.questions },
        answers: response.answers,
        nowMs: 7,
      });

      expect(result).toStrictEqual([
        {
          id: 'what-is-the-primary-goal-7',
          title: 'What is the primary goal?',
          rationale: 'Performance',
          relatedNodeIds: [],
        },
      ]);
    });
  });

  describe('answer not present in responses', () => {
    it('EMPTY: {question key missing from answers} => returns empty array', () => {
      const toolInput = AskUserQuestionStub({
        questions: [
          {
            question: 'Which naming style do you prefer?',
            header: 'Naming Style',
            options: [{ label: 'Smart title case', description: 'Capitalize important words' }],
            multiSelect: false,
          },
        ],
      });
      const emptyAnswers = AskUserQuestionResponseStub({
        questions: [
          {
            question: 'Unrelated question?',
            header: 'Other',
            options: [{ label: 'X', description: 'Other option' }],
            multiSelect: false,
          },
        ],
        answers: { 'Unrelated question?': 'X' },
      }).answers;

      const result = askQuestionToDesignDecisionsTransformer({
        toolInput,
        answers: emptyAnswers,
        nowMs: 1,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid tool_input shape', () => {
    it('INVALID: {non-AskUserQuestion tool_input} => returns empty array', () => {
      const stubResponse = AskUserQuestionResponseStub();

      const result = askQuestionToDesignDecisionsTransformer({
        toolInput: { file_path: '/some/file.ts', content: 'code' },
        answers: stubResponse.answers,
        nowMs: 1,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
