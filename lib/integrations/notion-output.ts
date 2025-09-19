
import { OutputIntegration, ExportResult } from './base';

export class NotionOutputIntegration extends OutputIntegration {
  private apiKey: string;
  private databaseId?: string;

  constructor(config: any) {
    super(config);
    this.apiKey = config.credentials.apiKey;
    this.databaseId = config.settings.databaseId;
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Notion connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to disconnect for Notion API
  }

  async testConnection(): Promise<boolean> {
    return this.connect();
  }

  async exportKnowledge(
    title: string,
    content: any[],
    tags: string[] = []
  ): Promise<ExportResult> {
    try {
      if (!this.databaseId) {
        throw new Error('Notion database ID not configured');
      }

      // Convert content to Notion blocks
      const blocks = this.convertContentToBlocks(content);

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: {
            type: 'database_id',
            database_id: this.databaseId,
          },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: title,
                  },
                },
              ],
            },
            Tags: tags.length > 0 ? {
              multi_select: tags.map(tag => ({ name: tag })),
            } : undefined,
            Source: {
              select: {
                name: 'Arkivame',
              },
            },
          },
          children: blocks,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API error: ${error}`);
      }

      const page = await response.json();

      return {
        success: true,
        externalId: page.id,
        url: page.url,
      };
    } catch (error) {
      console.error('Failed to export to Notion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private convertContentToBlocks(content: any[]): any[] {
    const blocks: any[] = [];

    content.forEach((message, index) => {
      if (index > 0) {
        // Add divider between messages
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });
      }

      // Add author header
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${message.author} - ${new Date(message.timestamp).toLocaleString()}`,
              },
            },
          ],
        },
      });

      // Add message content
      if (message.content) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: message.content,
                },
              },
            ],
          },
        });
      }

      // Add attachments if any
      if (message.attachments?.length > 0) {
        message.attachments.forEach((attachment: any) => {
          if (attachment.url) {
            blocks.push({
              object: 'block',
              type: 'embed',
              embed: {
                url: attachment.url,
              },
            });
          }
        });
      }
    });

    return blocks;
  }
}
