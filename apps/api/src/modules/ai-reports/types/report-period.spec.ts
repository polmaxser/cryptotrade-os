import { dailyPeriod, monthlyPeriod, previousPeriod, weeklyPeriod } from './report-period';

describe('dailyPeriod', () => {
  it('bounds the UTC calendar day containing the reference, regardless of time of day', () => {
    const period = dailyPeriod(new Date('2026-03-15T18:42:00.000Z'));

    expect(period.from).toEqual(new Date('2026-03-15T00:00:00.000Z'));
    expect(period.to).toEqual(new Date('2026-03-16T00:00:00.000Z'));
  });
});

describe('weeklyPeriod', () => {
  it('always resolves to the Monday-Sunday week, regardless of which day the reference falls on', () => {
    const monday = new Date('2026-03-09T00:00:00.000Z');
    const sunday = new Date('2026-03-15T23:59:59.000Z');

    expect(weeklyPeriod(monday).from).toEqual(new Date('2026-03-09T00:00:00.000Z'));
    expect(weeklyPeriod(sunday).from).toEqual(new Date('2026-03-09T00:00:00.000Z'));
    expect(weeklyPeriod(sunday).to).toEqual(new Date('2026-03-16T00:00:00.000Z'));
  });
});

describe('monthlyPeriod', () => {
  it('bounds the calendar month, and rolls over the year in December', () => {
    const period = monthlyPeriod(new Date('2026-12-20T00:00:00.000Z'));

    expect(period.from).toEqual(new Date('2026-12-01T00:00:00.000Z'));
    expect(period.to).toEqual(new Date('2027-01-01T00:00:00.000Z'));
  });
});

describe('previousPeriod', () => {
  it('shifts a WEEKLY period back exactly 7 days', () => {
    const current = weeklyPeriod(new Date('2026-03-15T00:00:00.000Z'));
    const previous = previousPeriod('WEEKLY', current);

    expect(previous.from).toEqual(new Date('2026-03-02T00:00:00.000Z'));
    expect(previous.to).toEqual(new Date('2026-03-09T00:00:00.000Z'));
  });

  it('resolves a MONTHLY period to the correct prior calendar month, not a fixed-duration shift', () => {
    // The bug this guards against: current period is a 31-day month
    // (August), so shifting back by (to - from) would land one day short
    // of the true 1st of July. previousPeriod must re-derive July's own
    // boundaries instead of subtracting a fixed duration.
    const august = monthlyPeriod(new Date('2026-08-15T00:00:00.000Z'));
    const previous = previousPeriod('MONTHLY', august);

    expect(previous.from).toEqual(new Date('2026-07-01T00:00:00.000Z'));
    expect(previous.to).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('rolls the year backward when the current MONTHLY period is January', () => {
    const january = monthlyPeriod(new Date('2026-01-15T00:00:00.000Z'));
    const previous = previousPeriod('MONTHLY', january);

    expect(previous.from).toEqual(new Date('2025-12-01T00:00:00.000Z'));
    expect(previous.to).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('resolves a MONTHLY period correctly out of a short month (February)', () => {
    const march = monthlyPeriod(new Date('2026-03-10T00:00:00.000Z'));
    const previous = previousPeriod('MONTHLY', march);

    // 2026 is not a leap year — February has 28 days.
    expect(previous.from).toEqual(new Date('2026-02-01T00:00:00.000Z'));
    expect(previous.to).toEqual(new Date('2026-03-01T00:00:00.000Z'));
  });
});
