'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  Calendar, 
  User, 
  MessageSquare, 
  Tag, 
  Star, 
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: 'SLACK' | 'TEAMS' | 'MANUAL';
  channel: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  bookmarked: boolean;
  summary?: string;
  actionItems?: string[];
  decisions?: string[];
  participants?: string[];
  originalUrl?: string;
}

interface KnowledgeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
}

export function KnowledgeDetailModal({ isOpen, onClose, itemId }: KnowledgeDetailModalProps) {
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchKnowledgeItem();
    }
  }, [isOpen, itemId]);

  const fetchKnowledgeItem = async () => {
    if (!itemId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/knowledge/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        setItem(data);
        
        // Increment view count
        await fetch(`/api/knowledge/${itemId}/view`, { method: 'POST' });
      } else {
        console.error('Failed to fetch knowledge item:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching knowledge item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!item) return;
    
    try {
      setBookmarking(true);
      const response = await fetch(`/api/knowledge/${item.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: !item.bookmarked })
      });
      
      if (response.ok) {
        setItem(prev => prev ? { ...prev, bookmarked: !prev.bookmarked } : null);
      }
    } catch (error) {
      console.error('Error bookmarking item:', error);
    } finally {
      setBookmarking(false);
    }
  };

  const handleExportToWiki = async (platform: string) => {
    if (!item) return;
    
    try {
      const response = await fetch(`/api/knowledge/${item.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      
      if (response.ok) {
        // Show success message or redirect
        console.log(`Exported to ${platform} successfully`);
      }
    } catch (error) {
      console.error(`Error exporting to ${platform}:`, error);
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'SLACK': return 'default';
      case 'TEAMS': return 'secondary';
      case 'MANUAL': return 'outline';
      default: return 'outline';
    }
  };

  const formatContent = (content: string) => {
    // Simple formatting for chat messages
    return content.split('\n').map((line, index) => {
      // Detect user messages (format: "User: message")
      const userMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (userMatch) {
        return (
          <div key={index} className="mb-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{userMatch[1]}</span>
            </div>
            <p className="text-sm">{userMatch[2]}</p>
          </div>
        );
      }
      
      // Regular text
      return line.trim() ? (
        <p key={index} className="mb-2 text-sm leading-relaxed">{line}</p>
      ) : (
        <br key={index} />
      );
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!item) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Item de conhecimento não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold leading-tight pr-4">
                {item.title}
              </DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(item.createdAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {item.views} visualizações
                </div>
                <Badge variant={getSourceBadgeVariant(item.source)}>
                  {item.source}
                </Badge>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                disabled={bookmarking}
                className={item.bookmarked ? 'text-yellow-600' : ''}
              >
                <Star className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {item.author}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {item.channel}
            </div>
            {item.originalUrl && (
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href={item.originalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver original
                </a>
              </Button>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* AI Summary */}
            {item.summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Resumo Inteligente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{item.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            {item.actionItems && item.actionItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Itens de Ação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.actionItems.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Decisions */}
            {item.decisions && item.decisions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    Decisões Tomadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.decisions.map((decision, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {decision}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Content */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversa Completa
              </h3>
              <div className="space-y-2">
                {formatContent(item.content)}
              </div>
            </div>

            {/* Export Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Enviar para Wiki
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportToWiki('notion')}
                  >
                    Notion
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportToWiki('confluence')}
                  >
                    Confluence
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportToWiki('google-docs')}
                  >
                    Google Docs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportToWiki('github')}
                  >
                    GitHub Wiki
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

