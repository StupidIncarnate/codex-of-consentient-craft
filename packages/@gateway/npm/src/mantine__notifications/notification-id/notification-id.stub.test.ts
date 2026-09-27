import { NotificationIdStub } from './notification-id.stub';

describe('NotificationIdStub', () => {
  it("VALID: {} => a real id in mantine's own id format", () => {
    const id = NotificationIdStub();

    expect(id).toMatch(/^mantine-[a-z0-9]+$/u);
  });
});
