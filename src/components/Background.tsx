"use client";

import { useEffect, useRef } from "react";
import { useData } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import { overdueTasks } from "@/lib/reminders";
import { applyTheme, DEFAULT_MODE, DEFAULT_THEME, isMode, isThemeId } from "@/lib/themes";
import type { Task } from "@/lib/types";
import { useFocus } from "./DayTab";

/** Applies the user's theme, registers the service worker and sends reminder notifications. */
export default function Background() {
  const data = useData();
  const focus = useFocus();
  const prefs = data.settings.prefs ?? {};
  const theme = isThemeId(prefs.theme) ? prefs.theme : DEFAULT_THEME;
  const mode = isMode(prefs.mode) ? prefs.mode : DEFAULT_MODE;

  useEffect(() => {
    applyTheme(theme, mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme, mode);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mode]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const tasksRef = useRef<Task[]>(data.tasks);
  const focusRef = useRef<string | null>(focus);
  tasksRef.current = data.tasks;
  focusRef.current = focus;

  useEffect(() => {
    const check = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const key = `daybook.notified.${todayISO()}`;
      let sent: string[] = [];
      try {
        sent = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {}
      const fresh = overdueTasks(tasksRef.current, focusRef.current).filter((t) => !sent.includes(t.id));
      if (fresh.length === 0) return;
      for (const t of fresh) void notify("Still waiting: " + t.text, "This task has been open for 2+ hours.", t.id);
      try {
        localStorage.setItem(key, JSON.stringify([...sent, ...fresh.map((t) => t.id)]));
      } catch {}
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
}

async function notify(title: string, body: string, tag: string) {
  const options = { body, tag, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, options));
    new Notification(title, options);
  } catch {
    // Notifications not supported here; the in-app banner still shows.
  }
}
