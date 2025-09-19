
import { InputIntegration, CapturedThread, ThreadMessage } from './base';

export class DiscordIntegration extends InputIntegration {
  private token: string;
  private isListening = false;

  constructor(config: any) {
    super(config);
    this.token = config.credentials.botToken;
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bot ${this.token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Discord connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopListening();
  }

  async testConnection(): Promise<boolean> {
    return this.connect();
  }

  async captureThread(messageId: string, channelId?: string): Promise<CapturedThread> {
    try {
      if (!channelId) {
        throw new Error('Channel ID required for Discord');
      }

      // Get the original message
      const messageResponse = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bot ${this.token}`,
          },
        }
      );

      if (!messageResponse.ok) {
        throw new Error('Failed to fetch Discord message');
      }

      const message = await messageResponse.json();

      // Get thread messages if it's a thread
      let messages: ThreadMessage[] = [{
        id: message.id,
        author: message.author?.username || 'unknown',
        content: message.content || '',
        timestamp: new Date(message.timestamp),
        attachments: message.attachments || [],
      }];

      // If message has a thread, fetch thread messages
      if (message.thread) {
        const threadResponse = await fetch(
          `https://discord.com/api/v10/channels/${message.thread.id}/messages`,
          {
            headers: {
              'Authorization': `Bot ${this.token}`,
            },
          }
        );

        if (threadResponse.ok) {
          const threadMessages = await threadResponse.json();
          const additionalMessages: ThreadMessage[] = threadMessages.map((msg: any) => ({
            id: msg.id,
            author: msg.author?.username || 'unknown',
            content: msg.content || '',
            timestamp: new Date(msg.timestamp),
            attachments: msg.attachments || [],
          }));
          messages = messages.concat(additionalMessages);
        }
      }

      // Get channel info
      const channelResponse = await fetch(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bot ${this.token}`,
          },
        }
      );

      const channel = channelResponse.ok ? await channelResponse.json() : null;

      return {
        id: messageId,
        channelId,
        channelName: channel?.name || 'unknown',
        rootAuthor: messages[0]?.author || 'unknown',
        messages,
        timestamp: messages[0]?.timestamp || new Date(),
        metadata: {
          platform: 'discord',
          guild: channel?.guild_id,
        },
      };
    } catch (error) {
      console.error('Failed to capture Discord thread:', error);
      throw error;
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('Discord integration listening started');
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    console.log('Discord integration listening stopped');
  }
}
