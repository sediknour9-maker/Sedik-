import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  addLogEntry,
  getLogDates,
  getLogsForDate,
  removeLogEntry,
  updateLogEntry,
} from '../services/logRepository';
import { useDataEpoch } from './DataEpochContext';
import { useToday } from './useToday';
import type { LogEntry } from '../models/log';

interface LogContextValue {
  today: string;
  /** The day shown in the nutrition diary; defaults to today. */
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  entries: LogEntry[];
  todayEntries: LogEntry[];
  logDates: string[];
  /** Bumps after every change to stored logs, for views that aggregate across days. */
  revision: number;
  isLoading: boolean;
  addEntry: (entry: LogEntry) => Promise<void>;
  updateEntry: (entry: LogEntry) => Promise<void>;
  removeEntry: (entry: LogEntry) => Promise<void>;
}

const LogContext = createContext<LogContextValue | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const today = useToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [todayEntries, setTodayEntries] = useState<LogEntry[]>([]);
  const [logDates, setLogDates] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const latestRequest = useRef(0);

  // When the day rolls over while the diary shows "today", follow the new day.
  const previousToday = useRef(today);
  useEffect(() => {
    const before = previousToday.current;
    previousToday.current = today;
    if (before !== today) {
      setSelectedDate((current) => (current === before ? today : current));
    }
  }, [today]);

  const reload = useCallback(async () => {
    const request = ++latestRequest.current;
    const [selectedEntries, currentEntries, dates] = await Promise.all([
      getLogsForDate(selectedDate),
      selectedDate === today ? null : getLogsForDate(today),
      getLogDates(),
    ]);
    // A newer request (fast date switching) supersedes this one.
    if (request !== latestRequest.current) return;
    setEntries(selectedEntries);
    setTodayEntries(currentEntries ?? selectedEntries);
    setLogDates(dates);
    setRevision((current) => current + 1);
    setIsLoading(false);
  }, [selectedDate, today]);

  useEffect(() => {
    reload();
  }, [reload, epoch]);

  const addEntry = async (entry: LogEntry) => {
    await addLogEntry(entry);
    await reload();
  };

  const updateEntry = async (entry: LogEntry) => {
    await updateLogEntry(entry);
    await reload();
  };

  const removeEntry = async (entry: LogEntry) => {
    await removeLogEntry(entry.date, entry.id);
    await reload();
  };

  const value = useMemo(
    () => ({
      today,
      selectedDate,
      setSelectedDate,
      entries,
      todayEntries,
      logDates,
      revision,
      isLoading,
      addEntry,
      updateEntry,
      removeEntry,
    }),
    [today, selectedDate, entries, todayEntries, logDates, revision, isLoading, reload]
  );

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function useLogs(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLogs must be used within a LogProvider');
  return ctx;
}
