import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BroadcastTarget, CreateBroadcastDto } from './dto/create-broadcast.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BroadcastsService {
    constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) {}

    async createBroadcast(createBroadcastDto: CreateBroadcastDto) {

        const mailsToSend: string[] = [];
        if (createBroadcastDto.targetType === BroadcastTarget.COMPANY) {
            const company = await this.prisma.company.findUnique({
                where: {
                    id: createBroadcastDto.companyId,
                },
                include: {
                    owner: true,
                },
            });
            mailsToSend.push(company?.owner?.email ?? '');
        } else {
            const companies = await this.prisma.company.findMany({
                select: {
                    owner: {
                        select: {
                            email: true,
                        },
                    },
                }
            });
            mailsToSend.push(...companies.map(company => company.owner?.email ?? ''));
        }

        for (const mail of mailsToSend) {
            await this.mailService.sendBroadcastEmail({
                email: mail,
                title: createBroadcastDto.title,
                message: createBroadcastDto.message,
            });
        }

        const broadcast = await this.prisma.broadcastMessage.create({
            data: {
                ...createBroadcastDto,
                targetType: createBroadcastDto.targetType as BroadcastTarget,
            }
        });
        return broadcast;
    }

    async getBroadcasts() {
        return this.prisma.broadcastMessage.findMany();
    }

    async getRecievers() {
        const [companies, latestGlobal] = await Promise.all([
            this.prisma.company.findMany({
                select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    owner: { select: { name: true } },
                    broadcastMessages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { title: true, createdAt: true },
                    },
                },
            }),
            this.prisma.broadcastMessage.findFirst({
                where: { targetType: 'ALL' },
                orderBy: { createdAt: 'desc' },
                select: { title: true, createdAt: true },
            }),
        ]);

        return companies.map((c) => {
            const companyMsg = c.broadcastMessages[0];
            const latest =
                !companyMsg && latestGlobal ? latestGlobal
                : !latestGlobal && companyMsg ? companyMsg
                : companyMsg && latestGlobal && latestGlobal.createdAt > companyMsg.createdAt ? latestGlobal
                : companyMsg ?? null;

            return {
                companyId: c.id,
                companyName: c.name,
                companyLogoUrl: c.logoUrl ?? '',
                ownerName: c.owner?.name ?? '',
                lastMessage: latest?.title,
                lastMessageAt: latest?.createdAt?.toISOString(),
            };
        });
    }

    async getBroadcast(companyId: string) {
        const [company, broadcasts] = await Promise.all([
            this.prisma.company.findUnique({
                where: { id: companyId },
                select: {
                    name: true,
                    logoUrl: true,
                    owner: { select: { name: true } },
                },
            }),
            this.prisma.broadcastMessage.findMany({
                where: {
                    OR: [
                        { companyId },
                        { targetType: 'ALL' },
                    ],
                },
                orderBy: { createdAt: 'asc' },
                select: { id: true, title: true, message: true, createdAt: true, targetType: true },
            }),
        ]);

        return {
            company: {
                companyName: company?.name ?? '',
                companyLogoUrl: company?.logoUrl ?? '',
                ownerName: company?.owner?.name ?? '',
            },
            messages: broadcasts.map((b) => ({
                id: b.id,
                title: b.title,
                content: b.message,
                sentAt: b.createdAt.toISOString(),
                sentBy: 'ADMIN' as const,
            })),
        };
    }
}
