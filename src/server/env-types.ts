/** Settings of the submission endpoint. All optional: nothing is sent anywhere until a destination is configured. */
export interface SubmissionEnv {
  /** Where each submission is posted as JSON. Any service that accepts a web address works. */
  SUBMISSION_WEBHOOK_URL?: string;
  /** Telegram bot token (from BotFather). Used with TELEGRAM_CHAT_ID to message the owner. Keep it a secret. */
  TELEGRAM_BOT_TOKEN?: string;
  /** Telegram conversation that receives each submission. */
  TELEGRAM_CHAT_ID?: string;
  /** Turnstile secret key. When set, a valid anti-bot token is required. */
  TURNSTILE_SECRET?: string;
}
