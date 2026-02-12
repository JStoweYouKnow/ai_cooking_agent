/**
 * Expo push notification helper
 */

export async function sendExpoPush(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn("[Push] Failed to deliver notification:", text);
    }
  } catch (error) {
    console.error("[Push] Error sending notification:", error);
  }
}
