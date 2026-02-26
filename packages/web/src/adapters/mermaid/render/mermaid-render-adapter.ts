/**
 * PURPOSE: Wraps mermaid.render() to convert a mermaid definition string into SVG markup
 *
 * USAGE:
 * const svg = await mermaidRenderAdapter({id: 'diagram-1', definition: 'graph TD; A-->B'});
 * // Returns SvgMarkup branded string for the rendered diagram
 */

import mermaid from 'mermaid';

import { svgMarkupContract } from '../../../contracts/svg-markup/svg-markup-contract';
import type { SvgMarkup } from '../../../contracts/svg-markup/svg-markup-contract';

let initialized = false;

export const mermaidRenderAdapter = async ({
  id,
  definition,
}: {
  id: string;
  definition: string;
}): Promise<SvgMarkup> => {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#1a110d',
        primaryColor: '#ff6b35',
        primaryTextColor: '#e0cfc0',
        lineColor: '#3d2a1e',
        secondaryColor: '#2a1a14',
        tertiaryColor: '#0d0907',
      },
    });
    initialized = true;
  }

  const { svg } = await mermaid.render(id, definition);
  return svgMarkupContract.parse(svg);
};
