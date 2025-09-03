import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

export interface PingConfig {
  formUrl?: string;
  nameSelector?: string;
  emailSelector?: string;
  messageSelector?: string;
  submitSelector?: string;
  successRegex?: string;
}

export class FormPinger {
  private readonly config: Required<PingConfig>;

  constructor(config: PingConfig = {}) {
    this.config = {
      formUrl: config.formUrl || process.env.FORM_URL || 'https://southbrook-tech.com/synthetic-test/',
      nameSelector: config.nameSelector || process.env.NAME_SELECTOR || 'input[name="acf[field_68b77d4b373eb]"]',
      emailSelector: config.emailSelector || process.env.EMAIL_SELECTOR || 'input[name="acf[field_68b77d4b37428]"]',
      messageSelector: config.messageSelector || process.env.MESSAGE_SELECTOR || 'textarea[name="acf[field_68b77d4b37499]"]',
      submitSelector: config.submitSelector || process.env.SUBMIT_SELECTOR || 'button[type="submit"]',
      successRegex: config.successRegex || process.env.SUCCESS_REGEX || 'Successfully submitted.'
    };
  }

  async ping(): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      console.log('Starting weekly form ping...');
      console.log('Form URL:', this.config.formUrl.replace(/([?&].*)/g, '?[hidden]'));

      browser = await chromium.launch();
      page = await browser.newPage();

      await page.goto(this.config.formUrl, { waitUntil: 'domcontentloaded' });
      console.log('Page loaded successfully');

      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const nameField = page.locator(this.config.nameSelector).first();
      await nameField.waitFor({ state: 'visible', timeout: 10000 });
      await nameField.fill('Weekly Monitor Test');
      console.log('Name field filled');

      const emailField = page.locator(this.config.emailSelector).first();
      await emailField.waitFor({ state: 'visible', timeout: 10000 });
      await emailField.fill('weekly-test@example.com');
      console.log('Email field filled');

      const messageField = page.locator(this.config.messageSelector).first();
      await messageField.waitFor({ state: 'visible', timeout: 10000 });
      await messageField.fill('This is an automated weekly monitoring test. Please ignore this message.');
      console.log('Message field filled');

      const submitButton = page.locator(this.config.submitSelector).first();
      await submitButton.waitFor({ state: 'visible', timeout: 10000 });
      await submitButton.click();
      console.log('Form submitted');

      await page.waitForLoadState('networkidle', { timeout: 15000 });

      const successRegex = new RegExp(this.config.successRegex, 'i');
      const successElement = page.locator(`text=${successRegex}`);

      await successElement.waitFor({
        state: 'visible',
        timeout: 15000
      });

      console.log('✅ Form submission successful - success message found');

    } catch (error) {
      console.error('❌ Form ping failed:', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    }
  }
}

export async function runFormPing(config?: PingConfig): Promise<void> {
  const pinger = new FormPinger(config);
  await pinger.ping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFormPing().catch(error => {
    console.error('Form ping failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}