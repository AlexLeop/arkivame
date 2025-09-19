
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Tag as TagIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedTag, TagHierarchy } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TagHierarchyTreeProps {
  tags: TagHierarchy[];
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagEdit?: (tag: ExtendedTag) => void;
  onTagDelete?: (tagId: string) => void;
  onTagAdd?: (parentId?: string) => void;
  readonly?: boolean;
  showActions?: boolean;
  showCounts?: boolean;
}

interface TagNodeProps {
  tag: TagHierarchy;
  level: number;
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagEdit?: (tag: ExtendedTag) => void;
  onTagDelete?: (tagId: string) => void;
  onTagAdd?: (parentId?: string) => void;
  readonly?: boolean;
  showActions?: boolean;
  showCounts?: boolean;
}

function TagNode({
  tag,
  level,
  selectedTags = [],
  onTagSelect,
  onTagEdit,
  onTagDelete,
  onTagAdd,
  readonly = false,
  showActions = false,
  showCounts = false
}: TagNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = tag.children?.length > 0;
  const isSelected = selectedTags.includes(tag.id);
  
  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readonly && onTagSelect) {
      onTagSelect(tag.id);
    }
  };
  
  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group',
          isSelected && 'bg-secondary/10 border border-secondary/20',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>
        
        {/* Tag Icon */}
        <div 
          className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ backgroundColor: tag.color }}
        >
          {tag.icon ? (
            <span className="text-xs">{tag.icon}</span>
          ) : (
            <TagIcon className="h-3 w-3" />
          )}
        </div>
        
        {/* Tag Name */}
        <button
          onClick={handleSelect}
          className={cn(
            'flex-1 text-left text-sm font-medium transition-colors',
            isSelected ? 'text-secondary' : 'text-foreground',
            !readonly && 'hover:text-secondary cursor-pointer'
          )}
        >
          {tag.name}
        </button>
        
        {/* Usage Count */}
        {showCounts && (tag as any)?._count?.assignments !== undefined && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {(tag as any)._count.assignments}
          </span>
        )}
        
        {/* Actions Menu */}
        {showActions && !tag.isSystem && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onTagAdd?.(tag.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTagEdit?.(tag as ExtendedTag)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onTagDelete?.(tag.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {tag.children?.map((childTag) => (
            <TagNode
              key={childTag.id}
              tag={childTag}
              level={level + 1}
              selectedTags={selectedTags}
              onTagSelect={onTagSelect}
              onTagEdit={onTagEdit}
              onTagDelete={onTagDelete}
              onTagAdd={onTagAdd}
              readonly={readonly}
              showActions={showActions}
              showCounts={showCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TagHierarchyTree(props: TagHierarchyTreeProps) {
  const {
    tags,
    onTagAdd,
    showActions = false
  } = props;
  
  if (!tags?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No tags yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first tag to organize your knowledge base
        </p>
        {showActions && onTagAdd && (
          <Button onClick={() => onTagAdd()} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {showActions && onTagAdd && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tag Hierarchy</h3>
          <Button onClick={() => onTagAdd()} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>
      )}
      
      <div className="space-y-1">
        {tags.map((tag) => (
          <TagNode
            key={tag.id}
            tag={tag}
            level={0}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}

export default TagHierarchyTree;
