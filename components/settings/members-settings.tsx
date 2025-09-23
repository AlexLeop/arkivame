'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MoreHorizontal, Loader2, UserPlus, Check, Trash2, Send, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';

const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface Member {
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface MembersSettingsProps {
  organizationId: string;
}

export function MembersSettings({ organizationId }: MembersSettingsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [invitesPage, setInvitesPage] = useState(1);
  const [membersPagination, setMembersPagination] = useState<PaginationState | null>(null);
  const [invitesPagination, setInvitesPagination] = useState<PaginationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [inviteToRevoke, setInviteToRevoke] = useState<Invitation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { data: session } = useSession();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  });
  const currentUserId = session?.user?.id;

  const fetchMembers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/members?page=${page}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch members');
      const { data, pagination } = await response.json();
      setMembers(data);
      setMembersPagination(pagination);
    } catch (error) {
      console.error(error);
      setApiError('Could not load members. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const fetchInvites = useCallback(async (page: number) => {
    setIsLoadingInvites(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/invites?page=${page}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const { data, pagination } = await response.json();
      setInvitations(data);
      setInvitesPagination(pagination);
    } catch (error) {
      console.error(error);
      setApiError('Could not load invitations. Please refresh the page.');
    } finally {
      setIsLoadingInvites(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers(membersPage);
  }, [organizationId, membersPage, fetchMembers]);

  useEffect(() => {
    fetchInvites(invitesPage);
  }, [organizationId, invitesPage, fetchInvites]);

  async function handleInvite(data: InviteFormValues) {
    setApiError(null);
    setIsInviting(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      toast.success(`Invitation sent to ${data.email}`);
      form.reset({ email: '' });
      fetchInvites(invitesPage);
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove() {
    if (!memberToRemove) return;
    setApiError(null);
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/members/${memberToRemove.userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }
      // Refetch members to reflect the change
      fetchMembers(membersPage);
      toast.success('Member removed successfully.');
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  }

  async function handleRevoke() {
    if (!inviteToRevoke) return;
    setApiError(null);
    setIsRevoking(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/invites/${inviteToRevoke.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke invitation');
      }
      // Refetch invitations to reflect the change
      fetchInvites(invitesPage);
      toast.success('Invitation revoked successfully.');
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsRevoking(false);
      setInviteToRevoke(null);
    }
  }

  async function handleResend(invite: Invitation) {
    setApiError(null);
    setResendingInviteId(invite.id);
    try {
      const response = await fetch(`/api/org/${organizationId}/invites/${invite.id}/resend`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
      }
      toast.success(`Invitation resent to ${invite.email}`);
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || 'An unexpected error occurred.');
    } finally {
      setResendingInviteId(null);
    }
  }

  async function handleChangeRole(memberId: string, newRole: 'ADMIN' | 'MEMBER') {
    setApiError(null);
    const originalMembers = [...members];
    setMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role: newRole } : m));

    try {
      const response = await fetch(`/api/org/${organizationId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change role');
      }
      toast.success("Member's role updated.");
    } catch (error: any) {
      // Revert optimistic update on failure
      setMembers(originalMembers);
      console.error(error);
      setApiError(error.message || 'An unexpected error occurred.');
    }
  }

  return (
    <>
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Invite and manage your organization&apos;s members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {apiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        {/* Invite Section */}
        <form onSubmit={form.handleSubmit(handleInvite)} className="flex items-start gap-4">
          <div className="flex-grow space-y-2">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" {...form.register('email')} />
            {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <Button type="submit" disabled={isInviting}>
            {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Invite
          </Button>
        </form>

        {/* Members List */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Pending Invitations</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvites ? (
                  <TableRow>
                    <TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ) : invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No pending invitations.
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invite.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResend(invite)}
                            disabled={resendingInviteId === invite.id}
                            title="Resend invitation"
                          >
                            {resendingInviteId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setInviteToRevoke(invite)} title="Revoke invitation">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {invitesPagination && (
              <PaginationControls
                currentPage={invitesPagination.currentPage}
                totalPages={invitesPagination.totalPages}
                onPageChange={setInvitesPage}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Active Members</h3>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={member.user.image || undefined} alt={member.user.name || 'User'} />
                          <AvatarFallback>{member.user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground">{member.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'OWNER' || member.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'OWNER' && member.userId !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'ADMIN')}>
                                    Admin {member.role === 'ADMIN' && <Check className="ml-auto h-4 w-4" />}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'MEMBER')}>
                                    Member {member.role === 'MEMBER' && <Check className="ml-auto h-4 w-4" />}
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setMemberToRemove(member)}>
                              Remove member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {membersPagination && (
            <PaginationControls
              currentPage={membersPagination.currentPage}
              totalPages={membersPagination.totalPages}
              onPageChange={setMembersPage}
            />
          )}
        </div>
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <span className="font-bold">{memberToRemove?.user.name}</span> from the organization. They will lose all access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={isRemoving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!inviteToRevoke} onOpenChange={(open) => !open && setInviteToRevoke(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke the invitation for <span className="font-bold">{inviteToRevoke?.email}</span>. They will not be able to join the organization with this invite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRevoke} disabled={isRevoking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Revoke Invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}