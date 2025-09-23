'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Schema Zod para validação do formulário no frontend
const ProactiveSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  cooldownMinutes: z.coerce.number().min(1, "Cooldown must be at least 1 minute").default(15),
  threshold: z.coerce.number().min(0, "Threshold must be at least 0").max(1, "Threshold must be at most 1").default(0.7),
  enabledChannels: z.array(z.string()).default([]),
  responseTemplate: z.string().optional().default(''),
});

type ProactiveSettingsFormValues = z.infer<typeof ProactiveSettingsSchema>;

interface ProactiveBotSettingsProps {
  organizationId: string;
}

export function ProactiveBotSettings({ organizationId }: ProactiveBotSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProactiveSettingsFormValues>({
    resolver: zodResolver(ProactiveSettingsSchema),
    defaultValues: {
      enabled: false,
      cooldownMinutes: 15,
      threshold: 0.7,
      enabledChannels: [],
      responseTemplate: '',
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/org/${organizationId}/knowledge/proactive`);
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        const settings = data.proactiveBotSettings;
        
        // Limpa o valor 'default' para exibir o placeholder no formulário
        if (settings.responseTemplate === 'default') {
          settings.responseTemplate = '';
        }
        
        form.reset(settings);
      } catch (error) {
        console.error(error);
        // toast.error('Could not load proactive bot settings.');
      } finally {
        setIsLoading(false);
      }
    }
    if (organizationId) {
      fetchSettings();
    }
  }, [organizationId, form]);

  async function onSubmit(data: ProactiveSettingsFormValues) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/knowledge/proactive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proactive Bot Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Proactive Bot Settings</CardTitle>
        <CardDescription>
          Configure the &quot;Knowledge Guardian&quot; to proactively answer questions in your channels.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base">Enable Proactive Bot</Label>
              <p className="text-sm text-muted-foreground">
                Allow the bot to monitor channels and suggest answers.
              </p>
            </div>
            <Controller
              name="enabled"
              control={form.control}
              render={({ field }) => <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Confidence Threshold</Label>
            <Input id="threshold" type="number" step="0.05" min="0" max="1" {...form.register('threshold')} className="w-48" />
            <p className="text-sm text-muted-foreground">
              The minimum confidence score (0.0 to 1.0) for the bot to suggest an answer.
            </p>
            {form.formState.errors.threshold && <p className="text-sm text-destructive">{form.formState.errors.threshold.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldownMinutes">Cooldown Period (minutes)</Label>
            <Input id="cooldownMinutes" type="number" min="1" {...form.register('cooldownMinutes')} className="w-48" />
            <p className="text-sm text-muted-foreground">
              How long the bot should wait before responding again in the same channel.
            </p>
            {form.formState.errors.cooldownMinutes && <p className="text-sm text-destructive">{form.formState.errors.cooldownMinutes.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enabledChannels">Enabled Channels</Label>
            <Controller
              name="enabledChannels"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  id="enabledChannels"
                  placeholder="channel-general, channel-support, ..."
                  value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              A comma-separated list of channel IDs where the bot should be active. Leave empty to enable for all channels.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="responseTemplate">Response Template</Label>
            <Textarea id="responseTemplate" placeholder="👋 It looks like this was discussed before. Check it out: {{link}}" {...form.register('responseTemplate')} />
            <p className="text-sm text-muted-foreground">
              Customize the bot&apos;s response. Use {'{{title}}'} and {'{{link}}'} as placeholders.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}