import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

type ConfirmHandler = (options: ConfirmOptions) => void;

let webHandler: ConfirmHandler | null = null;

/** Lets the in-app dialog (mounted once at the root) take over confirmations on web. */
export function registerConfirmHandler(handler: ConfirmHandler | null): void {
  webHandler = handler;
}

/**
 * Asks before an irreversible action. Native uses the system alert. On web, Alert.alert buttons do
 * nothing and embedded previews block window.confirm, so the in-app dialog asks instead.
 */
export function confirmAction(options: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    if (webHandler) {
      webHandler(options);
      return;
    }
    // eslint-disable-next-line no-alert
    if (window.confirm(`${options.title}\n\n${options.message}`)) options.onConfirm();
    return;
  }
  Alert.alert(options.title, options.message, [
    { text: options.cancelLabel, style: 'cancel' },
    { text: options.confirmLabel, style: options.destructive ? 'destructive' : 'default', onPress: options.onConfirm },
  ]);
}
