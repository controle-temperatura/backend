import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
    async generatePdf(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, {
                waitUntil: 'networkidle0',
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '24px',
                    right: '24px',
                    bottom: '24px',
                    left: '24px',
                },
                printBackground: true,
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }
}