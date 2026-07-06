import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useProfile } from '../src/store/ProfileContext';
import { colors } from '../src/theme/colors';

export default function Gatekeeper() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={profile ? '/(tabs)' : '/(onboarding)/language'} />;
}
