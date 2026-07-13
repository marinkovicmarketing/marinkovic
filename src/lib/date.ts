/** Today's date as YYYY-MM-DD in the Europe/Vienna timezone. */
export function todaySlateDate(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // en-CA formats as YYYY-MM-DD
}
