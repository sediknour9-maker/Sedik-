import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { IconBadge } from '../src/components/ui/IconBadge';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { TextField } from '../src/components/ui/TextField';
import { Txt } from '../src/components/ui/Txt';
import { lookupBarcode } from '../src/services/openFoodFacts';
import { useFoodDb } from '../src/store/FoodDbContext';
import { colors } from '../src/theme/colors';
import { radius } from '../src/theme/tokens';

export default function ScanBarcodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { foods, addCustomFood } = useFoodDb();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const scannedRef = useRef(false);

  const isNative = Platform.OS !== 'web';

  const openPortion = (foodId: string) =>
    router.replace({ pathname: '/add-food/[foodId]', params: { foodId, mealSlot, date } });

  const handleBarcode = async (barcode: string) => {
    if (isLooking) return;
    setIsLooking(true);
    setNotFound(false);

    const existing = foods.find((food) => food.id === `barcode_${barcode}`);
    if (existing) {
      setIsLooking(false);
      openPortion(existing.id);
      return;
    }

    const result = await lookupBarcode(barcode);
    setIsLooking(false);

    if (!result) {
      scannedRef.current = false;
      setNotFound(true);
      return;
    }

    await addCustomFood({ ...result.food, customName: result.name });
    openPortion(result.food.id);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('scanner.title')} onBack={() => router.back()} />

      {isNative && permission?.granted ? (
        <View style={styles.cameraFrame}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }) => {
              if (scannedRef.current) return;
              scannedRef.current = true;
              handleBarcode(data);
            }}
          />
          <View style={styles.viewfinder} pointerEvents="none" />
        </View>
      ) : (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <IconBadge icon="barcode" tone="violet" size={56} />
          <Txt variant="body" center color={colors.textMuted}>
            {isNative ? t('scanner.permissionHint') : t('scanner.noCamera')}
          </Txt>
          {isNative ? (
            <Button label={t('scanner.permission')} icon="camera" variant="soft" onPress={requestPermission} />
          ) : null}
        </Card>
      )}

      <Card style={{ gap: 12 }}>
        <TextField
          label={t('scanner.manualLabel')}
          value={manualCode}
          onChangeText={setManualCode}
          keyboardType="number-pad"
          placeholder="6111024000123"
          testID="barcode-input"
        />
        <Button
          label={t('scanner.search')}
          icon="search"
          disabled={!manualCode.trim()}
          loading={isLooking}
          onPress={() => handleBarcode(manualCode.trim())}
          testID="barcode-lookup"
        />
      </Card>

      {notFound ? (
        <Card style={{ gap: 12 }} testID="barcode-not-found">
          <Row gap={12}>
            <IconBadge icon="alert" tone="accent" size={40} />
            <Txt variant="body" style={{ flex: 1 }}>
              {t('scanner.notFound')}
            </Txt>
          </Row>
          <Button
            label={t('addFood.createCustom')}
            icon="plus"
            variant="soft"
            onPress={() => router.replace({ pathname: '/add-food/custom', params: { mealSlot, date } })}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraFrame: {
    height: 280,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: '72%',
    height: 120,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    opacity: 0.85,
  },
});
