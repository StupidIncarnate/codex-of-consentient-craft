/**
 * PURPOSE: Renders a mermaid diagram from mermaid syntax into an SVG visualization with pan/zoom and fullscreen
 *
 * USAGE:
 * <MermaidDiagramWidget diagram={mermaidDefinition} />
 * // Renders the mermaid diagram as SVG with zoom controls and fullscreen modal
 */

import { ActionIcon, Box, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMaximize, IconX, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mermaidRenderAdapter } from '../../adapters/mermaid/render/mermaid-render-adapter';
import { panzoomCreateAdapter } from '../../adapters/panzoom/create/panzoom-create-adapter';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { MermaidDefinition } from '../../contracts/mermaid-definition/mermaid-definition-contract';
import type { SvgMarkup } from '../../contracts/svg-markup/svg-markup-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface MermaidDiagramWidgetProps {
  diagram: MermaidDefinition;
}

const MAX_HEIGHT = 400;
const DIAGRAM_ID_PREFIX = 'mermaid-diagram-';
const ICON_SIZE = 16;
let diagramCounter = 0;

const controlStyles = {
  bg: emberDepthsThemeStatics.colors['bg-raised'],
  border: `1px solid ${emberDepthsThemeStatics.colors.border}`,
};

export const MermaidDiagramWidget = ({ diagram }: MermaidDiagramWidgetProps): React.JSX.Element => {
  const inlineContainerRef = useRef<HTMLDivElement>(null);
  const inlinePanzoomRef = useRef<ReturnType<typeof panzoomCreateAdapter> | null>(null);
  const modalPanzoomRef = useRef<ReturnType<typeof panzoomCreateAdapter> | null>(null);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [svgContent, setSvgContent] = useState<SvgMarkup | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const { colors } = emberDepthsThemeStatics;

  useEffect(() => {
    let cancelled = false;
    diagramCounter += 1;
    const id = `${DIAGRAM_ID_PREFIX}${String(diagramCounter)}`;

    mermaidRenderAdapter({ id, definition: diagram })
      .then((svg) => {
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      })
      .catch((renderError: unknown) => {
        if (!cancelled) {
          const message =
            renderError instanceof Error ? renderError.message : 'Failed to render diagram';
          setError(errorMessageContract.parse(message));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [diagram]);

  useEffect(() => {
    if (!svgContent || !inlineContainerRef.current) {
      return undefined;
    }

    inlineContainerRef.current.innerHTML = svgContent;

    const instance = panzoomCreateAdapter({ element: inlineContainerRef.current });
    inlinePanzoomRef.current = instance;

    return () => {
      instance.destroy();
      inlinePanzoomRef.current = null;
    };
  }, [svgContent]);

  const modalContainerCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (modalPanzoomRef.current) {
        modalPanzoomRef.current.destroy();
        modalPanzoomRef.current = null;
      }

      if (node && svgContent) {
        node.innerHTML = svgContent;
        modalPanzoomRef.current = panzoomCreateAdapter({ element: node });
      }
    },
    [svgContent],
  );

  if (error) {
    return (
      <Text ff="monospace" size="xs" data-testid="MERMAID_ERROR" style={{ color: colors.danger }}>
        {error}
      </Text>
    );
  }

  return (
    <>
      <Box style={{ position: 'relative' }}>
        <Box data-testid="MERMAID_CONTAINER" style={{ maxHeight: MAX_HEIGHT, overflow: 'hidden' }}>
          <Box ref={inlineContainerRef} />
        </Box>
        {svgContent ? (
          <Group gap={4} style={{ position: 'absolute', bottom: 8, right: 8 }}>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="ZOOM_IN_BUTTON"
              onClick={() => inlinePanzoomRef.current?.zoomIn()}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconZoomIn size={ICON_SIZE} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="ZOOM_OUT_BUTTON"
              onClick={() => inlinePanzoomRef.current?.zoomOut()}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconZoomOut size={ICON_SIZE} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="FULLSCREEN_BUTTON"
              onClick={open}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconMaximize size={ICON_SIZE} />
            </ActionIcon>
          </Group>
        ) : null}
      </Box>

      <Modal
        fullScreen
        opened={opened}
        onClose={close}
        withCloseButton={false}
        data-testid="FULLSCREEN_MODAL"
        styles={{ body: { height: '100%', padding: 0 } }}
      >
        <Box style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
          <Box ref={modalContainerCallbackRef} data-testid="MODAL_DIAGRAM_CONTAINER" />
          <Group gap={4} style={{ position: 'absolute', bottom: 16, right: 16 }}>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="MODAL_ZOOM_IN_BUTTON"
              onClick={() => modalPanzoomRef.current?.zoomIn()}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconZoomIn size={ICON_SIZE} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="MODAL_ZOOM_OUT_BUTTON"
              onClick={() => modalPanzoomRef.current?.zoomOut()}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconZoomOut size={ICON_SIZE} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              size="sm"
              data-testid="MODAL_CLOSE_BUTTON"
              onClick={close}
              style={{ background: controlStyles.bg, border: controlStyles.border }}
            >
              <IconX size={ICON_SIZE} />
            </ActionIcon>
          </Group>
        </Box>
      </Modal>
    </>
  );
};
