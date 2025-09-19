
'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown, X, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ExtendedTag } from '@/lib/types';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export function TagSelector({
  selectedTags = [],
  onTagsChange,
  placeholder = 'Select tags...',
  maxTags = 10,
  disabled = false
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<ExtendedTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/tags?hierarchical=false');
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTags();
  }, []);
  
  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.slug));
  
  const toggleTag = (tagSlug: string) => {
    const newSelectedTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter(slug => slug !== tagSlug)
      : [...selectedTags, tagSlug];
    
    onTagsChange(newSelectedTags);
  };
  
  const removeTag = (tagSlug: string) => {
    const newSelectedTags = selectedTags.filter(slug => slug !== tagSlug);
    onTagsChange(newSelectedTags);
  };
  
  const clearAll = () => {
    onTagsChange([]);
  };
  
  // Group tags by hierarchy for better display
  const groupedTags = tags.reduce((groups, tag) => {
    const level = tag.level || 0;
    if (!groups[level]) groups[level] = [];
    groups[level].push(tag);
    return groups;
  }, {} as Record<number, ExtendedTag[]>);
  
  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 arkivame-tag hover-lift"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.icon && <span className="text-xs">{tag.icon}</span>}
              <span className="text-xs">{tag.name}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:bg-current/20 rounded-full"
                onClick={() => removeTag(tag.slug)}
              />
            </Badge>
          ))}
          {selectedTags.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
      
      {/* Tag Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              selectedTags.length === 0 && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              <span className="truncate">
                {selectedTags.length === 0
                  ? placeholder
                  : `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} selected`
                }
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>
              {isLoading ? 'Loading tags...' : 'No tags found.'}
            </CommandEmpty>
            
            {Object.entries(groupedTags)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, levelTags]) => (
                <CommandGroup 
                  key={level} 
                  heading={level === '0' ? 'Parent Tags' : `Level ${parseInt(level) + 1} Tags`}
                >
                  {levelTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={`${tag.name} ${tag.slug}`}
                      onSelect={() => toggleTag(tag.slug)}
                      disabled={
                        selectedTags.length >= maxTags && 
                        !selectedTags.includes(tag.slug)
                      }
                      className="gap-2"
                    >
                      <div
                        className="h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px]"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.icon ? (
                          <span>{tag.icon}</span>
                        ) : (
                          <TagIcon className="h-2.5 w-2.5" />
                        )}
                      </div>
                      
                      <span className="flex-1" style={{ paddingLeft: `${parseInt(level) * 12}px` }}>
                        {tag.name}
                      </span>
                      
                      {tag._count?.assignments !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {tag._count.assignments}
                        </span>
                      )}
                      
                      <Check
                        className={cn(
                          'h-4 w-4',
                          selectedTags.includes(tag.slug) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            }
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default TagSelector;
