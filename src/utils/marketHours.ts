export interface ExecutionInfo {
  executionDate: string;
  status: 'EXECUTED' | 'SCHEDULED';
}

function getETDateParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  const weekdayStr = get('weekday');
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    weekday: weekdayMap[weekdayStr] ?? 0,
  };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getETDateString(date: Date): string {
  const { year, month, day } = getETDateParts(date);
  return formatDate(year, month, day);
}

export function getExecutionInfo(now: Date): ExecutionInfo {
  const { hour, minute, weekday } = getETDateParts(now);

  // Saturday -> schedule for Monday (+2)
  if (weekday === 6) {
    return {
      executionDate: getETDateString(addDays(now, 2)),
      status: 'SCHEDULED',
    };
  }

  // Sunday -> schedule for Monday (+1)
  if (weekday === 0) {
    return {
      executionDate: getETDateString(addDays(now, 1)),
      status: 'SCHEDULED',
    };
  }

  // Weekday
  const totalMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;   // 9:30 AM
  const marketClose = 16 * 60;       // 4:00 PM

  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    // During market hours -> EXECUTED today
    return {
      executionDate: getETDateString(now),
      status: 'EXECUTED',
    };
  }

  if (totalMinutes < marketOpen) {
    // Before market open -> SCHEDULED today (executes at open)
    return {
      executionDate: getETDateString(now),
      status: 'SCHEDULED',
    };
  }

  // After market close -> schedule for next trading day
  // If Friday after close, next trading day is Monday (+3)
  // Otherwise next day (+1)
  const daysToAdd = weekday === 5 ? 3 : 1;
  return {
    executionDate: getETDateString(addDays(now, daysToAdd)),
    status: 'SCHEDULED',
  };
}
