/**
 * PURPOSE: Flags a runtime use, outside the gateway, of an identifier that resolves — via the
 * TypeScript type checker — to a declaration in `lib.dom*.d.ts`, `lib.webworker*.d.ts` or
 * `@types/node`. ES built-ins (`JSON`, `Math`, `Promise`, …) live in `lib.es*.d.ts` and are never
 * flagged; a type position (`Buffer` as a parameter type, `NodeJS.ErrnoException`) is exempt because
 * a type never runs. This needs the type checker, so — unlike every other rule broker here — it
 * resolves a real symbol through `eslintTypedParserServicesAdapter` rather than relying on file-path
 * or `/src/` gates the way post-edit rules do.
 *
 * USAGE:
 * const rule = rulePlatformGlobalsBanBroker();
 * // Returns ESLint rule that flags `process.stdout.write(...)` outside @dungeonmaster/node,
 * // suggesting `import { stdout } from '@dungeonmaster/node/process'`
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { eslintTypedParserServicesAdapter } from '../../../adapters/eslint/typed-parser-services/eslint-typed-parser-services-adapter';
import { isBannedPlatformDeclarationFileGuard } from '../../../guards/is-banned-platform-declaration-file/is-banned-platform-declaration-file-guard';
import { isInsideGatewayLayerBroker } from './is-inside-gateway-layer-broker';
import { isTypePositionLayerBroker } from './is-type-position-layer-broker';
import { isObjectLiteralKeyLabelLayerBroker } from './is-object-literal-key-label-layer-broker';
import { propertyIdentifierToCheckLayerBroker } from './property-identifier-to-check-layer-broker';
import { resolvePackagePlatformLayerBroker } from './resolve-package-platform-layer-broker';
import { resolveGatewayScopeLayerBroker } from './resolve-gateway-scope-layer-broker';

// CommonJS module-scope values: each module gets its own copy (`__dirname` is the calling file's
// own folder), so exporting one from the gateway would describe the gateway's folder instead —
// the one exemption the design doc carves out of the globals rule by name.
const EXEMPT_NAMES = new Set(['require', '__dirname', '__filename']);

export const rulePlatformGlobalsBanBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.getFilename?.() ?? '';

    if (filename.length === 0 || isInsideGatewayLayerBroker({ filename })) {
      return {};
    }

    return {
      Identifier: (node: Tsestree): void => {
        if (node.name === undefined || EXEMPT_NAMES.has(String(node.name))) {
          return;
        }

        if (isTypePositionLayerBroker({ node }) || isObjectLiteralKeyLabelLayerBroker({ node })) {
          return;
        }

        const target = propertyIdentifierToCheckLayerBroker({ node });
        if (target === undefined) {
          return;
        }

        const declarationFileName = eslintTypedParserServicesAdapter({ context, node: target });

        if (
          declarationFileName === undefined ||
          !isBannedPlatformDeclarationFileGuard({ fileName: declarationFileName })
        ) {
          return;
        }

        const scope = resolveGatewayScopeLayerBroker({ filename });
        if (scope === undefined) {
          return;
        }
        const platform = resolvePackagePlatformLayerBroker({ filename });
        const gatewayPath = `${scope}/${platform}/${String(target.name)}`;

        ctx.report({
          node: target,
          messageId: 'platformGlobal',
          data: { name: String(target.name), gatewayPath },
        });
      },
    };
  },
});
