import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { addLogEntry, getLogDates, getLogsForDate, removeLogEntry } from '../services/logRepository';
import { todayString } from '../services/date';
import type { LogEntry } from '../models/log';

interface LogContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  entries: LogEntry[];
  logDates: string[];
  isLoading: boolean;
  addEntry: (entry: LogEntry) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LogContext = createContext<LogContextValue | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [logDates, setLogDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = async (date: string) => {
    setIsLoading(true);
    const [dayEntries, dates] = await Promise.all([getLogsForDate(date), getLogDates()]);
    setEntries(dayEntries);
    setLogDates(dates);
    setIsLoading(false);
  };

  useEffect(() => {
    reload(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Re-sync "today" when the app returns to the foreground (e.g. past midnight),
  // so entries aren't silently logged to yesterday's date.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setSelectedDate((current) => {
          const today = todayString();
          return current === today ? current : today;
        });
      }
    });
    return () => subscription.remove();
  }, []);

  const addEntry = async (entry: LogEntry) => {
    await addLogEntry(entry);
    await reload(selectedDate);
  };

  const removeEntry = async (entryId: string) => {
    await removeLogEntry(selectedDate, entryId);
    await reload(selectedDate);
  };

  const refresh = () => reload(selectedDate);

  const value = useMemo(
    () => ({ selectedDate, setSelectedDate, entries, logDates, isLoading, addEntry, removeEntry, refresh }),
    [selectedDate, entries, logDates, isLoading]
  );

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function useLogs(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLogs must be used within a LogProvider');
  return ctx;
}
