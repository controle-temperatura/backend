import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { CreatePasswordEmailData, CreatePasswordEmailPayload } from './mail.types';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private templatesPath: string;
    private oauth2Client?: OAuth2Client;

    constructor(private readonly configService: ConfigService) {
        this.templatesPath = path.join(
            process.cwd(),
            'src',
            'modules',
            'mail',
            'templates'
        );

        const oauthClientId = this.configService.get<string>('mail.oauth.clientId');
        const oauthClientSecret = this.configService.get<string>('mail.oauth.clientSecret');
        const oauthRefreshToken = this.configService.get<string>('mail.oauth.refreshToken');
        const mailUser = this.configService.get<string>('mail.user');

        const useOauth =
            Boolean(oauthClientId) &&
            Boolean(oauthClientSecret) &&
            Boolean(oauthRefreshToken) &&
            Boolean(mailUser);

        if (useOauth) {
            this.oauth2Client = new google.auth.OAuth2(
                oauthClientId,
                oauthClientSecret,
                'https://developers.google.com/oauthplayground'
            );
            this.oauth2Client.setCredentials({
                refresh_token: oauthRefreshToken,
            });

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: mailUser,
                    clientId: oauthClientId,
                    clientSecret: oauthClientSecret,
                    refreshToken: oauthRefreshToken,
                },
            });
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('mail.host'),
            port: this.configService.get<number>('mail.port'),
            auth: {
                user: mailUser,
                pass: this.configService.get<string>('mail.password'),
            },
        });

    }

    async sendCreatePasswordEmail(payload: CreatePasswordEmailPayload & { companyShortName: string }) {
        const emailData: CreatePasswordEmailData = {
            name: payload.name,
            createPasswordUrl: `${this.configService.get<string>('CLIENT_URL')}/create-password?token=${payload.token}`,
            companyName: payload.companyName,
            logoUrl: payload.logoUrl,
        };
        const template = fs.readFileSync(path.join(this.templatesPath, 'create-password.hbs'), 'utf8');
        const compiledTemplate = hbs.compile(template);
        const html = compiledTemplate(emailData);

        await this.sendMail([payload.email, `Criar Senha - ${payload.companyShortName}`, html]);
    }

    private async sendMail([to, subject, html]: [string, string, string]): Promise<void> {
        try {
            let auth: nodemailer.SendMailOptions['auth'];

            if (this.oauth2Client) {
                const accessToken = await this.oauth2Client.getAccessToken();
                const accessTokenValue =
                    typeof accessToken === 'string' ? accessToken : accessToken?.token;

                auth = {
                    type: 'OAuth2',
                    user: this.configService.get<string>('mail.user'),
                    clientId: this.configService.get<string>('mail.oauth.clientId'),
                    clientSecret: this.configService.get<string>('mail.oauth.clientSecret'),
                    refreshToken: this.configService.get<string>('mail.oauth.refreshToken'),
                    accessToken: accessTokenValue,
                };
            }

            await this.transporter.sendMail({
                from: this.configService.get<string>('mail.user'),
                to,
                subject,
                html,
                auth,
            });
        } catch (error) {
            throw new Error(`Failed to send email: ${error}`);
        } finally {
            await this.transporter.close();
        }
    }
}
