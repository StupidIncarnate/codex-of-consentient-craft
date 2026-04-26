import { inflatedTaskNotificationContentContract } from './inflated-task-notification-content-contract';
import { InflatedTaskNotificationContentStub } from './inflated-task-notification-content.stub';

describe('inflatedTaskNotificationContentContract', (): void => {
  it('VALID: {default stub} => parses with taskNotification present', (): void => {
    const c = InflatedTaskNotificationContentStub();

    expect(c).toStrictEqual({
      taskNotification: { taskId: 't1', status: 'completed' },
    });
  });

  it('VALID: {empty object} => parses, taskNotification undefined', (): void => {
    const c = inflatedTaskNotificationContentContract.parse({});

    expect(c.taskNotification).toBe(undefined);
  });

  it('VALID: {extra keys} => preserved via passthrough', (): void => {
    const c = inflatedTaskNotificationContentContract.parse({
      taskNotification: { taskId: 't1' },
      otherXmlChild: 'foo',
    });

    expect((c as { otherXmlChild?: unknown }).otherXmlChild).toBe('foo');
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown =>
      inflatedTaskNotificationContentContract.parse('xml-not-inflated'),
    ).toThrow(/Expected object/u);
  });
});
