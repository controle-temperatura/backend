import { BadRequestException } from "@nestjs/common";
import * as dayjs from 'dayjs';

export function getDayBoundaries(date?: string | Date): { startOfDay: Date; endOfDay: Date } {
    const targetDate = date ? dayjs(date) : dayjs();

    if (!targetDate.isValid()) {
        throw new BadRequestException('Data inválida');
    }

    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    return { startOfDay, endOfDay };
}
