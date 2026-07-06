import '../src/i18n';
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider } from '../src/store/SettingsContext';
import { ProfileProvider } from '../src/store/ProfileContext';
import { FoodDbProvider } from '../src/store/FoodDbContext';
import { LogProvider } from '../src/store/LogContext';
import { ActivityProvider } from '../src/store/ActivityContext';
import { PlanProvider } from '../src/store/PlanContext';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ProfileProvider>
            <FoodDbProvider>
              <LogProvider>
                <ActivityProvider>
                  <PlanProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                      }}
                    >
                      <Stack.Screen name="add-food/index" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="add-food/[foodId]" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="add-food/custom" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="scan-barcode" options={{ presentation: 'modal' }} />
                    </Stack>
                  </PlanProvider>
                </ActivityProvider>
              </LogProvider>
            </FoodDbProvider>
          </ProfileProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
