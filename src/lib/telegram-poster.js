import fetch from 'node-fetch';

/**
 * Telegram Channel Poster
 * Sends formatted messages to Telegram channels
 */
export class TelegramPoster {
  constructor() {
    this.token = process.env.TELEGRAM_TOKEN;
    this.freeChannelId = process.env.FREE_CHAT_ID;
    this.premiumChannelId = process.env.PREMIUM_CHAT_ID;

    if (!this.token) {
      throw new Error('TELEGRAM_TOKEN not set');
    }
  }

  /**
   * Send message to a channel
   * @param {string} channelId - Channel username (@channelname) or ID
   * @param {string} message - Message text (supports Markdown)
   * @param {object} options - Additional options
   */
  async sendMessage(channelId, message, options = {}) {
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

    const payload = {
      chat_id: channelId,
      text: message,
      parse_mode: options.parseMode || 'Markdown',
      disable_web_page_preview: options.disablePreview ?? true,
      disable_notification: options.silent ?? false,
      ...options
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      return data.result;
    } catch (error) {
      console.error('Failed to send Telegram message:', error.message);
      throw error;
    }
  }

  /**
   * Send to free channel
   */
  async sendToFreeChannel(message, options = {}) {
    if (!this.freeChannelId) {
      throw new Error('FREE_CHAT_ID not configured');
    }
    return this.sendMessage(this.freeChannelId, message, options);
  }

  /**
   * Send to premium channel
   */
  async sendToPremiumChannel(message, options = {}) {
    if (!this.premiumChannelId) {
      throw new Error('PREMIUM_CHAT_ID not configured');
    }
    return this.sendMessage(this.premiumChannelId, message, options);
  }

  /**
   * Test connection by getting bot info
   */
  async testConnection() {
    const url = `https://api.telegram.org/bot${this.token}/getMe`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Bot token invalid: ${data.description}`);
      }

      return {
        success: true,
        bot: data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default TelegramPoster;
