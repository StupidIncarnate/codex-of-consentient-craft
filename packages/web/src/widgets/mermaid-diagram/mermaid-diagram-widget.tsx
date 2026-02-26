/**
 * PURPOSE: Renders a mermaid diagram from mermaid syntax into an SVG visualization
 *
 * USAGE:
 * <MermaidDiagramWidget diagram={mermaidDefinition} />
 * // Renders the mermaid diagram as SVG inside a scrollable container
 */

import { Box, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { mermaidRenderAdapter } from '../../adapters/mermaid/render/mermaid-render-adapter';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { MermaidDefinition } from '../../contracts/mermaid-definition/mermaid-definition-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface MermaidDiagramWidgetProps {
  diagram: MermaidDefinition;
}

const MAX_HEIGHT = 400;
const DIAGRAM_ID_PREFIX = 'mermaid-diagram-';
let diagramCounter = 0;

export const MermaidDiagramWidget = ({ diagram }: MermaidDiagramWidgetProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const { colors } = emberDepthsThemeStatics;

  useEffect(() => {
    let cancelled = false;
    diagramCounter += 1;
    const id = `${DIAGRAM_ID_PREFIX}${String(diagramCounter)}`;

    mermaidRenderAdapter({ id, definition: diagram })
      .then((svg) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
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

  if (error) {
    return (
      <Text ff="monospace" size="xs" data-testid="MERMAID_ERROR" style={{ color: colors.danger }}>
        {error}
      </Text>
    );
  }

  return (
    <Box
      ref={containerRef}
      data-testid="MERMAID_CONTAINER"
      style={{
        maxHeight: MAX_HEIGHT,
        overflow: 'auto',
      }}
    />
  );
};
