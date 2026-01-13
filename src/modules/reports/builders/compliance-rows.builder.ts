import dayjs from '../../../common/utils/dayjs.config';

interface ComplianceRecord {
    createdAt: Date;
    temperature: number;
    food: {
        name: string;
        tempMin: number;
        tempMax: number;
        sector: {
            name: string;
        };
    } | null;
    user: {
        name: string;
        role: string;
    } | null;
    alert?: {
        type: string;
        danger: string;
        resolved: boolean;
        resolvedAt?: Date | null;
        resolvedBy?: {
            name: string;
        } | null;
        correctiveAction?: string | null;
    } | null;
}

export function buildComplianceRows(records: ComplianceRecord[]): string {
    return records
        .map((record) => {
            const dateTime = formatDateTime(record.createdAt);
            const sector = record.food?.sector?.name || '—';
            const food = record.food?.name || '—';
            const measuredTemp = record.temperature != null ? record.temperature.toFixed(1) : '—';
            const tempMin = record.food?.tempMin != null ? record.food.tempMin.toFixed(1) : '—';
            const tempMax = record.food?.tempMax != null ? record.food.tempMax.toFixed(1) : '—';
            const allowedRange = `${tempMin} a ${tempMax}`;
            const status = determineStatus(record);
            const correctiveAction = record.alert?.correctiveAction || '—';
            const responsible = record.user?.name || '—';

            return `
                <tr>
                    <td>${dateTime}</td>
                    <td>${sector}</td>
                    <td>${food}</td>
                    <td>${measuredTemp}</td>
                    <td>${allowedRange}</td>
                    <td>${status}</td>
                    <td>${correctiveAction}</td>
                    <td>${responsible}</td>
                </tr>
            `;
        })
        .join('');
}

function formatDateTime(date: Date): string {
    if (!date) return '—';
    return dayjs(date).format('DD/MM/YYYY HH:mm');
}

function determineStatus(record: ComplianceRecord): string {
    if (!record.alert) {
        return 'Conforme';
    }
    
    if (record.alert.danger === 'CRITICAL') {
        return 'Não Conforme';
    }
    
    return 'Parcialmente Conforme';
}
