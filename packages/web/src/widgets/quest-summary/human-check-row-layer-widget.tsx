/**
 * PURPOSE: Renders ONE `verifyByHuman` criterion's row in the verification summary — its
 * description, and either its recorded verdict or the MET / NOT MET controls a person uses to
 * record one. Reach for this when you have a single criterion; `HumanCheckPanelWidget` is the
 * section that mounts one of these per criterion.
 *
 * USAGE:
 * <HumanCheckRowLayerWidget questId={questId} criterion={criterion} note={note} />
 * // note === null renders a reason field plus MET / NOT MET controls; a note renders the verdict
 */

import { useState } from 'react';

import { Box, Group, Stack, Text } from '@mantine/core';

import type { QuestId, QuestNote, QuestSummaryObservable } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { questHumanVerdictBroker } from '../../brokers/quest/human-verdict/quest-human-verdict-broker';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;
const MET_LABEL = 'MET' as ButtonLabel;
const NOT_MET_LABEL = 'NOT MET' as ButtonLabel;
const DANGER_VARIANT = 'danger' as ButtonVariant;

export interface HumanCheckRowLayerWidgetProps {
  questId: QuestId;
  criterion: QuestSummaryObservable;
  note: QuestNote | null;
}

export const HumanCheckRowLayerWidget = ({
  questId,
  criterion,
  note,
}: HumanCheckRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const disableControls = reason.trim().length === 0 || submitting;

  return (
    <Box data-testid="HUMAN_CHECK_ROW" style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}>
      <Text
        ff="monospace"
        data-testid="HUMAN_CHECK_DESCRIPTION"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
      >
        {criterion.description}
      </Text>
      {note === null ? (
        <Stack gap={4}>
          <textarea
            data-testid="HUMAN_CHECK_REASON"
            value={reason}
            placeholder="Why?"
            onChange={(event) => {
              setReason(event.currentTarget.value);
            }}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: ROW_FONT_SIZE,
              color: colors.text,
              backgroundColor: colors['bg-deep'],
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              padding: 6,
              resize: 'none',
            }}
          />
          {error === null ? null : (
            <Text
              ff="monospace"
              data-testid="HUMAN_CHECK_ERROR"
              style={{ fontSize: ROW_FONT_SIZE, color: colors.danger }}
            >
              {error}
            </Text>
          )}
          <Group gap={6}>
            <PixelBtnWidget
              label={MET_LABEL}
              disabled={disableControls}
              onClick={() => {
                setSubmitting(true);
                setError(null);
                questHumanVerdictBroker({
                  questId,
                  unitId: criterion.observableId,
                  outcome: 'met',
                  reason,
                })
                  .then(() => {
                    setSubmitting(false);
                  })
                  .catch((thrown: unknown) => {
                    setError(
                      errorMessageContract.parse(
                        thrown instanceof Error ? thrown.message : String(thrown),
                      ),
                    );
                    setSubmitting(false);
                  });
              }}
            />
            <PixelBtnWidget
              label={NOT_MET_LABEL}
              variant={DANGER_VARIANT}
              disabled={disableControls}
              onClick={() => {
                setSubmitting(true);
                setError(null);
                questHumanVerdictBroker({
                  questId,
                  unitId: criterion.observableId,
                  outcome: 'not-met',
                  reason,
                })
                  .then(() => {
                    setSubmitting(false);
                  })
                  .catch((thrown: unknown) => {
                    setError(
                      errorMessageContract.parse(
                        thrown instanceof Error ? thrown.message : String(thrown),
                      ),
                    );
                    setSubmitting(false);
                  });
              }}
            />
          </Group>
        </Stack>
      ) : (
        <Text
          ff="monospace"
          data-testid="HUMAN_CHECK_VERDICT"
          style={{
            fontSize: ROW_FONT_SIZE,
            color: note.outcome === 'met' ? colors.primary : colors.danger,
          }}
        >
          [{note.outcome}] {note.detail}
        </Text>
      )}
    </Box>
  );
};
