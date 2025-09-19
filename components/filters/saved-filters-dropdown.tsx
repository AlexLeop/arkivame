
'use client';

import { Clock, Star, Globe, Lock } from 'lucide-react';
import { SavedFilter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SavedFiltersDropdownProps {
  filters: SavedFilter[];
  onLoadFilter?: (filter: SavedFilter) => void;
}

export function SavedFiltersDropdown({
  filters,
  onLoadFilter
}: SavedFiltersDropdownProps) {
  const defaultFilters = filters.filter(f => f.isDefault);
  const publicFilters = filters.filter(f => f.isPublic && !f.isDefault);
  const privateFilters = filters.filter(f => !f.isPublic && !f.isDefault);
  
  const formatFilterPreview = (filterConfig: any) => {
    const parts = [];
    
    if (filterConfig.query) {
      parts.push(`"${filterConfig.query}"`);
    }
    
    if (filterConfig.tags?.length) {
      parts.push(`${filterConfig.tags.length} tag${filterConfig.tags.length !== 1 ? 's' : ''}`);
    }
    
    if (filterConfig.sourceType) {
      parts.push(filterConfig.sourceType);
    }
    
    if (filterConfig.channelName) {
      parts.push(`#${filterConfig.channelName}`);
    }
    
    if (filterConfig.author) {
      parts.push(`@${filterConfig.author}`);
    }
    
    return parts.join(' • ');
  };
  
  if (filters.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No saved filters
      </Badge>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          <Clock className="h-4 w-4" />
          Saved Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {defaultFilters.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Default Filters
            </DropdownMenuLabel>
            {defaultFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => onLoadFilter?.(filter)}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{filter.name}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="h-3 w-3 fill-current text-amber-500" />
                    {filter.isPublic && <Globe className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
                {filter.description && (
                  <p className="text-xs text-muted-foreground">{filter.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {formatFilterPreview(filter.filterConfig)}
                </div>
                {filter.usageCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Used {filter.usageCount} times
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        
        {publicFilters.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Shared Filters
            </DropdownMenuLabel>
            {publicFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => onLoadFilter?.(filter)}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{filter.name}</span>
                  <Globe className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
                {filter.description && (
                  <p className="text-xs text-muted-foreground">{filter.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {formatFilterPreview(filter.filterConfig)}
                </div>
                {filter.usageCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Used {filter.usageCount} times
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        
        {privateFilters.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              My Filters
            </DropdownMenuLabel>
            {privateFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => onLoadFilter?.(filter)}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{filter.name}</span>
                  <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
                {filter.description && (
                  <p className="text-xs text-muted-foreground">{filter.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {formatFilterPreview(filter.filterConfig)}
                </div>
                {filter.usageCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Used {filter.usageCount} times
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SavedFiltersDropdown;
