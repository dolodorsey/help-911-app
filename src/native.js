// Help 911 — Native Bridge (Capacitor)
// Handles StatusBar, SplashScreen, Keyboard, Haptics on iOS

import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

export async function initNative() {
  if (!isNative) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#07080C" });
  } catch (e) { console.log("StatusBar not available:", e); }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (e) { console.log("SplashScreen not available:", e); }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.setAccessoryBarVisible({ isVisible: true });
    Keyboard.setResizeMode({ mode: "body" });
  } catch (e) { console.log("Keyboard not available:", e); }
}

export async function haptic(type = "light") {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const styles = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: styles[type] || ImpactStyle.Light });
  } catch (e) {}
}
