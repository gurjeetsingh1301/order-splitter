import { describe, expect, it } from 'vitest';
import { getExecutionInfo } from './marketHours.js';

// Helper: create a Date at a specific ET time
// Since we can't set TZ in Node without env, we use UTC offsets:
// ET is UTC-5 (EST) or UTC-4 (EDT)
// For test dates in April 2026, ET = UTC-4 (EDT)

function makeETDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Create date in UTC such that when converted to ET (UTC-4 in summer), it shows desired time
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute));
}

describe('getExecutionInfo', () => {
  it('returns EXECUTED during market hours (weekday 10:00 AM ET)', () => {
    // Monday April 6, 2026, 10:00 AM ET
    const date = makeETDate(2026, 4, 6, 10, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('EXECUTED');
    expect(result.executionDate).toBe('2026-04-06');
  });

  it('returns SCHEDULED before market open (weekday 8:00 AM ET)', () => {
    // Monday April 6, 2026, 8:00 AM ET
    const date = makeETDate(2026, 4, 6, 8, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
    expect(result.executionDate).toBe('2026-04-06');
  });

  it('returns SCHEDULED after market close (weekday 5:00 PM ET)', () => {
    // Monday April 6, 2026, 5:00 PM ET
    const date = makeETDate(2026, 4, 6, 17, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
    expect(result.executionDate).toBe('2026-04-07');
  });

  it('returns SCHEDULED for Saturday -> Monday', () => {
    // Saturday April 4, 2026, 12:00 PM ET
    const date = makeETDate(2026, 4, 4, 12, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
    expect(result.executionDate).toBe('2026-04-06');
  });

  it('returns SCHEDULED for Sunday -> Monday', () => {
    // Sunday April 5, 2026, 12:00 PM ET
    const date = makeETDate(2026, 4, 5, 12, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
    expect(result.executionDate).toBe('2026-04-06');
  });

  it('schedules for Monday when Friday after close', () => {
    // Friday April 3, 2026, 5:00 PM ET
    const date = makeETDate(2026, 4, 3, 17, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
    expect(result.executionDate).toBe('2026-04-06');
  });

  it('handles market open boundary (exactly 9:30 AM ET = EXECUTED)', () => {
    const date = makeETDate(2026, 4, 6, 9, 30);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('EXECUTED');
  });

  it('handles market close boundary (exactly 4:00 PM ET = SCHEDULED)', () => {
    const date = makeETDate(2026, 4, 6, 16, 0);
    const result = getExecutionInfo(date);
    expect(result.status).toBe('SCHEDULED');
  });
});
