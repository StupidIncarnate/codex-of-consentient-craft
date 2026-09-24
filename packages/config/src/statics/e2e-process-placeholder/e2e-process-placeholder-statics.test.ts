import { e2eProcessPlaceholderStatics } from './e2e-process-placeholder-statics';

describe('e2eProcessPlaceholderStatics', () => {
  it('VALID: exported value => matches the seeded devServer.e2e.processes entry', () => {
    expect(e2eProcessPlaceholderStatics).toStrictEqual({
      process: {
        name: 'app',
        command: 'npm run dev:no-watch',
        portRole: 'api',
        readyPath: '/',
        env: {
          PORT: '{apiPort}',
        },
      },
    });
  });
});
