/**
 * PURPOSE: Renders a clarification panel showing questions with selectable options for quest
 * clarification. Owns question-advancement, checked-option and answer-collection state. A
 * single-select card click commits at once; a multiSelect card click only toggles its checkbox, and
 * the composer below the cards commits the checked labels plus any typed text and pasted images.
 *
 * USAGE:
 * <QuestClarifyPanelWidget questions={questions} questTitle={questTitle} onSubmitAnswers={handleSubmit} />
 * // Renders question text, option cards and the answer composer; onSubmitAnswers fires on the last question and a rejection keeps the panel open with its error shown
 */

import { useCallback, useState } from '#gateway/npm/react';

import { Group, Stack, Text } from '#gateway/npm/mantine__core';

import type {
  AskUserQuestionItem,
  AskUserQuestionOption,
  PastedImageUpload,
} from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatComposerWidget } from '../chat-composer/chat-composer-widget';
import { ClarifyOptionLayerWidget } from './clarify-option-layer-widget';

// Own ids, not the chat panel's CHAT_INPUT / SEND_BUTTON: both composers are on screen at once.
const COMPOSER_TEST_IDS = {
  editor: 'CLARIFY_COMPOSER',
  placeholder: 'CLARIFY_COMPOSER_PLACEHOLDER',
  sendButton: 'CLARIFY_SEND_BUTTON',
};

// Holds the whole question rather than flattening `header` + `question` off it, so this type
// never indexes AskUserQuestionItem twice. Read `.question.header` / `.question.question` at
// call sites instead of carrying two separately-typed copies of the same source object.
export interface ClarifyAnswer {
  question: AskUserQuestionItem;
  labels: AskUserQuestionOption['label'][];
  text?: string;
  images?: readonly PastedImageUpload[];
}

export const QuestClarifyPanelWidget = ({
  questions,
  questTitle,
  onSubmitAnswers,
}: {
  questions: AskUserQuestionItem[];
  questTitle: AskUserQuestionItem['question'];
  onSubmitAnswers: (params: { answers: ClarifyAnswer[] }) => Promise<void>;
}): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<ClarifyAnswer[]>([]);
  const [checkedLabels, setCheckedLabels] = useState<AskUserQuestionOption['label'][]>([]);
  const [sendError, setSendError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isMultiSelect = currentQuestion?.multiSelect === true;

  const reportSendFailure = useCallback((error: unknown): void => {
    setSendError(error instanceof Error ? error.message : String(error));
  }, []);

  // The last question's commit writes neither collectedAnswers nor the question index, so a
  // rejected send leaves the whole set in place and a resend rebuilds the same one.
  const commitAnswer = useCallback(
    async ({ answer }: { answer: ClarifyAnswer }): Promise<void> => {
      const updated = [...collectedAnswers, answer];
      if (currentQuestionIndex < questions.length - 1) {
        setCollectedAnswers(updated);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCheckedLabels([]);
        return Promise.resolve();
      }
      setSendError(null);
      return onSubmitAnswers({ answers: updated });
    },
    [collectedAnswers, currentQuestionIndex, questions.length, onSubmitAnswers],
  );

  return (
    <Stack gap={0} data-testid="QUEST_CLARIFY_PANEL" style={{ flexShrink: 0 }}>
      <Text
        data-testid="CLARIFY_QUEST_TITLE"
        ff="monospace"
        size="xs"
        fw={600}
        px="sm"
        py={6}
        style={{
          color: colors.text,
          backgroundColor: colors['bg-raised'],
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {questTitle}
      </Text>
      <Stack gap="md" p={12}>
        <Group justify="space-between">
          <Text ff="monospace" size="xs" fw={600} style={{ color: colors.primary }}>
            CLARIFICATION
          </Text>
          <Text
            data-testid="CLARIFY_COUNTER"
            ff="monospace"
            size="xs"
            style={{ color: colors['text-dim'] }}
          >
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </Group>
        <Text
          data-testid="CLARIFY_QUESTION_TEXT"
          ff="monospace"
          size="sm"
          style={{ color: colors.text }}
        >
          {currentQuestion?.question}
        </Text>
        <Stack gap={6}>
          {currentQuestion?.options.map((opt) => (
            <ClarifyOptionLayerWidget
              key={opt.label}
              option={opt}
              multiSelect={isMultiSelect}
              checked={checkedLabels.includes(opt.label)}
              onSelect={({ label }): void => {
                if (isMultiSelect) {
                  setCheckedLabels(
                    checkedLabels.includes(label)
                      ? checkedLabels.filter((checked) => checked !== label)
                      : [...checkedLabels, label],
                  );
                  return;
                }
                commitAnswer({ answer: { question: currentQuestion, labels: [label] } }).catch(
                  reportSendFailure,
                );
              }}
            />
          ))}
        </Stack>
        {sendError === null ? null : (
          <Text
            data-testid="CLARIFY_SEND_ERROR"
            ff="monospace"
            size="xs"
            style={{ color: colors.danger }}
          >
            {sendError}
          </Text>
        )}
        {currentQuestion ? (
          <ChatComposerWidget
            key={currentQuestionIndex}
            placeholder="Type an answer..."
            hasSelection={checkedLabels.length > 0}
            testIds={COMPOSER_TEST_IDS}
            onSubmit={async ({ text, images }): Promise<void> => {
              // Option order, not click order, so the labels a send carries are stable.
              const labels = currentQuestion.options
                .map((opt) => opt.label)
                .filter((label) => checkedLabels.includes(label));
              // A rejection reaches the composer too, which then keeps its text and thumbnails.
              return commitAnswer({
                answer: {
                  question: currentQuestion,
                  labels,
                  ...(text.length > 0 ? { text } : {}),
                  ...(images.length > 0 ? { images } : {}),
                },
              }).catch((error: unknown) => {
                reportSendFailure(error);
                throw error;
              });
            }}
          />
        ) : null}
      </Stack>
    </Stack>
  );
};
