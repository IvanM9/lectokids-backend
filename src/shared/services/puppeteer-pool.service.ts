import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(PuppeteerPoolService.name);
  private browser: Browser | null = null;
  private isInitializing = false;
  private activePagesCount = 0;
  private readonly maxPages = 10;

  async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isInitializing) {
      await this.waitForInitialization();
      return this.browser!;
    }

    this.isInitializing = true;

    try {
      this.logger.log('Launching new Puppeteer browser instance');
      this.browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        headless: true,
      });

      this.browser.on('disconnected', () => {
        this.logger.warn(
          'Browser disconnected, will create new instance on next request',
        );
        this.browser = null;
        this.activePagesCount = 0;
      });

      this.logger.log('Puppeteer browser launched successfully');
    } catch (error) {
      this.logger.error('Failed to launch Puppeteer browser', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }

    return this.browser;
  }

  async generatePDF(html: string, options: any = {}): Promise<Buffer> {
    if (this.activePagesCount >= this.maxPages) {
      throw new Error('Maximum number of concurrent PDF generations reached');
    }

    const browser = await this.getBrowser();
    let page: Page | null = null;

    try {
      this.activePagesCount++;
      this.logger.debug(
        `Creating new page (active pages: ${this.activePagesCount})`,
      );

      page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const defaultOptions = {
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      };

      const pdfOptions = { ...defaultOptions, ...options };
      const buffer = await page.pdf(pdfOptions);

      this.logger.debug('PDF generated successfully');
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('Error generating PDF', error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
          this.logger.debug(
            `Page closed (active pages: ${this.activePagesCount - 1})`,
          );
        } catch (closeError) {
          this.logger.warn('Error closing page', closeError);
        }
      }
      this.activePagesCount--;
    }
  }

  private async waitForInitialization(): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waitedTime = 0;

    while (this.isInitializing && waitedTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    if (this.isInitializing) {
      throw new Error('Timeout waiting for browser initialization');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const browser = await this.getBrowser();
      return browser.connected;
    } catch (error) {
      this.logger.error('Browser health check failed', error);
      return false;
    }
  }

  async getActivePagesCount(): Promise<number> {
    return this.activePagesCount;
  }

  async gracefulShutdown(): Promise<void> {
    this.logger.log('Starting graceful shutdown of Puppeteer browser');

    if (this.browser && this.browser.connected) {
      try {
        await this.browser.close();
        this.logger.log('Puppeteer browser closed successfully');
      } catch (error) {
        this.logger.error('Error closing Puppeteer browser', error);
      }
    }

    this.browser = null;
    this.activePagesCount = 0;
  }

  async onModuleDestroy() {
    await this.gracefulShutdown();
  }
}
