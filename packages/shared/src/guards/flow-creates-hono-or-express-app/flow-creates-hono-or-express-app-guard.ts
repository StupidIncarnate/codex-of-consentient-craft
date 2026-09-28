/**
 * PURPOSE: Returns true when a flow file's content constructs a Hono or Express app (`new Hono(`
 * or `express(`), the content-based counterpart to `hasHonoOrExpressAdapterGuard`. A package that
 * reaches Hono through `#gateway/npm/hono` rather than through its own `src/adapters/hono/` folder
 * carries no adapter-dir-name signal at all, so http-backend detection needs both.
 *
 * USAGE:
 * flowCreatesHonoOrExpressAppGuard({ flowFileContent: "const app = new Hono();" });
 * // Returns true — a Hono app is constructed
 */

const HONO_APP_PATTERN = /\bnew\s+Hono\s*\(/u;
const EXPRESS_APP_PATTERN = /\bexpress\s*\(\s*\)/u;

export const flowCreatesHonoOrExpressAppGuard = ({
  flowFileContent,
}: {
  flowFileContent?: string;
}): boolean => {
  if (flowFileContent === undefined) {
    return false;
  }
  return HONO_APP_PATTERN.test(flowFileContent) || EXPRESS_APP_PATTERN.test(flowFileContent);
};
