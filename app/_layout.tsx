import '../src/i18n';
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider } from '../src/store/SettingsContext';
import { ProfileProvider } from '../src/store/ProfileContext';
import { FoodDbProvider } from '../src/store/FoodDbContext';
import { LogProvider } from '../src/store/LogContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ProfileProvider>
            <FoodDbProvider>
              <LogProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="add-food/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="add-food/[foodId]" options={{ presentation: 'modal' }} />
                </Stack>
              </LogProvider>
            </FoodDbProvider>
          </ProfileProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
