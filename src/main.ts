import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import './common/utils/dayjs.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = app.get(ConfigService);
    const clientUrl = config.get<string>('CLIENT_URL');

    app.setGlobalPrefix('api');

    app.enableCors({
        origin: "*",
        credentials: true,
    });

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.listen(config.get<number>('PORT') || 3000);
}
bootstrap();
