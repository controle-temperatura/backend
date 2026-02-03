import { registerAs } from '@nestjs/config';

const mailConfig = registerAs('mail', () => {
    const port = Number(process.env.MAIL_PORT);

    return {
        host: process.env.MAIL_HOST,
        port: Number.isNaN(port) ? undefined : port,
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASSWORD,
        oauth: {
            clientId: process.env.MAIL_OAUTH_CLIENT_ID,
            clientSecret: process.env.MAIL_OAUTH_CLIENT_SECRET,
            refreshToken: process.env.MAIL_OAUTH_REFRESH_TOKEN,
        },
    };
});

export default mailConfig;
