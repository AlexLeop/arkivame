
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Reply, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  knowledgeId: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  parentId: string | null;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface CommentsSectionProps {
  knowledgeId: string;
}

export function CommentsSection({ knowledgeId }: CommentsSectionProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/knowledge/${knowledgeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [knowledgeId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (content: string, parentId: string | null = null) => {
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/knowledge/${knowledgeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        
        if (parentId) {
          // Add reply to existing comment
          setComments(prev => 
            prev.map(comment => 
              comment.id === parentId 
                ? { ...comment, replies: [...comment.replies, newCommentData] }
                : comment
            )
          );
          setReplyingTo(null);
          setReplyContent('');
        } else {
          // Add new top-level comment
          setComments(prev => [newCommentData, ...prev]);
          setNewComment('');
        }

        toast({
          title: "Comment posted",
          description: "Your comment has been added successfully.",
        });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar || ''} alt={comment.author.name} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {comment.author.id === session?.user?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="text-sm leading-relaxed mb-3">{comment.content}</p>
          
          {!isReply && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="mr-1 h-3 w-3" />
              Reply
            </Button>
          )}
          
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSubmitComment(replyContent, comment.id)}
                  disabled={submitting || !replyContent.trim()}
                >
                  <Send className="mr-1 h-3 w-3" />
                  Reply
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentComponent key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Comments</h3>
            <Badge variant="secondary" className="ml-2">
              {comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new comment */}
        {session?.user && (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={() => handleSubmitComment(newComment)}
                disabled={submitting || !newComment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Post Comment
              </Button>
            </div>
          </div>
        )}

        {session?.user && comments.length > 0 && <Separator />}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentComponent key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
