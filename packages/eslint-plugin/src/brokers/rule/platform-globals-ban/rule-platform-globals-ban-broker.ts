/**
 * PURPOSE: Flags a runtime use, outside the gateway, of an identifier that resolves — via the
 * TypeScript type checker — to a declaration in `lib.dom*.d.ts`, `lib.webworker*.d.ts` or
 * `@types/node`. ES built-ins (`JSON`, `Math`, `Promise`, …) live in `lib.es*.d.ts` and are never
 * flagged; a type position (`Buffer` as a parameter type, `NodeJS.ErrnoException`) is exempt because
 * a type never runs. This needs the type checker, so — unlike every other rule broker here — it
 * resolves a real symbol through `typedParserServicesTransformer` rather than relying on file-path
 * or `/src/` gates the way post-edit rules do. The suggested import is always the
 * `#gateway/<platform>/<subpath>` alias text (gatewayLocationsStatics.importPrefix), never a
 * repo's own `@scope` — resolveGatewayScopeLayerBroker still gates whether a repo root is even
 * resolvable (a file outside any repo never reports), but its resolved scope no longer appears in
 * the message. A Node builtin's ambient global can spell its own module name differently
 * (`Buffer` the class vs. `buffer` the module) — the subpath falls back to the lowercased
 * identifier only when that lowercase form is itself a real Node builtin, so `process`/`crypto`
 * (already lowercase, already builtins) are untouched and `setTimeout` (lowercase but not a
 * builtin) stays camelCase. A global inside a function the driven browser runs is left alone:
 * one written inline as the first argument of `page.evaluate`/`locator.evaluateAll`/
 * `page.waitForFunction`/`page.addInitScript` is decided on the spot, and one inside a NAMED
 * function is held until `Program:exit`, then dropped if that name was passed as such a first
 * argument anywhere in the file (`page.evaluate(READ_FN)`).
 *
 * USAGE:
 * const rule = rulePlatformGlobalsBanBroker();
 * // Returns ESLint rule that flags `process.stdout.write(...)` outside the gateway,
 * // suggesting `import { stdout } from '#gateway/node/process'`
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { builtinModules } from '#gateway/node/module';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { typedParserServicesTransformer } from '../../../transformers/typed-parser-services/typed-parser-services-transformer';
import { isBannedPlatformDeclarationFileGuard } from '../../../guards/is-banned-platform-declaration-file/is-banned-platform-declaration-file-guard';
import { isInsideGatewayLayerBroker } from './is-inside-gateway-layer-broker';
import { isTypePositionLayerBroker } from './is-type-position-layer-broker';
import { isObjectLiteralKeyLabelLayerBroker } from './is-object-literal-key-label-layer-broker';
import { propertyIdentifierToCheckLayerBroker } from './property-identifier-to-check-layer-broker';
import { resolvePackagePlatformLayerBroker } from './resolve-package-platform-layer-broker';
import { resolveGatewayScopeLayerBroker } from './resolve-gateway-scope-layer-broker';
import { isPageCallbackCallLayerBroker } from './is-page-callback-call-layer-broker';
import { isInsideInlinePageCallbackLayerBroker } from './is-inside-inline-page-callback-layer-broker';
import { enclosingFunctionBindingNamesLayerBroker } from './enclosing-function-binding-names-layer-broker';

// CommonJS module-scope values: each module gets its own copy (`__dirname` is the calling file's
// own folder, `module` is the calling file's own module record — `require.main === module` asks
// whether THIS file is the entry point), so exporting one from the gateway would describe the
// gateway's file instead — the one exemption the design doc carves out of the globals rule by name.
const EXEMPT_NAMES = new Set(['require', '__dirname', '__filename', 'module']);

export const rulePlatformGlobalsBanBroker = (): TSESLint.RuleModule<'platformGlobal'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban a runtime use of a platform global (a browser or Node ambient) outside the gateway. Import the wrapped replacement from the gateway package for the current platform instead.',
    },
    messages: {
      platformGlobal:
        'Platform global "{{name}}" is not allowed outside the gateway. Import it from "{{gatewayPath}}" instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;

    if (filename.length === 0 || isInsideGatewayLayerBroker({ filename })) {
      return {};
    }

    // Names passed as the first argument of a browser-side Playwright call, and the reports held
    // back because their identifier sits inside a named function — both settled at Program:exit,
    // since a function is usually declared above the call that ships it to the browser.
    const browserFunctionNames = new Set<string>();
    const heldReportNames = new Map<TSESTree.Node, string[]>();
    const heldReportData = new Map<TSESTree.Node, Record<PropertyKey, unknown>>();

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const [firstArgument] = node.arguments;
        if (
          firstArgument?.type === AST_NODE_TYPES.Identifier &&
          isPageCallbackCallLayerBroker({ node })
        ) {
          browserFunctionNames.add(firstArgument.name);
        }
      },
      'Program:exit': (): void => {
        for (const [target, names] of heldReportNames) {
          if (!names.some((name) => browserFunctionNames.has(name))) {
            ctx.report({
              node: target,
              messageId: 'platformGlobal',
              data: heldReportData.get(target) ?? {},
            });
          }
        }
      },
      Identifier: (node: TSESTree.Identifier): void => {
        if (EXEMPT_NAMES.has(node.name)) {
          return;
        }

        if (isTypePositionLayerBroker({ node }) || isObjectLiteralKeyLabelLayerBroker({ node })) {
          return;
        }

        const target = propertyIdentifierToCheckLayerBroker({ node });
        if (target === undefined) {
          return;
        }

        const declarationFileName = typedParserServicesTransformer({ context, node: target });

        if (
          declarationFileName === undefined ||
          !isBannedPlatformDeclarationFileGuard({ fileName: declarationFileName })
        ) {
          return;
        }

        // Still gates on a resolvable repo root — a file outside any repo reports nothing — but
        // the resolved scope itself no longer appears in the suggested path below.
        const scope = resolveGatewayScopeLayerBroker({ filename });
        if (scope === undefined) {
          return;
        }
        const platform = resolvePackagePlatformLayerBroker({ filename });
        const identifierName = node.name;
        // 'Buffer' the ambient global class spells its own wrapped module 'buffer' lowercase —
        // fall back to the lowercase form only when IT is a real Node builtin, so 'process' and
        // 'crypto' (already lowercase builtins) are untouched and 'setTimeout' (lowercase but not
        // a builtin) keeps its camelCase spelling.
        const lowercasedName = identifierName.toLowerCase();
        const subpath =
          platform === gatewayLocationsStatics.folders.node &&
          builtinModules.some((moduleName) => moduleName === lowercasedName)
            ? lowercasedName
            : identifierName;
        const gatewayPath = `${gatewayLocationsStatics.importPrefix}/${platform}/${subpath}`;

        if (isInsideInlinePageCallbackLayerBroker({ node: target })) {
          return;
        }

        const enclosingNames = enclosingFunctionBindingNamesLayerBroker({ node: target });
        if (enclosingNames.length > 0) {
          heldReportNames.set(target, enclosingNames);
          heldReportData.set(target, { name: identifierName, gatewayPath });
          return;
        }

        ctx.report({
          node: target,
          messageId: 'platformGlobal',
          data: { name: identifierName, gatewayPath },
        });
      },
    };
  },
});
