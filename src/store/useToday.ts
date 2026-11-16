import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayString } from '../services/date';

/**
 * Current local date as 'YYYY-MM-DD'. Re-checked whenever the app returns to
 * the foreground, so a session left open past midnight moves on to the new day.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayString());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayString());
    });
    return () => subscription.remove();
  }, []);

  return today;
}
