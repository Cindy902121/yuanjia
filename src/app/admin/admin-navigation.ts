"use client";

export function changeAdminQuery(values: Record<string, string | null>, replace = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  // Native history is integrated with Next's useSearchParams; keep browser back/forward intact.
  const current = { ...window.history.state, adminScroll: window.scrollY };
  window.history.replaceState(current, "", window.location.href);
  if (replace) window.history.replaceState(current, "", url);
  else window.history.pushState({ adminScroll: 0 }, "", url);
}

export function adminDate(value?: string) {
  if (!value) return "尚未更新";
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
