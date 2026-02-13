export function calcDeviation(temperature: any, tempMin: any, tempMax: any): number {
    const closest = Math.abs(temperature - tempMin) < Math.abs(temperature - tempMax) ? tempMin : tempMax;
    return temperature - closest;
}