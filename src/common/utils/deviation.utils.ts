export function calcDeviation(temperature: number, tempMin: number, tempMax: number): number {
    const closest = Math.abs(temperature - tempMin) < Math.abs(temperature - tempMax) ? tempMin : tempMax;
    return temperature - closest;
}