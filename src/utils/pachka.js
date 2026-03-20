/**
 * Pachka Webhook Utility
 * Handles sending notifications to different corporate channels.
 */

const DEFAULT_WEBHOOKS = {
  tech: localStorage.getItem('pachka_tech_webhook') || '',
  finance: localStorage.getItem('pachka_finance_webhook') || '',
  client: localStorage.getItem('pachka_client_webhook') || '',
};

export const sendPachkaNotification = async (channel, message) => {
  const webhookUrl = localStorage.getItem(`pachka_${channel}_webhook`) || DEFAULT_WEBHOOKS[channel];
  
  if (!webhookUrl) {
    console.warn(`Pachka: No webhook URL configured for channel "${channel}"`);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Pachka API error: ${response.statusText}`);
    }

    console.log(`Pachka: Notification sent to ${channel}`);
    return true;
  } catch (error) {
    console.error(`Pachka: Failed to send notification to ${channel}`, error);
    return false;
  }
};

export const CHANNELS = {
  TECH: 'tech',
  FINANCE: 'finance',
  CLIENT: 'client',
};
