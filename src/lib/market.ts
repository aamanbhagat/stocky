// NSE/BSE trading-hours check, shared by live-quote polling + UI pulse.

/** True during NSE continuous session: 09:15–15:30 IST, Mon–Fri. */
export function isMarketOpenIST(now: Date = new Date()): boolean {
  // Convert local clock to IST regardless of server timezone.
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + 5.5 * 3600_000);
  const day = ist.getUTCDay(); // 0 Sun .. 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}
