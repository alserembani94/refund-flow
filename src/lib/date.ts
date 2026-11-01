const dateTime = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}
