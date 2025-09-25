'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  ExternalLink,
  Calendar,
  User,
  MessageSquare,
  Tag,
  Download,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface ModernKnowledgeTableProps {
  items: KnowledgeItem[];
  loading?: boolean;
  onItemClick?: (item: KnowledgeItem) => void;
  onEdit?: (item: KnowledgeItem) => void;
  onDelete?: (item: KnowledgeItem) => void;
  onBookmark?: (item: KnowledgeItem) => void;
}

export function ModernKnowledgeTable({ 
  items, 
  loading = false,
  onItemClick,
  onEdit,
  onDelete,
  onBookmark
}: ModernKnowledgeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const getSourceBadge = (source: string) => {
    const config = {
      SLACK: { color: 'bg-purple-100 text-purple-800', label: 'Slack' },
      TEAMS: { color: 'bg-blue-100 text-blue-800', label: 'Teams' },
      MANUAL: { color: 'bg-green-100 text-green-800', label: 'Manual' }
    };
    return config[source as keyof typeof config] || config.MANUAL;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);
    
    return matchesSearch && matchesSource && matchesTag;
  });

  const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

  if (loading) {
    return (
      <div className="arkivame-card">
        <div className="arkivame-card-content">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="arkivame-skeleton h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="arkivame-skeleton h-4 w-3/4" />
                  <div className="arkivame-skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="arkivame-card">
        <div className="arkivame-card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search knowledge items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="arkivame-input"
              />
            </div>
            
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[150px] arkivame-select">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="SLACK">Slack</SelectItem>
                <SelectItem value="TEAMS">Teams</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-[150px] arkivame-select">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="arkivame-body-small">
          Showing {filteredItems.length} of {items.length} knowledge items
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Knowledge Table */}
      <div className="arkivame-card overflow-hidden">
        <Table className="arkivame-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Title & Content</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const sourceBadge = getSourceBadge(item.source);
              
              return (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => onItemClick?.(item)}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookmark?.(item);
                      }}
                      className="p-1"
                    >
                      <Star className={`h-4 w-4 ${item.bookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                  </TableCell>
                  
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="arkivame-body-small text-gray-600 line-clamp-2">
                        {truncateText(item.content)}
                      </p>
                      {item.channel && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          <span>#{item.channel}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`arkivame-badge ${sourceBadge.color}`}>
                      {sourceBadge.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {item.author.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="arkivame-body-small font-medium">
                        {item.author}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} className="arkivame-badge arkivame-badge-neutral text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge className="arkivame-badge arkivame-badge-neutral text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Eye className="h-3 w-3" />
                      <span>{item.views}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onItemClick?.(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        {item.originalUrl && (
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Original
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDelete?.(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredItems.length === 0 && (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="arkivame-heading-3 mb-2">No knowledge items found</h3>
            <p className="arkivame-body text-gray-600">
              Try adjusting your search criteria or add some knowledge items.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

