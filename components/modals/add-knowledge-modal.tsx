
'use client';

import { useState } from 'react';
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

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKnowledgeAdded: (knowledge: any) => void;
}

const availableTags = [
  'planning', 'engineering', 'design', 'security', 'performance',
  'database', 'frontend', 'backend', 'mobile', 'api', 'testing',
  'deployment', 'monitoring', 'documentation', 'best-practices'
];

export function AddKnowledgeModal({ open, onOpenChange, onKnowledgeAdded }: AddKnowledgeModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: 'MANUAL',
    channel: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

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
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newKnowledge = await response.json();
        
        toast({
          title: "Knowledge Added",
          description: "Your knowledge item has been successfully created.",
          variant: "success"
        });

        onKnowledgeAdded(newKnowledge);
        resetForm();
        onOpenChange(false);
      } else {
        throw new Error('Failed to create knowledge');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create knowledge item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      source: 'MANUAL',
      channel: '',
      tags: []
    });
    setTagInput('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Knowledge Item</DialogTitle>
            <DialogDescription>
              Create a new knowledge item to share with your team
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
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

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-xs hover:text-destructive"
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
              {isLoading ? 'Creating...' : 'Create Knowledge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
