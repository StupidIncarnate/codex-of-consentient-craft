import { formatImportRulesSectionLayerBroker } from './format-import-rules-section-layer-broker';
import { formatImportRulesSectionLayerBrokerProxy } from './format-import-rules-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatImportRulesSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for import rules', () => {
    formatImportRulesSectionLayerBrokerProxy();

    const result = formatImportRulesSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Import Rules',
        '',
        '**All imports at top of file - No inline imports, requires, or dynamic imports**',
        '',
        '- Use ES6 imports - Prefer import over require()',
        '- Group imports logically - External packages, then internal modules, then types',
        '',
        '**Example:**',
        '```typescript',
        'import {readFile} from "fs/promises"; import axios from "axios"; import {userFetchBroker} from "../../brokers/user/fetch/user-fetch-broker"; import {formatDateTransformer} from "../../transformers/format-date/format-date-transformer"; import type {User} from "../../contracts/user/user-contract"; import type {DateString} from "../../contracts/date-string/date-string-contract";',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const loadUser = async () => { const {userFetchBroker} = await import("../../brokers/user/fetch/user-fetch-broker"); };',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
