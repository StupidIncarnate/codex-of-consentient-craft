import { formatPerformanceSectionLayerBroker } from './format-performance-section-layer-broker';
import { formatPerformanceSectionLayerBrokerProxy } from './format-performance-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatPerformanceSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for performance rules', () => {
    formatPerformanceSectionLayerBrokerProxy();

    const result = formatPerformanceSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Performance',
        '',
        '### Default to Efficient Algorithms',
        '',
        '**Default to efficient algorithms - Dataset sizes are unknown, use Map/Set for lookups over nested array searches**',
        '',
        '**Example:**',
        '```typescript',
        'const userMap = new Map(users.map(user => [user.id, user])); const targetUser = userMap.get(targetId); // O(n)',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const activeUsers = users.filter(user => { return otherUsers.find(other => other.id === user.id)?.isActive; }); // O(n²) nested loops',
        '```',
        '',
        '### Remove Dead Code',
        '',
        '**Delete unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log statements**',
        '',
        '### Use Reflect Methods',
        '',
        '**Reflect.deleteProperty():**',
        '',
        'Use Reflect.deleteProperty() - Never use delete obj[key] with computed keys',
        '',
        '```typescript',
        'Reflect.deleteProperty(require.cache, resolvedPath);',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'delete require.cache[resolvedPath]; // Lint error',
        '```',
        '',
        '**Reflect.get():**',
        '',
        'Use Reflect.get() for accessing properties on objects when TypeScript narrows to object type',
        '',
        '*Rationale:* Avoids unsafe type assertions from object to Record<PropertyKey, unknown>',
        '',
        '**Example:**',
        '```typescript',
        'export const hasStringProperty = (params: {obj: unknown; property: string;}): params is {obj: Record<PropertyKey, string>; property: string} => { const {obj, property} = params; if (typeof obj !== "object" || obj === null) { return false; } return property in obj && typeof Reflect.get(obj, property) === "string"; };',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const record = obj as Record<string, unknown>; // Lint error: unsafe type assertion return typeof record[property] === "string";',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
