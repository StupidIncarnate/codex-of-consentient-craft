// Example 5: External Service SDK - Email Provider (SendGrid/Mailgun) Mocking
// This demonstrates mocking third-party service SDKs with complex APIs

import { sendgridSendEmailAdapter } from './sendgrid-send-email-adapter';
import { EmailAddressStub } from '../../contracts/email-address/email-address.stub';
import { EmailSubjectStub } from '../../contracts/email-subject/email-subject.stub';
import { EmailBodyStub } from '../../contracts/email-body/email-body.stub';
import { EmailSendResultStub } from '../../contracts/email-send-result/email-send-result.stub';
import { emailSendResultContract } from '../../contracts/email-send-result/email-send-result-contract';

// Mock the SendGrid SDK
jest.mock('@sendgrid/mail');
import sgMail from '@sendgrid/mail';
const mockSgMail = jest.mocked(sgMail);

describe('sendgridSendEmailAdapter', () => {
  it('VALID: {to: "user@test.com", subject: "Welcome", body: "Hello"} => sends email successfully', async () => {
    // Arrange: Setup test data with branded types
    const to = EmailAddressStub('user@test.com');
    const subject = EmailSubjectStub('Welcome');
    const body = EmailBodyStub('Hello');

    const expectedResult = EmailSendResultStub({
      sent: true,
      messageId: emailSendResultContract.shape.messageId.parse('msg_123abc'),
    });

    // Mock SendGrid's send method
    // SendGrid returns an array: [ClientResponse, {}]
    mockSgMail.send.mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
      {},
    ]);

    // Act
    const result = await sendgridSendEmailAdapter({ to, subject, body });

    // Assert: Test complete result
    expect(result).toStrictEqual(expectedResult);
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      to,
      from: 'noreply@example.com',
      subject,
      text: body,
    });
  });

  it('VALID: {to: "admin@test.com", subject: "Alert", body: "System warning"} => sends different email', async () => {
    const to = EmailAddressStub('admin@test.com');
    const subject = EmailSubjectStub('Alert');
    const body = EmailBodyStub('System warning');

    const expectedResult = EmailSendResultStub({
      sent: true,
      messageId: emailSendResultContract.shape.messageId.parse('msg_456def'),
    });

    mockSgMail.send.mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
      {},
    ]);

    const result = await sendgridSendEmailAdapter({ to, subject, body });

    expect(result).toStrictEqual(expectedResult);
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      to,
      from: 'noreply@example.com',
      subject,
      text: body,
    });
  });

  it('ERROR: {to: "invalid-email"} => throws validation error', async () => {
    const to = EmailAddressStub('user@test.com');
    const subject = EmailSubjectStub('Test');
    const body = EmailBodyStub('Test body');

    // Mock SendGrid API validation error
    mockSgMail.send.mockRejectedValue(new Error('Invalid email address'));

    await expect(sendgridSendEmailAdapter({ to, subject, body })).rejects.toThrow(
      'Invalid email address',
    );
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
  });

  it('ERROR: {to: valid, subject: valid, body: valid} => throws rate limit error', async () => {
    const to = EmailAddressStub('user@test.com');
    const subject = EmailSubjectStub('Test');
    const body = EmailBodyStub('Test body');

    // Mock SendGrid rate limiting
    mockSgMail.send.mockRejectedValue(new Error('Rate limit exceeded'));

    await expect(sendgridSendEmailAdapter({ to, subject, body })).rejects.toThrow(
      'Rate limit exceeded',
    );
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
  });

  it('ERROR: {to: valid, subject: valid, body: valid} => throws API key error', async () => {
    const to = EmailAddressStub('user@test.com');
    const subject = EmailSubjectStub('Test');
    const body = EmailBodyStub('Test body');

    // Mock SendGrid authentication failure
    mockSgMail.send.mockRejectedValue(new Error('Invalid API key'));

    await expect(sendgridSendEmailAdapter({ to, subject, body })).rejects.toThrow(
      'Invalid API key',
    );
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      to,
      from: 'noreply@example.com',
      subject,
      text: body,
    });
  });

  it('EDGE: {body: ""} => sends email with empty body', async () => {
    // Tests edge case of empty email body
    const to = EmailAddressStub('user@test.com');
    const subject = EmailSubjectStub('No content');
    const body = EmailBodyStub('');

    const expectedResult = EmailSendResultStub({
      sent: true,
      messageId: emailSendResultContract.shape.messageId.parse('msg_empty'),
    });

    mockSgMail.send.mockResolvedValue([
      {
        statusCode: 202,
        body: '',
        headers: {},
      },
      {},
    ]);

    const result = await sendgridSendEmailAdapter({ to, subject, body });

    expect(result).toStrictEqual(expectedResult);
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      to,
      from: 'noreply@example.com',
      subject,
      text: '',
    });
  });
});
