
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Save, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchFilters, SavedFilter } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { TagSelector } from './tag-selector';
import { SavedFiltersDropdown } from './saved-filters-dropdown';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: Omit<SavedFilter, 'id'>) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  isLoading?: boolean;
  suggestions?: {
    channels: string[];
    authors: string[];
  };
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  isLoading = false,
  suggestions
}: AdvancedSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Auto-expand advanced filters if any advanced filters are active
  useEffect(() => {
    const hasAdvancedFilters = 
      filters.sourceType ||
      filters.channelName ||
      filters.author ||
      filters.dateFrom ||
      filters.dateTo ||
      (filters.tags && filters.tags.length > 0);
    
    if (hasAdvancedFilters) {
      setShowAdvanced(true);
    }
  }, [filters]);
  
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  
  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };
  
  const clearAllFilters = () => {
    onFiltersChange({});
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.tags?.length) count++;
    if (filters.sourceType) count++;
    if (filters.channelName) count++;
    if (filters.author) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };
  
  const handleSaveFilter = () => {
    if (!saveFilterName.trim() || !onSaveFilter) return;
    
    onSaveFilter({
      name: saveFilterName,
      description: null,
      filterConfig: filters,
      isPublic: false,
      isDefault: false,
      usageCount: 0,
      organizationId: '',
      userId: '',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Omit<SavedFilter, 'id'>);
    
    setSaveFilterName('');
    setShowSaveDialog(false);
  };
  
  const activeFilterCount = getActiveFilterCount();
  
  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-10 arkivame-input"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'relative',
            activeFilterCount > 0 && 'border-secondary text-secondary'
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        <Button 
          onClick={onSearch}
          disabled={isLoading}
          className="arkivame-button-primary"
        >
          Search
        </Button>
      </div>
      
      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Quick filters:</span>
          <SavedFiltersDropdown
            filters={savedFilters}
            onLoadFilter={onLoadFilter}
          />
        </div>
      )}
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="arkivame-card p-4 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              {onSaveFilter && activeFilterCount > 0 && (
                <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Filter Name</label>
                        <Input
                          placeholder="My custom filter"
                          value={saveFilterName}
                          onChange={(e) => setSaveFilterName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tags Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <TagSelector
                selectedTags={filters.tags || []}
                onTagsChange={(tags) => updateFilter('tags', tags)}
                placeholder="Select tags..."
              />
            </div>
            
            {/* Source Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select
                value={filters.sourceType || 'all'}
                onValueChange={(value) => 
                  updateFilter('sourceType', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="SLACK">Slack</SelectItem>
                  <SelectItem value="TEAMS">Teams</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Channel Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <Input
                placeholder="Channel name..."
                value={filters.channelName || ''}
                onChange={(e) => updateFilter('channelName', e.target.value)}
                className="arkivame-input"
              />
            </div>
            
            {/* Author Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Author</label>
              <Input
                placeholder="Author name..."
                value={filters.author || ''}
                onChange={(e) => updateFilter('author', e.target.value)}
                className="arkivame-input"
              />
            </div>
            
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      format(new Date(filters.dateFrom), 'PPP')
                    ) : (
                      'Pick a date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onSelect={(date) => 
                      updateFilter('dateFrom', date ? date.toISOString() : '')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateTo && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateTo ? (
                      format(new Date(filters.dateTo), 'PPP')
                    ) : (
                      'Pick a date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={(date) => 
                      updateFilter('dateTo', date ? date.toISOString() : '')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                {filters.query && (
                  <Badge variant="secondary" className="gap-1">
                    Search: &quot;{filters.query}&quot;
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('query')}
                    />
                  </Badge>
                )}
                {filters.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    Tag: {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => updateFilter('tags', filters.tags?.filter(t => t !== tag) || [])}
                    />
                  </Badge>
                ))}
                {filters.sourceType && (
                  <Badge variant="secondary" className="gap-1">
                    Source: {filters.sourceType}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('sourceType')}
                    />
                  </Badge>
                )}
                {filters.channelName && (
                  <Badge variant="secondary" className="gap-1">
                    Channel: {filters.channelName}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('channelName')}
                    />
                  </Badge>
                )}
                {filters.author && (
                  <Badge variant="secondary" className="gap-1">
                    Author: {filters.author}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('author')}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    From: {format(new Date(filters.dateFrom), 'PP')}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('dateFrom')}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    To: {format(new Date(filters.dateTo), 'PP')}
                    <X
                      className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                      onClick={() => clearFilter('dateTo')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdvancedSearchFilters;
