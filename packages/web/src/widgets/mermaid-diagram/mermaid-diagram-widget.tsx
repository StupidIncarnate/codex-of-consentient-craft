/**
 * PURPOSE: Renders a mermaid diagram from mermaid syntax into an SVG visualization with pan/zoom and fullscreen
 *
 * USAGE:
 * <MermaidDiagramWidget diagram={mermaidDefinition} />
 * // Renders the mermaid diagram as SVG with zoom controls and fullscreen modal
 */

import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconMaximize, IconMinimize, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

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
const EXPANDED_MIN_HEIGHT = 'calc(100vh - 160px)';
const DIAGRAM_ID_PREFIX = 'mermaid-diagram-';
const ICON_SIZE = 20;
let diagramCounter = 0;

const controlStyles = {
  bg: emberDepthsThemeStatics.colors['bg-raised'],
  border: `1px solid ${emberDepthsThemeStatics.colors.border}`,
};

const DIAGRAM_STYLE_TAG =
  '<style>.flowchart-link { stroke-width: 2px !important; } .marker { stroke-width: 1px; } .node foreignObject > div { text-align: left !important; max-width: 600px !important; white-space: normal !important; }</style>';

export const MermaidDiagramWidget = ({ diagram }: MermaidDiagramWidgetProps): React.JSX.Element => {
  const inlineContainerRef = useRef<HTMLDivElement>(null);
  const inlinePanzoomRef = useRef<ReturnType<typeof panzoomCreateAdapter> | null>(null);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [svgContent, setSvgContent] = useState<SvgMarkup | null>(null);
  const [expanded, setExpanded] = useState(false);
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

    inlineContainerRef.current.innerHTML = DIAGRAM_STYLE_TAG + svgContent;

    const instance = panzoomCreateAdapter({ element: inlineContainerRef.current });
    inlinePanzoomRef.current = instance;

    const scrollContainer = inlineContainerRef.current.closest('[data-testid="MERMAID_CONTAINER"]');
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = 0;
      });
    }

    return () => {
      instance.destroy();
      inlinePanzoomRef.current = null;
    };
  }, [svgContent]);

  if (error) {
    return (
      <Text ff="monospace" size="xs" data-testid="MERMAID_ERROR" style={{ color: colors.danger }}>
        {error}
      </Text>
    );
  }

  return (
    <>
      <Box
        data-testid="MERMAID_CONTAINER"
        style={{
          maxHeight: expanded ? undefined : MAX_HEIGHT,
          minHeight: expanded ? EXPANDED_MIN_HEIGHT : undefined,
          overflow: 'auto',
        }}
      >
        <Box>
          <Box ref={inlineContainerRef} data-testid="MERMAID_SVG_CONTENT" />
        </Box>
      </Box>
      {svgContent ? (
        <Group gap={8} justify="center" mt={8}>
          <ActionIcon
            variant="filled"
            size={32}
            data-testid="ZOOM_IN_BUTTON"
            onClick={() => inlinePanzoomRef.current?.zoomIn()}
            style={{ background: controlStyles.bg, border: controlStyles.border }}
          >
            <IconZoomIn size={ICON_SIZE} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            size={32}
            data-testid="ZOOM_OUT_BUTTON"
            onClick={() => inlinePanzoomRef.current?.zoomOut()}
            style={{ background: controlStyles.bg, border: controlStyles.border }}
          >
            <IconZoomOut size={ICON_SIZE} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            size={32}
            data-testid="FULLSCREEN_BUTTON"
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
            style={{ background: controlStyles.bg, border: controlStyles.border }}
          >
            {expanded ? <IconMinimize size={ICON_SIZE} /> : <IconMaximize size={ICON_SIZE} />}
          </ActionIcon>
        </Group>
      ) : null}
    </>
  );
};
