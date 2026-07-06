import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { lookupBarcode } from '../src/services/openFoodFacts';
import { useFoodDb } from '../src/store/FoodDbContext';
import { colors } from '../src/theme/colors';
import { textAlign, useRTL } from '../src/theme/rtl';

export default function ScanBarcodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { foods, addCustomFood } = useFoodDb();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const scannedRef = useRef(false);

  const isNative = Platform.OS !== 'web';

  const handleBarcode = async (barcode: string) => {
    if (isLooking) return;
    setIsLooking(true);
    setNotFound(false);

    const existing = foods.find((f) => f.id === `barcode_${barcode}`);
    if (existing) {
      setIsLooking(false);
      router.replace({ pathname: `/add-food/${existing.id}`, params: { mealSlot, date } });
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
    router.replace({ pathname: `/add-food/${result.food.id}`, params: { mealSlot, date } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('scanner.title')}</Text>

        {isNative && permission?.granted ? (
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }) => {
              if (scannedRef.current) return;
              scannedRef.current = true;
              handleBarcode(data);
            }}
          />
        ) : isNative ? (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('scanner.permission')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.webNote, { textAlign: textAlign(isRTL) }]}>{t('scanner.noCamera')}</Text>
        )}

        <Text style={[styles.manualLabel, { textAlign: textAlign(isRTL) }]}>{t('scanner.manualLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign: textAlign(isRTL) }]}
          keyboardType="numeric"
          placeholder="6111024000123"
          placeholderTextColor={colors.textMuted}
          value={manualCode}
          onChangeText={setManualCode}
        />
        <TouchableOpacity
          style={[styles.lookupButton, (!manualCode.trim() || isLooking) && styles.buttonDisabled]}
          disabled={!manualCode.trim() || isLooking}
          onPress={() => handleBarcode(manualCode.trim())}
        >
          {isLooking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.lookupButtonText}>{t('scanner.search')}</Text>
          )}
        </TouchableOpacity>

        {notFound ? (
          <View style={styles.notFoundBox}>
            <Text style={[styles.notFoundText, { textAlign: textAlign(isRTL) }]}>{t('scanner.notFound')}</Text>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => router.replace({ pathname: '/add-food/custom', params: { mealSlot, date } })}
            >
              <Text style={styles.customButtonText}>{t('addFood.createCustom')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
  camera: { height: 260, borderRadius: 14, overflow: 'hidden', marginBottom: 6 },
  permissionButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
  webNote: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  manualLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  lookupButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  lookupButtonText: { color: '#fff', fontWeight: '700' },
  notFoundBox: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notFoundText: { color: colors.text, fontSize: 13, marginBottom: 10 },
  customButton: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  customButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelButton: { alignItems: 'center', paddingVertical: 16, marginTop: 'auto' },
  cancelButtonText: { color: colors.textMuted, fontSize: 14 },
});
