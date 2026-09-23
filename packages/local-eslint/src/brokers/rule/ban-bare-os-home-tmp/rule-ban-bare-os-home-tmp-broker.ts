/**
 * PURPOSE: Bans a bare homedir()/tmpdir() call from os or node:os outside the OS adapter layer
 * (src/adapters/os/) — and, for tmpdir() only, also allows *.harness.ts files, files under
 * test/harnesses/, and each package's own playwright.config.ts, which legitimately need the real
 * OS tmp dir. Flags the CALL only: a bound reference passed as a value (e.g.
 * registerMock({ fn: homedir })) is never a call and stays silent — only the parent CallExpression
 * settles it. Flags three call shapes: a named import (or its rename) called bare,
 * os.homedir()/os.tmpdir() on a namespace or default import, and require('os').homedir() chained
 * directly off the call.
 *
 * USAGE:
 * const rule = ruleBanBareOsHomeTmpBroker();
 * // Returns ESLint rule that flags homedir(), os.tmpdir(), and require('node:os').homedir() outside
 * // each package's src/adapters/os/ folder, and additionally allows tmpdir() in *.harness.ts,
 * // files under test/harnesses/, and each package's own playwright.config.ts.
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped) to hold
 * home-isolation.md's plan — every home/tmp read goes through an adapter so a test never leaks into
 * the developer's real OS home or writes outside a sandboxed tmp root.
 */
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { banBareOsHomeTmpStatics } from '../../../statics/ban-bare-os-home-tmp/ban-bare-os-home-tmp-statics';
import {
  isOsHomeTmpAllowlistedGuard,
  type OsHomeTmpKind,
} from '../../../guards/is-os-home-tmp-allowlisted/is-os-home-tmp-allowlisted-guard';

export const ruleBanBareOsHomeTmpBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban a bare homedir()/tmpdir() call from os/node:os outside the OS adapter layer (src/adapters/os/) — and, for tmpdir(), outside *.harness.ts, test/harnesses/, and playwright.config.ts.',
      },
      messages: {
        bareHomedirCall:
          "Do not call '{{callText}}' directly. homedir() from os/node:os is only allowed under src/adapters/os/. Use osUserHomedirAdapter() for the real OS home, osHomedirAdapter() for the dungeonmaster data home (respects DUNGEONMASTER_HOME), or locationsClaudeConfigDirFindBroker() for the Claude config dir (respects CLAUDE_CONFIG_DIR) instead.",
        bareTmpdirCall:
          "Do not call '{{callText}}' directly. tmpdir() from os/node:os is only allowed under src/adapters/os/, in a *.harness.ts file, under test/harnesses/, or in a package's own playwright.config.ts. Use osTmpdirAdapter() instead.",
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = String(ctx.filename ?? ctx.getFilename?.() ?? '');

    const namedBindings = new Map<Identifier, OsHomeTmpKind>();
    const namespaceBindings = new Set<Identifier>();

    return {
      ImportDeclaration: (node: Tsestree): void => {
        const sourceValue = node.source?.value;
        if (!banBareOsHomeTmpStatics.osModule.specifiers.some((s) => s === sourceValue)) {
          return;
        }

        for (const specifier of node.specifiers ?? []) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported?.type === 'Identifier' &&
            specifier.local?.type === 'Identifier' &&
            specifier.local.name !== undefined
          ) {
            const importedNameText =
              specifier.imported.name === undefined ? undefined : String(specifier.imported.name);
            if (importedNameText === 'homedir' || importedNameText === 'tmpdir') {
              namedBindings.set(specifier.local.name, importedNameText);
            }
            continue;
          }

          if (
            (specifier.type === 'ImportDefaultSpecifier' ||
              specifier.type === 'ImportNamespaceSpecifier') &&
            specifier.local?.type === 'Identifier' &&
            specifier.local.name !== undefined
          ) {
            namespaceBindings.add(specifier.local.name);
          }
        }
      },
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        if (!callee) {
          return;
        }

        if (callee.type === 'Identifier') {
          if (callee.name === undefined) {
            return;
          }
          const kind = namedBindings.get(callee.name);
          if (kind === undefined || isOsHomeTmpAllowlistedGuard({ filename, kind })) {
            return;
          }
          ctx.report({
            node,
            messageId: kind === 'homedir' ? 'bareHomedirCall' : 'bareTmpdirCall',
            data: { callText: `${String(callee.name)}()` },
          });
          return;
        }

        if (callee.type !== 'MemberExpression') {
          return;
        }

        const { object, property } = callee;
        if (!object || !property || property.type !== 'Identifier') {
          return;
        }
        const propertyNameText = property.name === undefined ? undefined : String(property.name);
        if (propertyNameText !== 'homedir' && propertyNameText !== 'tmpdir') {
          return;
        }
        const kind = propertyNameText;

        if (
          object.type === 'Identifier' &&
          object.name !== undefined &&
          namespaceBindings.has(object.name)
        ) {
          if (isOsHomeTmpAllowlistedGuard({ filename, kind })) {
            return;
          }
          ctx.report({
            node,
            messageId: kind === 'homedir' ? 'bareHomedirCall' : 'bareTmpdirCall',
            data: { callText: `${String(object.name)}.${kind}()` },
          });
          return;
        }

        if (
          object.type === 'CallExpression' &&
          object.callee?.type === 'Identifier' &&
          String(object.callee.name) === banBareOsHomeTmpStatics.osModule.requireIdentifierName
        ) {
          const [firstArgument] = object.arguments ?? [];
          if (
            firstArgument?.type === 'Literal' &&
            banBareOsHomeTmpStatics.osModule.specifiers.some((s) => s === firstArgument.value)
          ) {
            if (isOsHomeTmpAllowlistedGuard({ filename, kind })) {
              return;
            }
            ctx.report({
              node,
              messageId: kind === 'homedir' ? 'bareHomedirCall' : 'bareTmpdirCall',
              data: { callText: `require('${String(firstArgument.value)}').${kind}()` },
            });
          }
        }
      },
    };
  },
});
