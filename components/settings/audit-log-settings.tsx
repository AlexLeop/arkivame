'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AuditLogAction =
  | 'MEMBER_INVITED'
  | 'INVITE_RESENT'
  | 'INVITE_REVOKED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'ORG_SETTINGS_UPDATED';

const AUDIT_LOG_ACTIONS: AuditLogAction[] = [
  'MEMBER_INVITED',
  'INVITE_RESENT',
  'INVITE_REVOKED',
  'MEMBER_REMOVED',
  'MEMBER_ROLE_CHANGED',
  'ORG_SETTINGS_UPDATED',
];

interface AuditLog {
  id: string;
  action: AuditLogAction;
  message: string;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface Member {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface AuditLogSettingsProps {
  organizationId: string;
}

export function AuditLogSettings({ organizationId }: AuditLogSettingsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState({ actorId: '', action: '', search: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = useCallback(async (cursor?: string) => {
    if (cursor) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.set('cursor', cursor);
      if (filters.actorId) params.set('actorId', filters.actorId);
      if (filters.action) params.set('action', filters.action);
      if (filters.search) params.set('search', filters.search);

      const url = `/api/org/${organizationId}/audit-logs?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      
      setLogs(prev => cursor ? [...prev, ...data.logs] : data.logs);
      setNextCursor(data.nextCursor || null);
    } catch (error) {
      console.error(error);
      toast.error('Could not load audit logs.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [organizationId, filters]);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch(`/api/org/${organizationId}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchMembers();
  }, [organizationId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (filterType: 'actorId' | 'action', value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value === 'all' ? '' : value }));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Review important events that have occurred in your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[240px] pl-10"
            />
          </div>
          <Select onValueChange={(value) => handleFilterChange('actorId', value)} value={filters.actorId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by actor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actors</SelectItem>
              {members.map(member => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.user.name || member.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange('action', value)} value={filters.action}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {AUDIT_LOG_ACTIONS.map(action => (
                <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No logs found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={log.actor.image || undefined} /><AvatarFallback>{log.actor.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback></Avatar><span className="font-medium">{log.actor.name || log.actor.email}</span></div></TableCell>
                    <TableCell><div className="flex flex-col"><span className="font-medium">{log.message}</span><Badge variant="outline" className="w-fit mt-1">{log.action}</Badge></div></TableCell>
                    <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {nextCursor && (<div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => fetchLogs(nextCursor)} disabled={isLoadingMore}>{isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load More</Button></div>)}
      </CardContent>
    </Card>
  );
}