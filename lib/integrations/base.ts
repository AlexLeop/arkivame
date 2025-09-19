
export interface IntegrationConfig {
  type: string;
  credentials: Record<string, string>;
  settings: Record<string, any>;
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
}

export interface ThreadMessage {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  attachments?: any[];
}

export interface CapturedThread {
  id: string;
  channelId: string;
  channelName: string;
  rootAuthor: string;
  messages: ThreadMessage[];
  timestamp: Date;
  metadata: Record<string, any>;
}

export abstract class InputIntegration extends BaseIntegration {
  abstract captureThread(threadId: string): Promise<CapturedThread>;
  abstract startListening(): Promise<void>;
  abstract stopListening(): Promise<void>;
}

export interface ExportResult {
  success: boolean;
  externalId?: string;
  url?: string;
  error?: string;
}

export abstract class OutputIntegration extends BaseIntegration {
  abstract exportKnowledge(
    title: string,
    content: any[],
    tags?: string[]
  ): Promise<ExportResult>;
}
