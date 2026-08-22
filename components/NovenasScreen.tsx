"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { Card, cx } from "@/components/ui";
import { translatorFor } from "@/lib/i18n/dictionary";
import type { Lang } from "@/lib/i18n/config";
import type { Stats } from "@/lib/rosary/stats";
import {
  NOVENA_DAYS,
  novenaByKey,
  novenaProgress,
  novenasIn,
  runWindow,
  shiftDays,
} from "@/lib/rosary/novenas";

/**
 * Every novena, and the ones being prayed.
 *
 * Each has its own nine days in the year, before its feast — but a novena can
 * be begun any day, for anything. Both are offered: keep it with the Church, or
 * start it this evening.
 */

type Run = { novena: string; startedOn: string };

export default function NovenasScreen({
  lang,
  stats,
}: {
  lang: Lang;
  stats: Stats;
}) {
  const t = useMemo(() => translatorFor(lang), [lang]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const year = Number(today.slice(0, 4));

  const [runs, setRuns] = useState<Run[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/novenas");
      if (!response.ok) return;
      const data = (await response.json()) as { novenas: Run[] };
      setRuns(data.novenas);
    } catch {
      // Leave what is on screen; tapping again will try again.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prayedDays = useMemo(
    () => new Set(stats.byDay.filter((d) => d.decades > 0).map((d) => d.date)),
    [stats.byDay],
  );
  const decadesByDay = useMemo(
    () => new Map(stats.byDay.map((d) => [d.date, d.decades])),
    [stats.byDay],
  );

  const dateOf = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
    [lang],
  );

  async function act(novena: string, startedOn: string, stop = false) {
    setBusy(`${novena}:${startedOn}`);
    try {
      const response = await fetch("/api/novenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novena, startedOn, stop }),
      });
      if (response.ok) {
        const data = (await response.json()) as { novenas: Run[] };
        setRuns(data.novenas);
      }
    } catch {
      // Same again.
    } finally {
      setBusy(null);
    }
  }

  /**
   * Every novena, each shown at its next occurrence — this year's if it is
   * still to come, otherwise next year's. Two years are built for that, and
   * the ones already gone are dropped before deduplicating: doing it the other
   * way round loses a novena entirely for the rest of the year, because the
   * copy it deduplicates against is the one that has already passed.
   */
  const catalogue = useMemo(() => {
    const ahead = [...novenasIn(year), ...novenasIn(year + 1)]
      .filter((n) => n.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start));
    const seen = new Set<string>();
    return ahead.filter((n) => {
      if (seen.has(n.key)) return false;
      seen.add(n.key);
      return true;
    });
  }, [year, today]);

  const mine = (runs ?? []).map((run) => {
    const window = runWindow(run.novena, run.startedOn, today);
    const startYear = Number(run.startedOn.slice(0, 4));

    // The feast is worth naming when these nine days actually lead into it —
    // which includes starting a day early or a day late, the usual case. A
    // novena begun in August for a February feast is being prayed for its own
    // sake, and naming a date five months off would only confuse.
    const leadsTo =
      [startYear, startYear + 1]
        .map((year) => novenaByKey(run.novena, year))
        .find((n) => n && n.feast >= run.startedOn && n.feast <= shiftDays(window.end, 1)) ?? null;

    return {
      run,
      novena: novenaByKey(run.novena, startYear),
      leadsTo,
      window,
    };
  });

  const running = mine.filter((m) => !m.window.over);
  const done = mine.filter((m) => m.window.over);

  const keptOf = (startedOn: string) =>
    novenaProgress(startedOn, prayedDays, today);
  const decadesIn = (startedOn: string) =>
    Array.from(
      { length: NOVENA_DAYS },
      (_, i) => decadesByDay.get(shiftDays(startedOn, i)) ?? 0,
    ).reduce((sum, n) => sum + n, 0);

  const completed = done.filter(
    (m) => keptOf(m.run.startedOn).kept === NOVENA_DAYS,
  ).length;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pad-top">
      <header className="text-center">
        <h1 className="font-display text-3xl">{t("novena.title")}</h1>
        <p className="mt-1 text-xs text-faint">
          {completed > 0
            ? t("novena.completed", { n: completed })
            : t("novena.intro")}
        </p>
      </header>

      {running.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">
            {t("novena.running")}
          </h2>
          <div className="mt-3 space-y-3">
            {running.map(({ run, novena, leadsTo, window }) => {
              const { kept, days } = keptOf(run.startedOn);
              return (
                <Card
                  key={`${run.novena}-${run.startedOn}`}
                  className="px-4 py-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-display text-lg">
                      {novena?.name[lang] ?? run.novena}
                    </p>
                    <p className="shrink-0 text-[0.65rem] text-faint">
                      {window.day >= 1 && window.day <= NOVENA_DAYS
                        ? t("novena.day", { n: window.day, of: NOVENA_DAYS })
                        : t("novena.startsOn", {
                            date: dateOf.format(
                              new Date(`${run.startedOn}T12:00:00Z`),
                            ),
                          })}
                    </p>
                  </div>

                  {/* Which nine days these are. Without them there is no way to
                      tell one novena from another once it is under way, nor
                      whether the one being prayed is the one intended. */}
                  <p className="mt-1 text-[0.65rem] text-faint">
                    {t("novena.from", {
                      from: dateOf.format(new Date(`${run.startedOn}T12:00:00Z`)),
                      to: dateOf.format(new Date(`${window.end}T12:00:00Z`)),
                    })}
                    {leadsTo &&
                      ` · ${t("novena.feastOn", {
                        date: dateOf.format(new Date(`${leadsTo.feast}T12:00:00Z`)),
                      })}`}
                  </p>

                  <Days days={days} today={today} />

                  <p className="mt-2 text-[0.68rem] text-faint">
                    {t("novena.kept", { n: kept, of: NOVENA_DAYS })}
                    {decadesIn(run.startedOn) > 0 &&
                      ` · ${t("novena.decades", { n: decadesIn(run.startedOn) })}`}
                  </p>

                  <button
                    type="button"
                    onClick={() => void act(run.novena, run.startedOn, true)}
                    disabled={busy === `${run.novena}:${run.startedOn}`}
                    className="tap mt-2 rounded-full px-2 py-1 text-[0.68rem] text-faint transition hover:text-[var(--bloom-ink)] disabled:opacity-40"
                  >
                    {t("novena.leave")}
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">
            {t("novena.past")}
          </h2>
          <ul className="mt-3 space-y-2">
            {done.map(({ run, novena }) => {
              const { kept } = keptOf(run.startedOn);
              const whole = kept === NOVENA_DAYS;
              return (
                <li
                  key={`${run.novena}-${run.startedOn}`}
                  className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cx(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        whole
                          ? "bg-[var(--bloom-accent)]"
                          : "bg-[var(--bloom-fill-3)]",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {novena?.name[lang] ?? run.novena}
                      </span>
                      <span className="block text-[0.65rem] text-faint">
                        {dateOf.format(new Date(`${run.startedOn}T12:00:00Z`))}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cx(
                      "shrink-0 text-xs tabular-nums",
                      whole ? "text-[var(--bloom-accent)]" : "text-faint",
                    )}
                  >
                    {kept}/{NOVENA_DAYS}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">
          {t("novena.all")}
        </h2>
        <div className="mt-3 space-y-3">
          {catalogue.map((novena) => {
            const already = (runs ?? []).some(
              (r) =>
                r.novena === novena.key &&
                !runWindow(r.novena, r.startedOn, today).over,
            );
            const soon = novena.start > today;

            return (
              <Card key={novena.key} className="px-4 py-4">
                <p className="font-display text-lg leading-tight">
                  {novena.name[lang]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
                  {novena.about[lang]}
                </p>
                <p className="mt-1.5 text-[0.65rem] text-faint">
                  {t("novena.from", {
                    from: dateOf.format(new Date(`${novena.start}T12:00:00Z`)),
                    to: dateOf.format(new Date(`${novena.end}T12:00:00Z`)),
                  })}
                </p>

                {already ? (
                  <p className="mt-3 text-xs text-[var(--bloom-accent)]">
                    {t("novena.alreadyRunning")}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void act(novena.key, today)}
                      disabled={busy !== null}
                      className="tap flex-1 rounded-full bg-[var(--bloom-accent)] px-4 py-2 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
                    >
                      {t("novena.startToday")}
                    </button>
                    {soon && (
                      <button
                        type="button"
                        onClick={() => void act(novena.key, novena.start)}
                        disabled={busy !== null}
                        className="tap flex-1 rounded-full border border-[var(--bloom-accent)]/45 px-4 py-2 text-sm text-[var(--bloom-accent)] transition disabled:opacity-40"
                      >
                        {t("novena.startOnDate")}
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <AppNav t={t} />
    </div>
  );
}

function Days({
  days,
  today,
}: {
  days: { key: string; prayed: boolean; ahead: boolean }[];
  today: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {days.map((day) => (
        <span
          key={day.key}
          className={cx(
            "h-2 flex-1 rounded-full transition",
            day.prayed
              ? "bg-[var(--bloom-accent)]"
              : day.ahead
                ? "bg-[var(--bloom-fill-2)]"
                : "bg-[var(--bloom-fill-3)]",
            day.key === today &&
              !day.prayed &&
              "ring-1 ring-[var(--bloom-accent)]",
          )}
        />
      ))}
    </div>
  );
}
