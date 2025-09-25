import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

interface KnowledgeDetailPageProps {
  params: { id: string };
}

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.organizations || session.user.organizations.length === 0) {
    // Redirect to login or show unauthorized message
    // For now, we'll just show a message
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You need to be logged in and belong to an organization to view this knowledge item.</p>
      </div>
    );
  }

  const organizationId = session.user.organizations[0].id; // Assuming the first organization for now

  const knowledgeItem = await prisma.knowledgeItem.findUnique({
    where: {
      id: params.id,
      organizationId: organizationId, // Ensure the item belongs to the user's organization
    },
    select: {
      title: true,
      summary: true,
      content: true, // Assuming content is JSON and can be displayed
      actionItems: true,
      createdAt: true,
      sourceType: true,
      channelName: true,
      rootMessageAuthor: true,
    },
  });

  if (!knowledgeItem) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{knowledgeItem.title}</h1>
      <p className="text-gray-600 text-sm mb-2">Source: {knowledgeItem.sourceType} {knowledgeItem.channelName ? `(${knowledgeItem.channelName})` : ''}</p>
      {knowledgeItem.rootMessageAuthor && (
        <p className="text-gray-600 text-sm mb-2">Author: {knowledgeItem.rootMessageAuthor}</p>
      )}
      <p className="text-gray-500 text-xs mb-4">Created: {new Date(knowledgeItem.createdAt).toLocaleDateString()}</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>{knowledgeItem.summary || "No summary available."}</p>
      </div>

      {knowledgeItem.actionItems && Array.isArray(knowledgeItem.actionItems) && knowledgeItem.actionItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Action Items</h2>
          <ul className="list-disc pl-5">
            {knowledgeItem.actionItems.map((item: any, index: number) => (
              <li key={index}>{item.description || item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Original Content</h2>
        {knowledgeItem.content && Array.isArray(knowledgeItem.content) ? (
          <div className="border p-4 rounded-md bg-gray-50 max-h-96 overflow-y-auto">
            {knowledgeItem.content.map((message: any, index: number) => (
              <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
                <p className="font-medium">{message.author || 'Unknown'}:</p>
                <p className="text-gray-800">{message.text}</p>
                {message.timestamp && <p className="text-gray-500 text-xs">{new Date(message.timestamp * 1000).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p>No detailed content available.</p>
        )}
      </div>
    </div>
  );
}
