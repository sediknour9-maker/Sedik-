import React, { type ReactNode } from 'react';

import { ToastProvider } from '../components/ui/Toast';
import { ActivityProvider } from './ActivityContext';
import { DataEpochProvider } from './DataEpochContext';
import { FoodDbProvider } from './FoodDbContext';
import { LogProvider } from './LogContext';
import { PlanProvider } from './PlanContext';
import { ProfileProvider } from './ProfileContext';
import { SettingsProvider } from './SettingsContext';
import { WaterProvider } from './WaterContext';

/** All app-wide state, in dependency order (later providers may read earlier ones). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <DataEpochProvider>
        <ProfileProvider>
          <FoodDbProvider>
            <LogProvider>
              <ActivityProvider>
                <WaterProvider>
                  <PlanProvider>
                    <ToastProvider>{children}</ToastProvider>
                  </PlanProvider>
                </WaterProvider>
              </ActivityProvider>
            </LogProvider>
          </FoodDbProvider>
        </ProfileProvider>
      </DataEpochProvider>
    </SettingsProvider>
  );
}
