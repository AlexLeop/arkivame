
import { WebClient } from '@slack/web-api';
import { InputIntegration, CapturedThread, ThreadMessage } from './base';

export class SlackIntegration extends InputIntegration {
  private client: WebClient;
  private isListening = false;

  constructor(config: any) {
    super(config);
    this.client = new WebClient(config.credentials.botToken);
  }

  async connect(): Promise<boolean> {
    try {
      const auth = await this.client.auth.test();
      return auth.ok === true;
    } catch (error) {
      console.error('Slack connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopListening();
  }

  async testConnection(): Promise<boolean> {
    return this.connect();
  }

  async captureThread(threadId: string): Promise<CapturedThread> {
    const [messageTs, channelId] = threadId.split(':');
    try {
      // Get thread messages
      const threadsResponse = await this.client.conversations.replies({
        channel: channelId,
        ts: messageTs,
      });

      if (!threadsResponse.ok || !threadsResponse.messages) {
        throw new Error('Failed to fetch thread messages');
      }

      // Get channel info
      const channelInfo = await this.client.conversations.info({
        channel: channelId,
      });

      const messages: ThreadMessage[] = threadsResponse.messages.map((msg: any) => ({
        id: msg.ts,
        author: msg.user || 'unknown',
        content: msg.text || '',
        timestamp: new Date(parseFloat(msg.ts) * 1000),
        attachments: msg.attachments || [],
      }));

      return {
        id: messageTs,
        channelId,
        channelName: channelInfo.channel?.name || 'unknown',
        rootAuthor: messages[0]?.author || 'unknown',
        messages,
        timestamp: messages[0]?.timestamp || new Date(),
        metadata: {
          platform: 'slack',
          team: threadsResponse.messages[0]?.team,
        },
      };
    } catch (error) {
      console.error('Failed to capture Slack thread:', error);
      throw error;
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;
    // In a real implementation, you would set up RTM or Events API
    // For now, this is a placeholder for webhook handling
    console.log('Slack integration listening started');
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    console.log('Slack integration listening stopped');
  }

  async getUserInfo(userId: string) {
    try {
      const result = await this.client.users.info({ user: userId });
      return result.user;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  async sendMessage(channel: string, text: string, threadTs?: string) {
    try {
      return await this.client.chat.postMessage({
        channel,
        text,
        thread_ts: threadTs,
      });
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      throw error;
    }
  }
}
