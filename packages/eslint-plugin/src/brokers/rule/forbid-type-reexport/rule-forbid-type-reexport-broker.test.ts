import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleForbidTypeReexportBroker } from './rule-forbid-type-reexport-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('forbid-type-reexport', ruleForbidTypeReexportBroker(), {
  valid: [
    {
      code: `
        import type { User } from './user-contract';
        export const getUserName = ({user}: {user: User}): string => user.name;
      `,
      filename: '/project/src/brokers/user/user-broker.ts',
    },
    {
      code: `
        import type { Product } from './product-contract';
        export type ProductList = Product[];
      `,
      filename: '/project/src/contracts/product-list/product-list-contract.ts',
    },
    {
      code: `
        import type { User } from './user-contract';
        export type { User } from './user-contract';
      `,
      filename: '/project/src/index.ts',
    },
    {
      code: `
        import type { Config } from './config-contract';
        export type AppConfig = Config & { version: string };
      `,
      filename: '/project/src/contracts/app-config/app-config-contract.ts',
    },
    {
      code: `
        import { someFunction } from './utils';
        export { someFunction };
      `,
      filename: '/project/src/brokers/util/util-broker.ts',
    },
  ],
  invalid: [
    {
      code: `
        import type { User } from './user-contract';
        export type { User };
      `,
      filename: '/project/src/brokers/user/user-broker.ts',
      errors: [{ messageId: 'noTypeReexport' }],
    },
    {
      code: `
        import type { Product, Category } from './types';
        export type { Product, Category };
      `,
      filename: '/project/src/contracts/product/product-contract.ts',
      errors: [{ messageId: 'noTypeReexport' }, { messageId: 'noTypeReexport' }],
    },
    {
      code: `
        import type { UserRole } from './role-contract';
        export type { UserRole } from './role-contract';
      `,
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'noTypeReexport' }],
    },
    {
      code: `
        import type { ApiResponse } from './api-contract';
        const data = {};
        export type { ApiResponse };
      `,
      filename: '/project/src/transformers/api/api-transformer.ts',
      errors: [{ messageId: 'noTypeReexport' }],
    },
  ],
});
