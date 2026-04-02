import { describe, expect, it } from 'vitest';
import { floorToDecimalPlaces, roundToDecimalPlaces } from './rounding.js';

describe('roundToDecimalPlaces', () => {
  it('rounds to 3 decimal places', () => {
    expect(roundToDecimalPlaces(1.23456, 3)).toBe(1.235);
  });

  it('rounds to 7 decimal places', () => {
    expect(roundToDecimalPlaces(1.123456789, 7)).toBe(1.1234568);
  });

  it('handles zero amount', () => {
    expect(roundToDecimalPlaces(0, 3)).toBe(0);
  });

  it('handles tiny values', () => {
    expect(roundToDecimalPlaces(0.0001234, 3)).toBe(0);
    expect(roundToDecimalPlaces(0.0001234, 7)).toBe(0.0001234);
  });
});

describe('floorToDecimalPlaces', () => {
  it('floors to 2 decimal places', () => {
    expect(floorToDecimalPlaces(1.999, 2)).toBe(1.99);
  });

  it('handles exact values', () => {
    expect(floorToDecimalPlaces(1.5, 2)).toBe(1.5);
  });
});
