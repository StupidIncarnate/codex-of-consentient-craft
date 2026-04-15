/**
 * PURPOSE: Extracts TypeScript function signature from export statement
 *
 * USAGE:
 * const signature = signatureExtractorTransformer({
 *   fileContents: FileContentsStub({ value: 'export const foo = ({ x }: { x: number }): string => {}' })
 * });
 * // Returns: { raw: '...', parameters: [...], returnType: 'string' }
 */
import { signatureRawContract } from '../../contracts/signature-raw/signature-raw-contract';
import { parameterNameContract } from '../../contracts/parameter-name/parameter-name-contract';
import { returnTypeContract } from '../../contracts/return-type/return-type-contract';
import { typeNameContract } from '../../contracts/type-name/type-name-contract';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import type { FunctionSignature } from '../../contracts/file-metadata/file-metadata-contract';
import type { TypeName } from '../../contracts/type-name/type-name-contract';
import type { FunctionName } from '../../contracts/function-name/function-name-contract';
import { kebabToCamelTransformer } from '../kebab-to-camel/kebab-to-camel-transformer';

// Allows one level of `{}` nesting inside a `{...}` block — e.g. `{ x: { y: string } }`.
const BALANCED_BRACES = '\\{(?:[^{}]|\\{[^{}]*\\})*\\}';
// Allows one level of `<>` nesting inside a `<...>` block — e.g. `<T extends Array<U>>`.
const BALANCED_GENERICS = '<(?:[^<>]|<[^<>]*>)*>';

export const signatureExtractorTransformer = ({
  fileContents,
  functionName,
}: {
  fileContents: FileContents;
  functionName?: FunctionName;
}): FunctionSignature | null => {
  // Pattern 1: destructured params `({ names }: { types })`.
  // Supports: optional `async`, optional generic `<T>`, one level of brace nesting in types.
  const signaturePatternWithParams = new RegExp(
    'export\\s+const\\s+(\\w+)\\s*=\\s*(?:async\\s*)?' +
      `(?:${BALANCED_GENERICS}\\s*)?` +
      '\\(\\s*' +
      `(${BALANCED_BRACES})` +
      '\\s*:\\s*' +
      `(${BALANCED_BRACES})` +
      '\\s*\\)\\s*:\\s*([^=]+?)(?:\\s*=>)',
    'u',
  );
  const matchWithParams = signaturePatternWithParams.exec(fileContents);

  if (matchWithParams) {
    const extractedName = matchWithParams[1] ?? '';
    // The third capture group wraps the types block in `{...}` — strip the outer braces.
    const typesBlockRaw = matchWithParams[3] ?? '';
    const typesStr = typesBlockRaw.slice(1, -1);
    const returnTypeStr = matchWithParams[4]?.trim() ?? '';

    if (functionName) {
      const camelCaseName = kebabToCamelTransformer({ kebabCase: functionName });
      if (extractedName !== String(camelCaseName)) {
        return null;
      }
    }

    const paramTypesObj: Record<TypeName, TypeName> = {} as Record<TypeName, TypeName>;

    // Walk the types block once, respecting bracket depth so nested `{...}` and generics
    // don't split prematurely. We split the block on top-level `;`, then split each entry
    // on its first top-level `:` to get { name: type } pairs.
    let depth = 0;
    let current = '';
    for (let i = 0; i <= typesStr.length; i++) {
      const atEnd = i === typesStr.length;
      const ch = atEnd ? ';' : typesStr.charAt(i);

      if (!atEnd) {
        if (ch === '{' || ch === '<' || ch === '(' || ch === '[') depth++;
        else if (ch === '}' || ch === '>' || ch === ')' || ch === ']') depth--;
      }

      if (atEnd || (depth === 0 && ch === ';')) {
        const entry = current.trim();
        current = '';
        if (entry.length === 0) continue;

        // Find the first top-level `:` inside this entry.
        let colonIdx = -1;
        let entryDepth = 0;
        for (let j = 0; j < entry.length; j++) {
          const ec = entry.charAt(j);
          if (ec === '{' || ec === '<' || ec === '(' || ec === '[') entryDepth++;
          else if (ec === '}' || ec === '>' || ec === ')' || ec === ']') entryDepth--;
          else if (entryDepth === 0 && ec === ':') {
            colonIdx = j;
            break;
          }
        }
        if (colonIdx === -1) continue;

        const name = entry.slice(0, colonIdx).trim();
        const type = entry.slice(colonIdx + 1).trim();
        if (name && type) {
          paramTypesObj[typeNameContract.parse(name)] = typeNameContract.parse(type);
        }
      } else {
        current += ch;
      }
    }

    return {
      raw: signatureRawContract.parse(matchWithParams[0]),
      parameters: [
        {
          name: parameterNameContract.parse('destructured object'),
          type: paramTypesObj,
        },
      ],
      returnType: returnTypeContract.parse(returnTypeStr),
    };
  }

  // Pattern 2: no parameters `()`, optionally with generic `<T>`.
  const signaturePatternNoParams = new RegExp(
    'export\\s+const\\s+(\\w+)\\s*=\\s*(?:async\\s*)?' +
      `(?:${BALANCED_GENERICS}\\s*)?` +
      '\\(\\s*\\)\\s*:\\s*([^=]+?)(?:\\s*=>)',
    'u',
  );
  const matchNoParams = signaturePatternNoParams.exec(fileContents);

  if (matchNoParams) {
    const extractedName = matchNoParams[1] ?? '';
    const returnTypeStr = matchNoParams[2]?.trim() ?? '';

    if (functionName) {
      const camelCaseName = kebabToCamelTransformer({ kebabCase: functionName });
      if (extractedName !== String(camelCaseName)) {
        return null;
      }
    }

    return {
      raw: signatureRawContract.parse(matchNoParams[0]),
      parameters: [],
      returnType: returnTypeContract.parse(returnTypeStr),
    };
  }

  return null;
};
