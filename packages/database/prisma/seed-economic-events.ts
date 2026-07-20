/**
 * Seeds the economic_events table with real, officially published macro
 * calendar dates — no live feed is used (see EconomicEvent's schema comment
 * for why). Sources:
 *  - FOMC: federalreserve.gov/monetarypolicy/fomccalendars.htm
 *  - CPI / NFP: BLS's published release schedule for 2026
 *
 * Safe to re-run: upserts on the (category, eventDate) unique constraint.
 * Run with: pnpm --filter @cryptotrade/database db:seed:economic-events
 */
import { PrismaClient, EconomicEventCategory, EconomicEventImportance } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedEvent {
  category: EconomicEventCategory;
  importance: EconomicEventImportance;
  title: string;
  description?: string;
  eventDate: string; // ISO UTC timestamp
}

// FOMC decision + press conference lands on the second day of each two-day
// meeting, 2:00pm ET — expressed here in UTC (accounting for EDT/EST).
const FOMC_EVENTS: SeedEvent[] = [
  { date: '2026-01-28T19:00:00.000Z', sep: false },
  { date: '2026-03-18T18:00:00.000Z', sep: true },
  { date: '2026-04-29T18:00:00.000Z', sep: false },
  { date: '2026-06-17T18:00:00.000Z', sep: true },
  { date: '2026-07-29T18:00:00.000Z', sep: false },
  { date: '2026-09-16T18:00:00.000Z', sep: true },
  { date: '2026-10-28T18:00:00.000Z', sep: false },
  { date: '2026-12-09T19:00:00.000Z', sep: true },
  { date: '2027-01-27T19:00:00.000Z', sep: false },
  { date: '2027-03-17T18:00:00.000Z', sep: true },
  { date: '2027-04-28T18:00:00.000Z', sep: false },
  { date: '2027-06-09T18:00:00.000Z', sep: true },
  { date: '2027-07-28T18:00:00.000Z', sep: false },
  { date: '2027-09-15T18:00:00.000Z', sep: true },
  { date: '2027-10-27T18:00:00.000Z', sep: false },
  { date: '2027-12-08T19:00:00.000Z', sep: true },
].map(({ date, sep }) => ({
  category: EconomicEventCategory.FOMC,
  importance: EconomicEventImportance.HIGH,
  title: 'FOMC Rate Decision',
  description: sep
    ? 'Includes the Summary of Economic Projections ("dot plot") and a press conference.'
    : 'Press conference follows the announcement.',
  eventDate: date,
}));

// CPI releases, 8:30am ET, each covering the prior calendar month's data.
const CPI_RELEASES: Array<{ date: string; refMonth: string }> = [
  { date: '2026-01-13T13:30:00.000Z', refMonth: 'December 2025' },
  { date: '2026-02-13T13:30:00.000Z', refMonth: 'January 2026' },
  { date: '2026-03-11T12:30:00.000Z', refMonth: 'February 2026' },
  { date: '2026-04-10T12:30:00.000Z', refMonth: 'March 2026' },
  { date: '2026-05-12T12:30:00.000Z', refMonth: 'April 2026' },
  { date: '2026-06-10T12:30:00.000Z', refMonth: 'May 2026' },
  { date: '2026-07-14T12:30:00.000Z', refMonth: 'June 2026' },
  { date: '2026-08-12T12:30:00.000Z', refMonth: 'July 2026' },
  { date: '2026-09-11T12:30:00.000Z', refMonth: 'August 2026' },
  { date: '2026-10-14T12:30:00.000Z', refMonth: 'September 2026' },
  { date: '2026-11-10T13:30:00.000Z', refMonth: 'October 2026' },
  { date: '2026-12-10T13:30:00.000Z', refMonth: 'November 2026' },
];

const CPI_EVENTS: SeedEvent[] = CPI_RELEASES.map(({ date, refMonth }) => ({
  category: EconomicEventCategory.CPI,
  importance: EconomicEventImportance.HIGH,
  title: `CPI — ${refMonth}`,
  description: 'US Consumer Price Index, released by the Bureau of Labor Statistics.',
  eventDate: date,
}));

// NFP / Employment Situation releases, 8:30am ET, each covering the prior
// calendar month's data.
const NFP_RELEASES: Array<{ date: string; refMonth: string }> = [
  { date: '2026-01-09T13:30:00.000Z', refMonth: 'December 2025' },
  { date: '2026-02-06T13:30:00.000Z', refMonth: 'January 2026' },
  { date: '2026-03-06T13:30:00.000Z', refMonth: 'February 2026' },
  { date: '2026-04-03T12:30:00.000Z', refMonth: 'March 2026' },
  { date: '2026-05-08T12:30:00.000Z', refMonth: 'April 2026' },
  { date: '2026-06-05T12:30:00.000Z', refMonth: 'May 2026' },
  { date: '2026-07-02T12:30:00.000Z', refMonth: 'June 2026' },
  { date: '2026-08-07T12:30:00.000Z', refMonth: 'July 2026' },
  { date: '2026-09-04T12:30:00.000Z', refMonth: 'August 2026' },
  { date: '2026-10-02T12:30:00.000Z', refMonth: 'September 2026' },
  { date: '2026-11-06T13:30:00.000Z', refMonth: 'October 2026' },
  { date: '2026-12-04T13:30:00.000Z', refMonth: 'November 2026' },
];

const NFP_EVENTS: SeedEvent[] = NFP_RELEASES.map(({ date, refMonth }) => ({
  category: EconomicEventCategory.NFP,
  importance: EconomicEventImportance.HIGH,
  title: `Non-Farm Payrolls — ${refMonth}`,
  description: 'US Employment Situation report, released by the Bureau of Labor Statistics.',
  eventDate: date,
}));

async function main() {
  const events = [...FOMC_EVENTS, ...CPI_EVENTS, ...NFP_EVENTS];

  for (const event of events) {
    await prisma.economicEvent.upsert({
      where: {
        category_eventDate: {
          category: event.category,
          eventDate: new Date(event.eventDate),
        },
      },
      create: {
        category: event.category,
        importance: event.importance,
        country: 'US',
        title: event.title,
        description: event.description ?? null,
        eventDate: new Date(event.eventDate),
      },
      update: {
        importance: event.importance,
        title: event.title,
        description: event.description ?? null,
      },
    });
  }

  console.log(`Seeded ${events.length} economic events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
