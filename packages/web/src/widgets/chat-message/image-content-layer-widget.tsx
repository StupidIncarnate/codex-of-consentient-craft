/**
 * PURPOSE: The user branch of ChatMessageWidget has to show a message the way it was composed —
 * text, an inline picture, more text, in the order the user typed it — whether that message is an
 * optimistic entry still holding bare `[Pasted Image N]` placeholders backed by in-memory data URLs,
 * or the same message read back from disk with `![Pasted Image N](url)` markdown tokens pointing at
 * a served URL. `parseTranscriptSegmentsTransformer` already resolves both shapes into one ordered
 * segment list; this widget's only job is walking that list into DOM, and isolating one image's
 * decode failure from its siblings and from the surrounding text.
 *
 * USAGE:
 * <ImageContentLayerWidget content={entry.content} entryUuid={entry.uuid} />
 * // Renders the message's text and image segments in composed order, each failed image replaced
 * // in place by a fixed-size placeholder
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { pastedImageMemoryState } from '../../state/pasted-image-memory/pasted-image-memory-state';
import type { TranscriptSegment } from '../../contracts/transcript-segment/transcript-segment-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { parseTranscriptSegmentsTransformer } from '../../transformers/parse-transcript-segments/parse-transcript-segments-transformer';
import { ImageOverlayWidget } from '../image-overlay/image-overlay-widget';

type UserContent = Extract<ChatEntry, { role: 'user' }>['content'];
type ChatEntryUuid = ChatEntry['uuid'];
type ImageSegment = Extract<TranscriptSegment, { kind: 'image' }>;

export interface ImageContentLayerWidgetProps {
  content: UserContent;
  entryUuid: ChatEntryUuid;
}

export const ImageContentLayerWidget = ({
  content,
  entryUuid,
}: ImageContentLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // Keyed by ordinal (each image's position in ITS OWN message, 1-based) rather than array index —
  // an ordinal is what the segment itself carries, so the failure record stays correct even if a
  // future change reorders how segments are built.
  const [brokenOrdinals, setBrokenOrdinals] = useState<ReadonlySet<ImageSegment['ordinal']>>(
    new Set(),
  );
  const [overlaySrc, setOverlaySrc] = useState<ImageSegment['src'] | null>(null);

  const memoryImages = pastedImageMemoryState.recall({ uuid: entryUuid });
  const segments = parseTranscriptSegmentsTransformer({ content: String(content), memoryImages });

  return (
    <>
      <Box data-testid="IMAGE_CONTENT_LAYER">
        {segments.map((segment, index) => {
          if (segment.kind === 'text') {
            return (
              <Text
                key={index}
                component="span"
                data-testid="CHAT_MESSAGE_TEXT"
                ff="monospace"
                size="xs"
                style={{ color: colors.text, whiteSpace: 'pre-wrap' }}
              >
                {segment.text}
              </Text>
            );
          }

          if (brokenOrdinals.has(segment.ordinal)) {
            return (
              <span
                key={index}
                data-testid="CHAT_MESSAGE_IMAGE_BROKEN"
                style={{
                  display: 'inline-block',
                  width: webConfigStatics.pastedImage.brokenThumbnailSizePx,
                  height: webConfigStatics.pastedImage.brokenThumbnailSizePx,
                  // `border` reads as painted and is not: measured at 1.23:1 against this same
                  // `bg-raised` bubble background (packages/web/CLAUDE.md's markdown-rule
                  // paragraph), under the 3:1 WCAG floor for a non-text UI boundary. `danger`
                  // clears 4.4:1 against `bg-raised` and names what this box actually is — not a
                  // container waiting for content, but the failure itself. Longhand (not the
                  // `border` shorthand) so jsdom's style readback stays a single stable property
                  // per value rather than a reconstructed shorthand string.
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: colors.danger,
                  // Distinct from the bubble's own `bg-raised` fill — `bg-deep` reads as a hole
                  // left by the missing image rather than a second surface competing with the
                  // danger border for attention.
                  backgroundColor: colors['bg-deep'],
                }}
              />
            );
          }

          return (
            <img
              key={index}
              data-testid="CHAT_MESSAGE_IMAGE"
              src={segment.src}
              alt={`Pasted image ${segment.ordinal}`}
              style={{ cursor: 'pointer', maxWidth: '100%', display: 'block' }}
              onClick={() => {
                setOverlaySrc(segment.src);
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
      <ImageOverlayWidget
        opened={overlaySrc !== null}
        src={overlaySrc ?? ''}
        alt="Pasted image"
        onClose={() => {
          setOverlaySrc(null);
        }}
      />
    </>
  );
};
