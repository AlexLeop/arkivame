import { ProactiveBotSettings } from '@/components/settings/proactive-bot-settings';
import { MembersSettings } from '@/components/settings/members-settings';
import { AuditLogSettings } from '@/components/settings/audit-log-settings';
import { BillingSettings } from '@/components/settings/billing-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsPageProps {
  params: {
    organizationId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { organizationId } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings, integrations, and billing.
        </p>
      </div>
      
      <Tabs defaultValue="proactive-bot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="proactive-bot">Knowledge Guardian</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="p-2">
          <p className="text-muted-foreground">Manage your organization&apos;s profile details.</p>
        </TabsContent>
        <TabsContent value="proactive-bot">
          <ProactiveBotSettings organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="billing" className="p-2">
          <BillingSettings organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="members" className="p-2">
          <MembersSettings organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="audit-log">
          <AuditLogSettings organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}