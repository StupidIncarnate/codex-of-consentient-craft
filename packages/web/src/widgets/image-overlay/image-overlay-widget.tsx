/**
 * PURPOSE: Full-size view for a pasted chat image, opened from two callers that never share a URL
 * shape — a thumbnail still sitting in the chat composer (a base64 data URL for an image the server
 * has never seen) and the same image already sent and rendered in the transcript (an http URL the
 * server serves from disk). The overlay chrome (sizing, scroll, close affordance) is identical
 * either way, so one widget renders it rather than one per caller; only the `src` string differs,
 * and that difference is the composer's and transcript's business, not this widget's.
 *
 * USAGE:
 * <ImageOverlayWidget opened={true} src={imageSrc} alt="Pasted image" onClose={handleClose} />
 * // Renders a centred modal at 75% viewport width, capped at 90vh; a taller image scrolls inside
 */

import { Modal } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { IconButtonWidget } from '../icon-button/icon-button-widget';

const CLOSE_LABEL = buttonLabelContract.parse('Close image');
const CLOSE_TEST_ID = testIdContract.parse('IMAGE_OVERLAY_CLOSE');

export interface ImageOverlayWidgetProps {
  opened: boolean;
  // Plain string ON PURPOSE — expressed as the DOM's own HTMLImageElement['src'] rather than a
  // branded contract (the same dodge IconButtonWidgetProps uses for `id`/`className`). The composer
  // caller passes a base64 data URL for an image the server has never seen; the transcript caller
  // passes an http URL the server serves from disk. No single branded contract covers both shapes,
  // and narrowing to either one (a data-URL contract or a served-image-URL contract) would lock the
  // other caller out — which defeats the reason this widget is shared rather than duplicated per
  // caller. Each caller hands over whatever string its own `<img>` can already resolve.
  src: HTMLImageElement['src'];
  alt: HTMLImageElement['alt'];
  onClose: () => void;
}

export const ImageOverlayWidget = ({
  opened,
  src,
  alt,
  onClose,
}: ImageOverlayWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size={`${String(webConfigStatics.pastedImage.overlayWidthPercent)}%`}
      styles={{
        content: {
          backgroundColor: colors['bg-surface'],
          border: `1px solid ${colors.border}`,
        },
        overlay: {
          backgroundColor: 'rgba(13, 9, 7, 0.85)',
        },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <IconButtonWidget
          label={CLOSE_LABEL}
          testId={CLOSE_TEST_ID}
          icon={IconX}
          onClick={() => {
            onClose();
          }}
        />
      </div>
      <div
        data-testid="IMAGE_OVERLAY"
        style={{
          maxHeight: `${String(webConfigStatics.pastedImage.overlayMaxHeightPercent)}vh`,
          overflowY: 'auto',
        }}
      >
        {/* Defence, not the fix — the two callers only ever hand over a src the DOM can already
            resolve, so this branch is not expected to trigger in normal operation. An empty string
            is a real (failing) request to the DOM, not "no image": rendered as `src=""` it paints
            the broken-image glyph and React logs a runtime warning. `opened` gates the modal; this
            gates the picture inside it, so a caller that ever hands over an empty src sees nothing
            rather than a glyph that looks like a decode failure. */}
        {src === '' ? null : (
          <img
            src={src}
            alt={alt}
            data-testid="IMAGE_OVERLAY_IMAGE"
            style={{ width: '100%', display: 'block' }}
          />
        )}
      </div>
    </Modal>
  );
};
