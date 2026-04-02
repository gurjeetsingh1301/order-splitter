export function roundToDecimalPlaces(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

export function floorToDecimalPlaces(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.floor(value * factor) / factor;
}
