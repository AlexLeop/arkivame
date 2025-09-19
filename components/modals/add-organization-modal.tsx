
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AddOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationAdded: (organization: any) => void;
}

export function AddOrganizationModal({ open, onOpenChange, onOrganizationAdded }: AddOrganizationModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    plan: 'STARTER'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name and slug are required.",
        variant: "destructive"
      });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast({
        title: "Invalid Slug",
        description: "Slug must contain only lowercase letters, numbers, and hyphens.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/super-admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newOrganization = await response.json();
        
        toast({
          title: "Organization Created",
          description: `${formData.name} has been successfully created.`,
          variant: "success"
        });

        onOrganizationAdded(newOrganization);
        resetForm();
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create organization');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      domain: '',
      plan: 'STARTER'
    });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name,
      // Auto-generate slug from name if slug is empty
      slug: prev.slug === '' ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : prev.slug
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Create Organization
            </DialogTitle>
            <DialogDescription>
              Add a new organization to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="acme-corp"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used for the subdomain: {formData.slug || 'slug'}.arkivame.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain (Optional)</Label>
              <Input
                id="domain"
                placeholder="knowledge.acme.com"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use subdomain only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free (Limited features)</SelectItem>
                  <SelectItem value="STARTER">Starter ($29/month)</SelectItem>
                  <SelectItem value="BUSINESS">Business ($99/month)</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
