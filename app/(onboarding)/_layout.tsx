import React from 'react';
import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '../../src/store/OnboardingDraftContext';

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingDraftProvider>
  );
}
