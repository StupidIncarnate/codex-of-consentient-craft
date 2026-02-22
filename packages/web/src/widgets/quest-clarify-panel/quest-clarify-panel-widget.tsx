/**
 * PURPOSE: Renders a clarification panel showing questions with selectable options for quest clarification
 *
 * USAGE:
 * <QuestClarifyPanelWidget questions={questions} questTitle={questTitle} onSelectOption={handleSelect} />
 * // Renders question text, option buttons, and "Other..." freeform input
 */

import { useState } from 'react';

import { Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type {
  AskUserQuestionItem,
  AskUserQuestionOption,
} from '../../contracts/ask-user-question/ask-user-question-contract';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const OPTION_FONT_SIZE = 12;
const OPTION_BORDER_RADIUS = 2;
const OPTION_PADDING_Y = 8;

export interface ClarifyAnswer {
  header: AskUserQuestionItem['header'];
  question: AskUserQuestionItem['question'];
  label: AskUserQuestionOption['label'];
}

export const QuestClarifyPanelWidget = ({
  questions,
  questTitle,
  onSubmitAnswers,
}: {
  questions: AskUserQuestionItem[];
  questTitle: AskUserQuestionItem['question'];
  onSubmitAnswers: (params: { answers: ClarifyAnswer[] }) => void;
}): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<ClarifyAnswer[]>([]);
  const [showFreeform, setShowFreeform] = useState(false);
  const [freeformValue, setFreeformValue] = useState('' as FormInputValue);

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Stack gap={0} data-testid="QUEST_CLARIFY_PANEL" style={{ height: '100%' }}>
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
            <UnstyledButton
              key={opt.label}
              data-testid="CLARIFY_OPTION"
              px="sm"
              py={OPTION_PADDING_Y}
              onClick={(): void => {
                const updated = [
                  ...collectedAnswers,
                  {
                    header: currentQuestion.header,
                    question: currentQuestion.question,
                    label: opt.label,
                  },
                ];
                if (currentQuestionIndex < questions.length - 1) {
                  setCollectedAnswers(updated);
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setShowFreeform(false);
                  setFreeformValue('' as FormInputValue);
                } else {
                  onSubmitAnswers({ answers: updated });
                }
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: OPTION_FONT_SIZE,
                color: colors.text,
                backgroundColor: colors['bg-raised'],
                border: `1px solid ${colors.border}`,
                borderRadius: OPTION_BORDER_RADIUS,
                textAlign: 'left' as const,
              }}
            >
              <Text ff="monospace" size="xs" fw={600} style={{ color: colors['loot-gold'] }}>
                {opt.label}
              </Text>
              <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
                {opt.description}
              </Text>
            </UnstyledButton>
          ))}
          {showFreeform ? (
            <Stack data-testid="CLARIFY_FREEFORM" gap={6}>
              <FormInputWidget
                value={freeformValue}
                onChange={(value: FormInputValue): void => {
                  setFreeformValue(value);
                }}
                placeholder={'Type your answer...' as FormPlaceholder}
              />
              <PixelBtnWidget
                label={'Send' as ButtonLabel}
                onClick={(): void => {
                  if (freeformValue.length > 0 && currentQuestion) {
                    const freeLabel = freeformValue as unknown as AskUserQuestionOption['label'];
                    const updated = [
                      ...collectedAnswers,
                      {
                        header: currentQuestion.header,
                        question: currentQuestion.question,
                        label: freeLabel,
                      },
                    ];
                    if (currentQuestionIndex < questions.length - 1) {
                      setCollectedAnswers(updated);
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                      setShowFreeform(false);
                      setFreeformValue('' as FormInputValue);
                    } else {
                      onSubmitAnswers({ answers: updated });
                    }
                  }
                }}
              />
            </Stack>
          ) : (
            <UnstyledButton
              data-testid="CLARIFY_OTHER_BTN"
              px="sm"
              py={OPTION_PADDING_Y}
              onClick={(): void => {
                setShowFreeform(true);
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: OPTION_FONT_SIZE,
                color: colors['text-dim'],
                backgroundColor: 'transparent',
                border: `1px dashed ${colors.border}`,
                borderRadius: OPTION_BORDER_RADIUS,
              }}
            >
              Other...
            </UnstyledButton>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
