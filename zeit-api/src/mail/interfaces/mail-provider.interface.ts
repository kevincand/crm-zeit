export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  contactId?: string;
  unsubscribeUrl?: string;
}

export interface MailSendResult {
  messageId: string;
  success: boolean;
}

export const MAIL_PROVIDER = 'MAIL_PROVIDER';

export interface IMailProvider {
  sendMail(options: SendMailOptions): Promise<MailSendResult>;
}