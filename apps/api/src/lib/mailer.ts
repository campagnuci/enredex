import type { FastifyBaseLogger } from "fastify";
import nodemailer, { type Transporter } from "nodemailer";
import type { AppConfig } from "../config.js";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Dev default: logs emails through Pino instead of sending them. */
class ConsoleMailer implements Mailer {
  constructor(
    private readonly from: string,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async send(mail: Mail): Promise<void> {
    this.logger.info(
      { mail: { from: this.from, ...mail } },
      "email (console transport)",
    );
  }
}

class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport(smtpUrl);
  }

  async send(mail: Mail): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...mail });
  }
}

/** Pluggable mailer: SMTP when SMTP_URL is set, console otherwise. */
export function createMailer(
  config: AppConfig,
  logger: FastifyBaseLogger,
): Mailer {
  if (config.SMTP_URL) return new SmtpMailer(config.SMTP_URL, config.EMAIL_FROM);
  return new ConsoleMailer(config.EMAIL_FROM, logger);
}
