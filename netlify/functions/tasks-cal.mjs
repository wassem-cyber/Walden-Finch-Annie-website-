// Tasks calendar feed: subscribe to it in Calendar to get reminders on a phone even when the page is closed.
import { getStore } from "@netlify/blobs";

const DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const p2 = (n) => String(n).padStart(2, "0");
const text = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Lines longer than 75 octets must be folded; 60 characters keeps multi-byte text under the limit.
const fold = (l) => { const c = Array.from(l), out = []; for (let i = 0; i < c.length; i += 60) out.push((i ? " " : "") + c.slice(i, i + 60).join("")); return out.join("\r\n"); };
const ymd = (k) => k.replace(/-/g, "");
const stamp = (ms) => { const d = new Date(ms); return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + "T" + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()); };
const dur = (m) => (m < 0 ? "-" : "") + "PT" + Math.abs(m) + "M";

function rrule(r) {
  const f = { day: "DAILY", week: "WEEKLY", month: "MONTHLY", year: "YEARLY" }[r.u];
  if (!f) return "";
  let s = "RRULE:FREQ=" + f + ";INTERVAL=" + (r.n || 1);
  if (r.u === "week" && r.days && r.days.length) s += ";BYDAY=" + r.days.map((d) => DAY[d]).join(",");
  if (r.u === "month" && r.dom) s += ";BYMONTHDAY=" + r.dom;
  return s;
}

export function buildICS(data, now = Date.now()) {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Walden & Finch//Tasks//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Tasks", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  (data.T || []).forEach((t) => {
    if (t.done || !/^\d{4}-\d{2}-\d{2}$/.test(t.d || "") || (t.r && t.r.u === "goal")) return;
    L.push("BEGIN:VEVENT", "UID:" + t.id + "@waldenandfinch", "DTSTAMP:" + stamp(t.u || now) + "Z", "SUMMARY:" + text(t.t));
    if (t.n) L.push("DESCRIPTION:" + text(t.n));
    const [y, m, d] = t.d.split("-").map(Number);
    if (/^\d{2}:\d{2}$/.test(t.tm || "")) {
      const [h, mi] = t.tm.split(":").map(Number), s = Date.UTC(y, m - 1, d, h, mi);
      // Floating local time, so the event shows at the same clock time on every device.
      L.push("DTSTART:" + stamp(s), "DTEND:" + stamp(s + 30 * 60000));
    } else {
      L.push("DTSTART;VALUE=DATE:" + ymd(t.d), "DTEND;VALUE=DATE:" + stamp(Date.UTC(y, m - 1, d + 1)).slice(0, 8));
    }
    if (t.r) L.push(rrule(t.r));
    if (typeof t.rem === "number") {
      // All-day tasks remind at 9 AM on the day.
      const before = t.tm ? -t.rem : 540 - t.rem;
      L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + text(t.t), "TRIGGER:" + dur(before), "END:VALARM");
    }
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.filter(Boolean).map(fold).join("\r\n") + "\r\n";
}

export default async (req) => {
  const code = (new URL(req.url).searchParams.get("code") || "").replace(/\.ics$/, "");
  if (!/^[a-z0-9]{10,40}$/.test(code)) return new Response("bad code", { status: 400 });
  const raw = await getStore({ name: "tasks", consistency: "strong" }).get(code);
  let data = { T: [] };
  try { if (raw) data = JSON.parse(raw); } catch (e) {}
  return new Response(buildICS(data), {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store", "content-disposition": 'inline; filename="tasks.ics"' },
  });
};

export const config = { path: "/api/tasks-cal" };
