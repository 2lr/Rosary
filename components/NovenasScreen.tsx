"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { Card, cx } from "@/components/ui";
import NovenaStarter from "@/components/NovenaStarter";
import NovenaPrayerSheet from "@/components/NovenaPrayerSheet";
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

/** How long a novena stays listed after its last day, so it can still be entered. */
const RECENT_DAYS = 12;

type Run = { novena: string; startedOn: string; keptAt: string | null };

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
  /** Which card has its date form open: a novena key, or a run being corrected. */
  const [choosing, setChoosing] = useState<string | null>(null);
  /** The novena whose words are open, with the day it is on. */
  const [praying, setPraying] = useState<{ key: string; name: string; day: number } | null>(null);

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

  async function act(
    novena: string,
    startedOn: string,
    options: { stop?: boolean; moveTo?: string; kept?: boolean } = {},
  ) {
    setBusy(`${novena}:${startedOn}`);
    try {
      const response = await fetch("/api/novenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novena, startedOn, ...options }),
      });
      if (response.ok) {
        const data = (await response.json()) as { novenas: Run[] };
        setRuns(data.novenas);
      }
    } catch {
      // Same again.
    } finally {
      setBusy(null);
      setChoosing(null);
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
    // A novena stays listed for a while after its last day, so one just prayed
    // can still be recorded with the days it actually had. Jumping to next
    // year's dates the morning after leaves no way to enter what was prayed
    // yesterday.
    const reachable = shiftDays(today, -RECENT_DAYS);
    const ahead = [...novenasIn(year - 1), ...novenasIn(year), ...novenasIn(year + 1)]
      .filter((n) => n.end >= reachable)
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

  const running = mine.filter((m) => !m.window.over && m.run.startedOn <= today);
  const upcoming = mine.filter((m) => m.run.startedOn > today);
  const done = mine.filter((m) => m.window.over);

  const keptOf = (startedOn: string) =>
    novenaProgress(startedOn, prayedDays, today);
  const decadesIn = (startedOn: string) =>
    Array.from(
      { length: NOVENA_DAYS },
      (_, i) => decadesByDay.get(shiftDays(startedOn, i)) ?? 0,
    ).reduce((sum, n) => sum + n, 0);

  const isKept = (m: (typeof mine)[number]) =>
    m.run.keptAt !== null || keptOf(m.run.startedOn).kept === NOVENA_DAYS;

  const completed = done.filter(isKept).length;

  const show = (key: string) => dateOf.format(new Date(`${key}T12:00:00Z`));

  type Mine = (typeof mine)[number];
  const cardProps = (m: Mine) => {
    const { kept, days } = keptOf(m.run.startedOn);
    const id = `${m.run.novena}:${m.run.startedOn}`;
    return {
      title: m.novena?.name[lang] ?? m.run.novena,
      when: m.window.over
        ? t("novena.over")
        : m.window.day >= 1
          ? t("novena.day", { n: m.window.day, of: NOVENA_DAYS })
          : t("novena.startsOn", { date: show(m.run.startedOn) }),
      dates:
        t("novena.from", { from: show(m.run.startedOn), to: show(m.window.end) }) +
        (m.leadsTo ? ` · ${t("novena.feastOn", { date: show(m.leadsTo.feast) })}` : ""),
      days,
      today,
      keptLine:
        t("novena.kept", { n: kept, of: NOVENA_DAYS }) +
        (decadesIn(m.run.startedOn) > 0
          ? ` · ${t("novena.decades", { n: decadesIn(m.run.startedOn) })}`
          : ""),
      editing: choosing === id,
      busy: busy !== null,
      t,
      lang,
      startedOn: m.run.startedOn,
      onEdit: () => setChoosing(id),
      onCancel: () => setChoosing(null),
      onMove: (moveTo: string) =>
        void act(m.run.novena, m.run.startedOn, { moveTo }),
      onLeave: () => void act(m.run.novena, m.run.startedOn, { stop: true }),
      kept: m.run.keptAt !== null,
      onPray: () =>
        setPraying({
          key: m.run.novena,
          name: m.novena?.name[lang] ?? m.run.novena,
          day: m.window.day,
        }),
      onKept: (next: boolean) =>
        void act(m.run.novena, m.run.startedOn, { kept: next }),
    };
  };

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
        <MineSection title={t("novena.running")}>
          {running.map((m) => (
            <RunCard key={`${m.run.novena}-${m.run.startedOn}`} {...cardProps(m)} />
          ))}
        </MineSection>
      )}

      {upcoming.length > 0 && (
        <MineSection title={t("novena.upcoming")}>
          {upcoming.map((m) => (
            <RunCard key={`${m.run.novena}-${m.run.startedOn}`} {...cardProps(m)} />
          ))}
        </MineSection>
      )}

      {done.length > 0 && (
        <MineSection title={t("novena.past")}>
          {done.map((m) => (
            <RunCard key={`${m.run.novena}-${m.run.startedOn}`} {...cardProps(m)} />
          ))}
        </MineSection>
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
                  {novena.start <= today && today <= novena.end && (
                    <span className="text-[var(--bloom-accent)]">
                      {" · "}
                      {t("novena.rightNow")}
                    </span>
                  )}
                  {novena.end < today && (
                    <span className="text-[var(--bloom-accent)]">
                      {" · "}
                      {t("novena.justEnded")}
                    </span>
                  )}
                </p>

                {already ? (
                  <p className="mt-3 text-xs text-[var(--bloom-accent)]">
                    {t("novena.alreadyRunning")}
                  </p>
                ) : choosing === novena.key ? (
                  <NovenaStarter
                    lang={lang}
                    t={t}
                    today={today}
                    liturgical={novena.start}
                    busy={busy !== null}
                    onConfirm={(startedOn) => void act(novena.key, startedOn)}
                    onCancel={() => setChoosing(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setChoosing(novena.key)}
                    disabled={busy !== null}
                    className="tap mt-3 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-2 text-sm text-[var(--bloom-on-accent)] transition disabled:opacity-40"
                  >
                    {t("novena.start")}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <AppNav t={t} />

      {praying && (
        <NovenaPrayerSheet
          lang={lang}
          t={t}
          name={praying.name}
          novena={praying.key}
          day={praying.day}
          onClose={() => setPraying(null)}
        />
      )}
    </div>
  );
}

function MineSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-[0.65rem] uppercase tracking-[0.22em] text-faint">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** One novena being prayed, or about to be. */
function RunCard({
  title,
  when,
  dates,
  days,
  today,
  keptLine,
  kept,
  onKept,
  onPray,
  editing,
  busy,
  t,
  lang,
  startedOn,
  onEdit,
  onCancel,
  onMove,
  onLeave,
}: {
  title: string;
  when: string;
  dates: string;
  days: { key: string; prayed: boolean; ahead: boolean }[];
  today: string;
  keptLine: string;
  /** Said to have been kept, whatever the rosaries recorded. */
  kept: boolean;
  onKept: (next: boolean) => void;
  onPray: () => void;
  editing: boolean;
  busy: boolean;
  t: ReturnType<typeof translatorFor>;
  lang: Lang;
  startedOn: string;
  onEdit: () => void;
  onCancel: () => void;
  onMove: (day: string) => void;
  onLeave: () => void;
}) {
  return (
    <Card className="px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-display text-lg">{title}</p>
        <p className="shrink-0 text-[0.65rem] text-faint">{when}</p>
      </div>

      {/* Which nine days these are. Without them there is no telling one novena
          from another once it is under way, nor whether the one being prayed is
          the one intended. */}
      <p className="mt-1 text-[0.65rem] text-faint">{dates}</p>

      <Days days={days} today={today} />

      <p className="mt-2 text-[0.68rem] text-faint">
        {keptLine}
        {kept && (
          <span className="text-[var(--bloom-accent)]">{` · ${t("novena.keptSaid")}`}</span>
        )}
      </p>

      {editing ? (
        <NovenaStarter
          lang={lang}
          t={t}
          today={today}
          liturgical={null}
          current={startedOn}
          busy={busy}
          onConfirm={onMove}
          onCancel={onCancel}
        />
      ) : (
        <>
          {/* A novena is one prayer said nine days running. Without the words
              there is nothing to pray, so they are one tap away. */}
          <button
            type="button"
            onClick={onPray}
            className="tap mt-3 w-full rounded-full bg-[var(--bloom-accent)] px-4 py-2 text-sm text-[var(--bloom-on-accent)] transition"
          >
            {t("novena.pray")}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEdit}
              disabled={busy}
              className="tap rounded-full px-2 py-1 text-[0.68rem] text-[var(--bloom-accent)] transition disabled:opacity-40"
            >
              {t("novena.editDate")}
            </button>

            {/* The nine days are otherwise counted from rosaries recorded here,
                which is only true of someone who opened the app every day. One
                prayed on paper or from memory was still prayed. */}
            <button
              type="button"
              onClick={() => onKept(!kept)}
              disabled={busy}
              className="tap rounded-full px-2 py-1 text-[0.68rem] text-[var(--bloom-accent)] transition disabled:opacity-40"
            >
              {kept ? t("novena.unmark") : t("novena.markKept")}
            </button>

            <button
              type="button"
              onClick={onLeave}
              disabled={busy}
              className="tap rounded-full px-2 py-1 text-[0.68rem] text-faint transition hover:text-[var(--bloom-ink)] disabled:opacity-40"
            >
              {t("novena.leave")}
            </button>
          </div>
        </>
      )}
    </Card>
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
