import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemperatureRecordDto } from './dto/create-temperature-record.dto';
import { AlertDanger, AlertType, Food, TemperatureRecord } from '@prisma/client';

type TemperatureAlert = { type: AlertType; danger: AlertDanger };

@Injectable()   
export class TemperatureRecordService {
    constructor(private readonly prisma: PrismaService) {}

    private async calcTemperatureErrorMargin(food: Food): Promise<number> {
        const temperatureDiff = food.tempMax - food.tempMin;
        const errorMargin = temperatureDiff * 0.3;

        return errorMargin;
    }

    private async createTemperatureAlert( food: Food, temperature: number, ): Promise<TemperatureAlert | undefined> {
        const temperatureErrorMargin = await this.calcTemperatureErrorMargin(food);

        let alertData: TemperatureAlert | undefined = undefined;

        if (temperature < food.tempMin) {
            alertData = { type: AlertType.BELOW_MIN, danger: AlertDanger.CRITICAL };
        }

        else if (temperature > food.tempMax) {
            alertData = { type: AlertType.ABOVE_MAX, danger: AlertDanger.CRITICAL };
        }

        else if (temperature < food.tempMin + temperatureErrorMargin) {
            alertData = { type: AlertType.NEXT_MIN, danger: AlertDanger.ALERT };
        }

        else if (temperature > food.tempMax - temperatureErrorMargin) {
            alertData = { type: AlertType.NEXT_MAX, danger: AlertDanger.ALERT };
        }

        return alertData;
    }

    async create(dto: CreateTemperatureRecordDto, userId: string): Promise<TemperatureRecord> {
        const food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
        if (!food) throw new NotFoundException('Alimento não encontrado');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        
        return this.prisma.$transaction(async (tx) => {
            const newTemperatureRecord = await tx.temperatureRecord.create({
                data: {
                    foodId: dto.foodId,
                    userId,
                    temperature: dto.temperature,
                },
            });

            const rawAlert = await this.createTemperatureAlert(food, dto.temperature);

            if (rawAlert) {
                await tx.alert.create({
                    data: {
                        ...rawAlert,
                        temperatureRecordId: newTemperatureRecord.id,
                    },
                });
            }

            return newTemperatureRecord;
        })
    }
}
