import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { testFilePathVariantsTransformerProxy } from '../../../transformers/test-file-path-variants/test-file-path-variants-transformer.proxy';

/**
 * Proxy for enforce-implementation-colocation rule broker.
 * Delegates to fsExistsSyncAdapter proxy for file system mocking.
 * Transformer proxy is empty - transformers are pure functions.
 */
export const enforceImplementationColocationRuleBrokerProxy = (): {
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
  testFilePathVariants: ReturnType<typeof testFilePathVariantsTransformerProxy>;
} => ({
  fsExistsSync: fsExistsSyncAdapterProxy(),
  testFilePathVariants: testFilePathVariantsTransformerProxy(),
});
