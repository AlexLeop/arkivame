
import { OutputIntegration, ExportResult } from './base';

export class ConfluenceOutputIntegration extends OutputIntegration {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private spaceKey?: string;
  private parentPageId?: string;

  constructor(config: any) {
    super(config);
    this.baseUrl = config.credentials.baseUrl;
    this.email = config.credentials.email;
    this.apiToken = config.credentials.apiToken;
    this.spaceKey = config.settings.spaceKey;
    this.parentPageId = config.settings.parentPageId;
  }

  async connect(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
      const response = await fetch(`${this.baseUrl}/rest/api/user/current`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Confluence connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to disconnect for Confluence API
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
      if (!this.spaceKey) {
        throw new Error('Confluence space key not configured');
      }

      const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
      
      // Convert content to Confluence storage format
      const storageContent = this.convertContentToStorage(content, tags);

      const pageData = {
        type: 'page',
        title,
        space: {
          key: this.spaceKey,
        },
        body: {
          storage: {
            value: storageContent,
            representation: 'storage',
          },
        },
        ...(this.parentPageId && {
          ancestors: [
            {
              id: this.parentPageId,
            },
          ],
        }),
      };

      const response = await fetch(`${this.baseUrl}/rest/api/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Confluence API error: ${error}`);
      }

      const page = await response.json();

      return {
        success: true,
        externalId: page.id,
        url: `${this.baseUrl}/pages/viewpage.action?pageId=${page.id}`,
      };
    } catch (error) {
      console.error('Failed to export to Confluence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private convertContentToStorage(content: any[], tags: string[]): string {
    let storage = '<div class="arkivame-import">';
    
    if (tags.length > 0) {
      storage += '<p><strong>Tags:</strong> ' + tags.join(', ') + '</p>';
      storage += '<hr/>';
    }

    content.forEach((message, index) => {
      if (index > 0) {
        storage += '<hr/>';
      }

      storage += `<h3>${this.escapeHtml(message.author)} - ${new Date(message.timestamp).toLocaleString()}</h3>`;
      
      if (message.content) {
        storage += `<p>${this.escapeHtml(message.content).replace(/\n/g, '<br/>')}</p>`;
      }

      if (message.attachments?.length > 0) {
        storage += '<p><strong>Anexos:</strong></p><ul>';
        message.attachments.forEach((attachment: any) => {
          if (attachment.url) {
            storage += `<li><a href="${attachment.url}">${attachment.name || 'Attachment'}</a></li>`;
          }
        });
        storage += '</ul>';
      }
    });

    storage += '<p><em>Importado do Arkivame em ' + new Date().toLocaleString() + '</em></p>';
    storage += '</div>';

    return storage;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
