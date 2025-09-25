'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: 'SLACK' | 'TEAMS' | 'MANUAL';
  channel: string;
  tags: string[];
  isPublic?: boolean;
  summary?: string;
}

interface EditKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKnowledgeUpdated: (knowledge: any) => void;
  itemId: string | null;
}

const availableTags = [
  'planning', 'engineering', 'design', 'security', 'performance',
  'database', 'frontend', 'backend', 'mobile', 'api', 'testing',
  'deployment', 'monitoring', 'documentation', 'best-practices'
];

export function EditKnowledgeModal({ open, onOpenChange, onKnowledgeUpdated, itemId }: EditKnowledgeModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [formData, setFormData] = useState<KnowledgeItem>({
    id: '',
    title: '',
    content: '',
    source: 'MANUAL',
    channel: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch knowledge item data when modal opens
  useEffect(() => {
    const fetchKnowledgeItem = async () => {
      if (!itemId) return;
      
      try {
        setFetchLoading(true);
        const response = await fetch(`/api/knowledge/${itemId}`);
        
        if (response.ok) {
          const data = await response.json();
          setFormData({
            id: data.id,
            title: data.title,
            content: data.content,
            source: data.source,
            channel: data.channel || '',
            tags: data.tags || [],
            isPublic: data.isPublic,
            summary: data.summary
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch knowledge item.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching knowledge item:', error);
        toast({
          title: "Error",
          description: "Failed to fetch knowledge item.",
          variant: "destructive"
        });
      } finally {
        setFetchLoading(false);
      }
    };

    if (open && itemId) {
      fetchKnowledgeItem();
    }
  }, [open, itemId, setFetchLoading, setFormData, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/knowledge/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedKnowledge = await response.json();
        
        toast({
          title: "Knowledge Updated",
          description: "Your knowledge item has been successfully updated.",
          variant: "success"
        });

        onKnowledgeUpdated(updatedKnowledge);
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update knowledge');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update knowledge item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !formData.tags.includes(normalizedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, normalizedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  if (fetchLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Knowledge Item</DialogTitle>
            <DialogDescription>
              Update this knowledge item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Describe the knowledge, insights, or solution..."
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: 'SLACK' | 'TEAMS' | 'MANUAL') => setFormData(prev => ({ ...prev, source: value }))}
                  disabled={true} // Source shouldn't be changed after creation
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual Entry</SelectItem>
                    <SelectItem value="SLACK">Slack</SelectItem>
                    <SelectItem value="TEAMS">Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Channel/Source</Label>
                <Input
                  id="channel"
                  placeholder="#general, Teams chat, etc."
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Type a tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  Add Tag
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTags.filter(tag => !formData.tags.includes(tag)).slice(0, 8).map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Knowledge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}