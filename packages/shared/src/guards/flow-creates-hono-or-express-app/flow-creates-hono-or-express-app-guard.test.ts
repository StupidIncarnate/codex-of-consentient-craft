import { flowCreatesHonoOrExpressAppGuard } from './flow-creates-hono-or-express-app-guard';

describe('flowCreatesHonoOrExpressAppGuard', () => {
  describe('true cases', () => {
    it('VALID: content constructs new Hono() => returns true', () => {
      const result = flowCreatesHonoOrExpressAppGuard({
        flowFileContent: "import { Hono } from '#gateway/npm/hono';\nconst app = new Hono();",
      });

      expect(result).toBe(true);
    });

    it('VALID: content constructs new Hono() from raw hono import => returns true', () => {
      const result = flowCreatesHonoOrExpressAppGuard({
        flowFileContent: "import { Hono } from 'hono';\nconst app = new Hono();",
      });

      expect(result).toBe(true);
    });

    it('VALID: content calls express() => returns true', () => {
      const result = flowCreatesHonoOrExpressAppGuard({
        flowFileContent: "import express from 'express';\nconst app = express();",
      });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: content imports Hono but never constructs one => returns false', () => {
      const result = flowCreatesHonoOrExpressAppGuard({
        flowFileContent: "import type { Hono } from '#gateway/npm/hono';\nexport type App = Hono;",
      });

      expect(result).toBe(false);
    });

    it('INVALID: content has no Hono or express construction => returns false', () => {
      const result = flowCreatesHonoOrExpressAppGuard({
        flowFileContent: "import { ToolRegistration } from '../contracts';",
      });

      expect(result).toBe(false);
    });

    it('EMPTY: flowFileContent is empty string => returns false', () => {
      const result = flowCreatesHonoOrExpressAppGuard({ flowFileContent: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: flowFileContent is undefined => returns false', () => {
      const result = flowCreatesHonoOrExpressAppGuard({});

      expect(result).toBe(false);
    });
  });
});
