/**
 * PURPOSE: Returns true when a flow file's content constructs a Hono or Express app (`new Hono(`
 * or `express(`), the content-based http-backend signal. A package reaching Hono through
 * `#gateway/npm/hono` is recognised by the flow that builds the app.
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
