import '../src/i18n';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfirmHost } from '../src/components/ui/ConfirmDialog';
import { AppProviders } from '../src/store/AppProviders';
import { colors } from '../src/theme/colors';
import { MAX_CONTENT_WIDTH } from '../src/theme/tokens';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="light" />
          <View style={styles.frame}>
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
              <Stack.Screen name="profile-edit" options={{ presentation: 'modal' }} />
              {/* A stray swipe must not throw away a running session. */}
              <Stack.Screen name="workout/[dayId]" options={{ gestureEnabled: false }} />
              <Stack.Screen name="mobility" options={{ gestureEnabled: false }} />
            </Stack>
            <ConfirmHost />
          </View>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050506' },
  // Keeps the app phone-shaped and centered on tablets and desktop browsers.
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
});
