/**
 * PURPOSE: Renders a clarification panel showing questions with selectable options for quest
 * clarification. Owns question-advancement and answer-collection state; each option renders via
 * ClarifyOptionLayerWidget, which only reports which label was picked.
 *
 * USAGE:
 * <QuestClarifyPanelWidget questions={questions} questTitle={questTitle} onSubmitAnswers={handleSubmit} />
 * // Renders question text, option buttons, and "Other..." freeform input
 */

import { useState } from 'react';

import { Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { AskUserQuestionItem, AskUserQuestionOption } from '@dungeonmaster/shared/contracts';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { ClarifyOptionLayerWidget } from './clarify-option-layer-widget';

const OPTION_FONT_SIZE = 12;
const OPTION_BORDER_RADIUS = 2;
const OPTION_PADDING_Y = 8;

// Holds the whole question rather than flattening `header` + `question` off it, so this type
// never indexes AskUserQuestionItem twice. Read `.question.header` / `.question.question` at
// call sites instead of carrying two separately-typed copies of the same source object.
export interface ClarifyAnswer {
  question: AskUserQuestionItem;
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
              onSelect={({ label }): void => {
                const updated = [...collectedAnswers, { question: currentQuestion, label }];
                if (currentQuestionIndex < questions.length - 1) {
                  setCollectedAnswers(updated);
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setShowFreeform(false);
                  setFreeformValue('' as FormInputValue);
                } else {
                  onSubmitAnswers({ answers: updated });
                }
              }}
            />
          ))}
          {showFreeform ? (
            <Stack data-testid="CLARIFY_FREEFORM" gap={6}>
              <FormInputWidget
                value={freeformValue}
                onChange={(value: FormInputValue): void => {
                  setFreeformValue(value);
                }}
                placeholder={'Type your answer...' as FormPlaceholder}
                autoFocus={true}
              />
              <PixelBtnWidget
                label={'Send' as ButtonLabel}
                onClick={(): void => {
                  if (freeformValue.length > 0 && currentQuestion) {
                    const freeLabel = freeformValue as unknown as AskUserQuestionOption['label'];
                    const updated = [
                      ...collectedAnswers,
                      {
                        question: currentQuestion,
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
