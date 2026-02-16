import { formatLoopControlSectionLayerBroker } from './format-loop-control-section-layer-broker';
import { formatLoopControlSectionLayerBrokerProxy } from './format-loop-control-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatLoopControlSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for loop control rules', () => {
    formatLoopControlSectionLayerBrokerProxy();

    const result = formatLoopControlSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Loop Control',
        '',
        '**Use recursion for indeterminate loops - Never use while (true) or loops with unchanging conditions**',
        '',
        '**Recursion:** Recursion with early returns for tree traversal, file system walking, config resolution',
        '',
        '**Regular loops:** for loops over arrays, .forEach(), .map(), .filter(), loops with clear termination conditions are fine',
        '',
        '**Example (recursion):**',
        '```typescript',
        'const findConfig = async ({path}: {path: string}): Promise<string> => { try { const config = await loadConfig({path}); return config; } catch { const parent = getParent({path}); return await findConfig({path: parent}); // Recurse with early return } };',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'while (true) { const config = await loadConfig({path}); // Lint: await in loop, unnecessary condition if (config) break; path = getParent({path}); }',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
