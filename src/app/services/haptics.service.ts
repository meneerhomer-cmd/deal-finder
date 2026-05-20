import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Thin wrapper over @capacitor/haptics. Haptics are best-effort and native-only:
 * every call is a no-op on web and swallows errors, so callers can fire them
 * freely without guarding. This is the "alive" layer that makes taps feel like
 * an app rather than a web page.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private readonly native = Capacitor.isNativePlatform();

  /** A light tap — navigation, card taps, chip taps. */
  light() { this.fire(() => Haptics.impact({ style: ImpactStyle.Light })); }

  /** A firmer tap — pull-to-refresh, destructive confirm. */
  medium() { this.fire(() => Haptics.impact({ style: ImpactStyle.Medium })); }

  /** A success buzz — added to list, saved. */
  success() { this.fire(() => Haptics.notification({ type: NotificationType.Success })); }

  /** A subtle selection tick — switching tabs / segments. */
  selection() { this.fire(() => Haptics.selectionStart().then(() => Haptics.selectionChanged())); }

  private fire(action: () => Promise<unknown>) {
    if (!this.native) return;
    try { action().catch(() => {}); } catch { /* haptics never block the UI */ }
  }
}
