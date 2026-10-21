import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useSettingsStore } from './settingsStore';

export const speakFeedback = (text: string) => {
  const { voiceFeedback } = useSettingsStore.getState().settings;
  if (!voiceFeedback || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
};

export const triggerHaptic = async (type: 'start' | 'stop' | 'milestone') => {
  const { haptics } = useSettingsStore.getState().settings;
  if (!haptics) return;

  try {
    if (type === 'start') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'stop') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === 'milestone') {
      await Haptics.notification({ type: NotificationType.Success });
    }
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }
};
