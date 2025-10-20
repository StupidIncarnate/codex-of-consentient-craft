import {
  type TsconfigOptions,
  tsconfigOptionsContract,
} from '../../../contracts/tsconfig-options/tsconfig-options-contract';

export const configTsconfigBroker = (): TsconfigOptions =>
  tsconfigOptionsContract.parse({
    target: 'ES2020',
    module: 'commonjs',
    lib: ['ES2020'],
    strict: true,
    noEmit: false,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    moduleResolution: 'node',
    allowJs: false,
    checkJs: false,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    allowUnreachableCode: false,
    noImplicitAny: true,
    strictNullChecks: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    declaration: true,
    declarationMap: true,
  });
