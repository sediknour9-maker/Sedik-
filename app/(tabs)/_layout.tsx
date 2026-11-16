import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '../../src/components/ui/Icon';
import { useProfile } from '../../src/store/ProfileContext';
import { colors } from '../../src/theme/colors';

const TABS: { name: string; titleKey: string; icon: IconName }[] = [
  { name: 'index', titleKey: 'common.today', icon: 'home' },
  { name: 'training', titleKey: 'training.title', icon: 'dumbbell' },
  { name: 'nutrition', titleKey: 'nutrition.title', icon: 'utensils' },
  { name: 'progress', titleKey: 'progress.title', icon: 'chart' },
  { name: 'profile', titleKey: 'profile.title', icon: 'user' },
];

export default function TabsLayout() {
  const { t } = useTranslation();
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Every tab needs a profile; without one (first launch, after a reset) onboarding comes first.
  if (!profile) {
    return <Redirect href="/(onboarding)/language" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, titleKey, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(titleKey),
            tabBarIcon: ({ focused }) => (
              <Icon
                name={icon}
                size={22}
                color={focused ? colors.primary : colors.textMuted}
                strokeWidth={focused ? 2.4 : 2}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
