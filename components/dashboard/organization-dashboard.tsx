
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Filter, 
  Tag, 
  MessageSquare, 
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Archive,
  Settings,
  Download,
  Upload,
  Star,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/shared/user-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddKnowledgeModal } from '@/components/modals/add-knowledge-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { KnowledgeDetailModal } from '@/components/modals/knowledge-detail-modal';
import { UsageChart, TagChart } from '@/components/charts/analytics-charts';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
}

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

interface OrgStats {
  totalKnowledge: number;
  totalTags: number;
  activeUsers: number;
  monthlyViews: number;
}

export function OrganizationDashboard({ organization }: { organization: Organization }) {
  const { data: session } = useSession();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [stats, setStats] = useState<OrgStats>({
    totalKnowledge: 0,
    totalTags: 0,
    activeUsers: 0,
    monthlyViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    item: KnowledgeItem | null;
  }>({ show: false, item: null });
  const [detailModal, setDetailModal] = useState<{
    show: boolean;
    itemId: string | null;
  }>({ show: false, itemId: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 10;
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch knowledge items with pagination and filters
      const knowledgeParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedSource !== 'all' && { source: selectedSource }),
        ...(selectedTag !== 'all' && { tags: selectedTag }),
        ...(selectedAuthor !== 'all' && { author: selectedAuthor }),
        ...(selectedDateRange !== 'all' && { dateRange: selectedDateRange })
      });
      
      const knowledgeResponse = await fetch(`/api/knowledge?${knowledgeParams}`);
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        
        if (currentPage === 1) {
          setKnowledgeItems(knowledgeData.items || []);
        } else {
          // Append for infinite scroll
          setKnowledgeItems(prev => [...prev, ...(knowledgeData.items || [])]);
        }
        
        // Update pagination metadata
        if (knowledgeData.pagination) {
          setTotalPages(knowledgeData.pagination.totalPages || 1);
          setHasMore(knowledgeData.pagination.hasMore || false);
          
          // Update stats from pagination metadata
          setStats(prevStats => ({
            ...prevStats,
            totalKnowledge: knowledgeData.pagination.total || 0
          }));
        }
      } else {
        console.error('Failed to fetch knowledge items:', knowledgeResponse.statusText);
        if (currentPage === 1) {
          setKnowledgeItems([]);
        }
      }

      // Fetch analytics data only on first page
      if (currentPage === 1) {
        const analyticsResponse = await fetch('/api/analytics');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setStats(prevStats => ({
            ...prevStats,
            totalTags: analyticsData.totalTags || 0,
            activeUsers: analyticsData.activeUsers || 0,
            monthlyViews: analyticsData.monthlyViews || 0
          }));
        } else {
          console.error('Failed to fetch analytics:', analyticsResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (currentPage === 1) {
        setKnowledgeItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSource, selectedTag, selectedAuthor, selectedDateRange, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setKnowledgeItems([]);
  }, [searchQuery, selectedSource, selectedTag, selectedAuthor, selectedDateRange]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const allTags = Array.from(new Set(knowledgeItems.flatMap(item => item.tags)));
  const allAuthors = Array.from(new Set(knowledgeItems.map(item => item.author)));

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'SLACK': return 'default';
      case 'TEAMS': return 'secondary';
      case 'MANUAL': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddKnowledge = (newKnowledge: KnowledgeItem) => {
    setKnowledgeItems(prev => [newKnowledge, ...prev]);
    setStats(prev => ({
      ...prev,
      totalKnowledge: prev.totalKnowledge + 1
    }));
  };

  const handleDeleteKnowledge = async () => {
    if (!deleteModal.item) return;
    
    try {
      // In a real app, make API call to delete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setKnowledgeItems(prev => 
        prev.filter(item => item.id !== deleteModal.item!.id)
      );
      
      setStats(prev => ({
        ...prev,
        totalKnowledge: prev.totalKnowledge - 1
      }));

      setDeleteModal({ show: false, item: null });
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading {organization.name} Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArkivameLogo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">{organization.name}</h1>
              <p className="text-sm text-muted-foreground">Knowledge Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden md:flex">
              <Archive className="mr-1 h-3 w-3" />
              {stats.totalKnowledge} Items
            </Badge>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="arkivame-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="arkivame-metric-label">Knowledge Items</p>
                <p className="arkivame-metric-value">{stats.totalKnowledge}</p>
                <p className="arkivame-metric-change-positive">+12% este mês</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Archive className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="arkivame-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="arkivame-metric-label">Tags</p>
                <p className="arkivame-metric-value">{stats.totalTags}</p>
                <p className="arkivame-metric-change-positive">+5% este mês</p>
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Tag className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="arkivame-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="arkivame-metric-label">Usuários Ativos</p>
                <p className="arkivame-metric-value">{stats.activeUsers}</p>
                <p className="arkivame-metric-change-positive">+8% este mês</p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="arkivame-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="arkivame-metric-label">Visualizações</p>
                <p className="arkivame-metric-value">{stats.monthlyViews}</p>
                <p className="arkivame-metric-change-positive">+15% este mês</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="search">Advanced Search</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Knowledge Management</CardTitle>
                    <CardDescription>
                      Browse and manage your organization&apos;s captured knowledge
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Knowledge
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-4">
                  {/* Basic Filters Row */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search knowledge..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="SLACK">Slack</SelectItem>
                        <SelectItem value="TEAMS">Teams</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Advanced
                      {showAdvancedFilters ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Advanced Filters Row */}
                  {showAdvancedFilters && (
                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                      <Select value={selectedTag} onValueChange={setSelectedTag}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tags</SelectItem>
                          {allTags.map(tag => (
                            <SelectItem key={tag} value={tag}>
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Author" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Authors</SelectItem>
                          {allAuthors.map(author => (
                            <SelectItem key={author} value={author}>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {author}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Today
                            </div>
                          </SelectItem>
                          <SelectItem value="week">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              This Week
                            </div>
                          </SelectItem>
                          <SelectItem value="month">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              This Month
                            </div>
                          </SelectItem>
                          <SelectItem value="quarter">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              This Quarter
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedSource('all');
                          setSelectedTag('all');
                          setSelectedAuthor('all');
                          setSelectedDateRange('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>

                {/* Knowledge Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && currentPage === 1 ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={7}>
                            <div className="animate-pulse flex space-x-4">
                              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                              <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : knowledgeItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery || selectedSource !== 'all' || selectedTag !== 'all' 
                            ? 'No items match your filters.' 
                            : 'No knowledge items found. Start by connecting Slack or Teams.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      knowledgeItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="max-w-[300px]">
                              <div className="font-medium truncate">{item.title}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {item.content}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSourceBadgeVariant(item.source)}>
                              {item.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{item.author}</div>
                            <div className="text-xs text-muted-foreground">{item.channel}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Eye className="mr-1 h-3 w-3 text-muted-foreground" />
                              {item.views}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="View details"
                                onClick={() => setDetailModal({ show: true, itemId: item.id })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title={item.bookmarked ? "Remove bookmark" : "Add bookmark"}
                                onClick={() => {
                                  const updatedItems = knowledgeItems.map(k => 
                                    k.id === item.id ? { ...k, bookmarked: !k.bookmarked } : k
                                  );
                                  setKnowledgeItems(updatedItems);
                                }}
                              >
                                <Star className={`h-4 w-4 ${item.bookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Delete knowledge"
                                onClick={() => setDeleteModal({ show: true, item })}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {hasMore && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : `Load More (${totalPages - currentPage} pages remaining)`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Search & Filters</CardTitle>
                <CardDescription>
                  Use advanced filters and saved searches to find specific knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Advanced Search Coming Soon</h3>
                  <p className="text-sm">
                    Advanced search with natural language queries, date ranges, and complex filters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>Knowledge access patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart data={[
                    { day: 'Mon', views: 145 },
                    { day: 'Tue', views: 203 },
                    { day: 'Wed', views: 189 },
                    { day: 'Thu', views: 234 },
                    { day: 'Fri', views: 178 },
                    { day: 'Sat', views: 67 },
                    { day: 'Sun', views: 89 }
                  ]} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Content</CardTitle>
                  <CardDescription>Most accessed knowledge items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <TagChart data={[
                      { name: 'planning', count: 34 },
                      { name: 'engineering', count: 28 },
                      { name: 'design', count: 22 },
                      { name: 'security', count: 18 },
                      { name: 'performance', count: 15 }
                    ]} />
                  </div>
                  <div className="space-y-3">
                    {knowledgeItems
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.views} views</p>
                          </div>
                          <Badge variant="outline">{item.source}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Slack Integration</CardTitle>
                  <CardDescription>Connect your Slack workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically capture important Slack conversations
                    </p>
                    <Button>Connect Slack</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Microsoft Teams</CardTitle>
                  <CardDescription>Connect your Teams workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically capture important Teams conversations
                    </p>
                    <Button variant="outline">Connect Teams</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddKnowledgeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onKnowledgeAdded={handleAddKnowledge}
      />

      <DeleteConfirmationModal
        open={deleteModal.show}
        onOpenChange={(open) => setDeleteModal({ show: open, item: null })}
        onConfirm={handleDeleteKnowledge}
        title="Delete Knowledge Item"
        description={`Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`}
      />

      <KnowledgeDetailModal
        isOpen={detailModal.show}
        onClose={() => setDetailModal({ show: false, itemId: null })}
        itemId={detailModal.itemId}
      />
    </div>
  );
}
