/**
 * PURPOSE: Draws the quest's pinned user request the way the user composed it — words, picture,
 * words — instead of printing the markdown the server left behind. `quest.userRequest` is stored
 * AFTER the send-time rewrite, so a request that named a screenshot holds
 * `![Pasted Image 1](/…/images/<uuid>.png)`: a token, and an absolute path into a directory the
 * reader has never seen and cannot act on. Reach for this wherever `quest.userRequest` is shown.
 *
 * It is a sibling of `ImageContentLayerWidget`, not a reuse of it: that widget belongs to a chat
 * entry, keys in-memory bytes by the entry's uuid, and opens a full-size overlay on click. A quest
 * request has no entry and no uuid, and this block is pinned and height-capped, so the overlay and
 * the memory lookup are both meaningless here. What the two DO share is the parser, which is the
 * part that must not drift.
 *
 * A token whose image cannot be painted becomes the same fixed-size broken box the transcript uses,
 * so the request never silently loses the sentence an image was standing in.
 *
 * USAGE:
 * <UserRequestLayerWidget userRequest={quest.userRequest} />
 * // Renders the request's text and image segments in composed order
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { TranscriptSegment } from '../../contracts/transcript-segment/transcript-segment-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { imageTokenServeUrlTransformer } from '../../transformers/image-token-serve-url/image-token-serve-url-transformer';
import { parseTranscriptSegmentsTransformer } from '../../transformers/parse-transcript-segments/parse-transcript-segments-transformer';

type QuestUserRequest = NonNullable<Quest['userRequest']>;
type ImageSegment = Extract<TranscriptSegment, { kind: 'image' }>;

export interface UserRequestLayerWidgetProps {
  userRequest: QuestUserRequest;
}

export const UserRequestLayerWidget = ({
  userRequest,
}: UserRequestLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // Keyed by ordinal rather than by array index, matching ImageContentLayerWidget: the ordinal is
  // carried by the segment itself, so a failure record survives any change to how segments are
  // built.
  const [brokenOrdinals, setBrokenOrdinals] = useState<ReadonlySet<ImageSegment['ordinal']>>(
    new Set(),
  );

  // No `memoryImages`: those bytes are staged against a chat entry's uuid by the tab that pasted
  // them, and a quest request is read back from disk by every tab alike. A bare placeholder here
  // therefore has no bytes to find and renders as the broken box, which is the honest outcome.
  const segments = parseTranscriptSegmentsTransformer({
    content: imageTokenServeUrlTransformer({ content: userRequest }),
  });

  return (
    <Box data-testid="USER_REQUEST_TEXT">
      {segments.map((segment, index) => {
        if (segment.kind === 'text') {
          return (
            <Text
              key={index}
              component="span"
              data-testid="USER_REQUEST_TEXT_SEGMENT"
              ff="monospace"
              size="xs"
              style={{ color: colors.text, whiteSpace: 'pre-wrap' }}
            >
              {segment.text}
            </Text>
          );
        }

        if (segment.kind === 'broken-image' || brokenOrdinals.has(segment.ordinal)) {
          return (
            <span
              key={index}
              data-testid="USER_REQUEST_IMAGE_BROKEN"
              role="img"
              aria-label={`Pasted image ${String(segment.ordinal)} could not be loaded`}
              title={`Pasted image ${String(segment.ordinal)} could not be loaded`}
              style={{
                display: 'inline-block',
                width: webConfigStatics.pastedImage.brokenThumbnailSizePx,
                height: webConfigStatics.pastedImage.brokenThumbnailSizePx,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: colors.danger,
                backgroundColor: colors['bg-deep'],
              }}
            />
          );
        }

        return (
          <img
            key={index}
            data-testid="USER_REQUEST_IMAGE"
            src={segment.src}
            alt={`Pasted image ${segment.ordinal}`}
            style={{
              maxWidth: '100%',
              maxHeight: webConfigStatics.pastedImage.userRequestThumbnailMaxHeightPx,
              // `inline-block`, not `block`: a block image breaks the line both before and after
              // itself, so the words the request was built around would each drop to a line of
              // their own inside a block that only shows 120px at a time.
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
            onError={() => {
              setBrokenOrdinals((previous) => {
                const next = new Set(previous);
                next.add(segment.ordinal);
                return next;
              });
            }}
          />
        );
      })}
    </Box>
  );
};
