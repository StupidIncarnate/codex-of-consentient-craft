/**
 * PURPOSE: Draws the composer's byte-tracked upload bar. A five-image message can take long enough
 * to send that a spinner reads as a hang, so the composer tracks real bytes sent and hands this
 * widget a percent to paint — this file owns only the drawing, never when the bar is shown or hidden.
 *
 * USAGE:
 * <UploadProgressBarWidget percent={uploadPercentContract.parse(37)} />
 * // Renders a filled bar at 37%, with the composer's upload testid on the wrapping element
 */

import { Progress } from '@mantine/core';

import type { UploadPercent } from '../../contracts/upload-percent/upload-percent-contract';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface UploadProgressBarWidgetProps {
  percent: UploadPercent;
}

export const UploadProgressBarWidget = ({
  percent,
}: UploadProgressBarWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { upload } = chatComposerStatics;

  return (
    <div
      data-testid={upload.testId}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={upload.minPercent}
      aria-valuemax={upload.maxPercent}
    >
      <Progress
        value={percent}
        color={colors.primary}
        styles={{ root: { backgroundColor: colors.border } }}
      />
    </div>
  );
};
