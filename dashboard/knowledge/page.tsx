import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface KnowledgeItem {
  id: string;
  title: string;
  summary: string | null;
  createdAt: Date;
  similarity?: number; // Optional for search results
}

export default function KnowledgeListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeItem[] | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user || !session.user.organizations || session.user.organizations.length === 0) {
      router.push("/login");
      return;
    }

    const fetchKnowledgeItems = async () => {
      try {
        setLoading(true);
        // This API endpoint needs to be created to fetch all knowledge items for an organization
        // For now, I'll assume it exists at /api/knowledge
        const organizationId = session.user!.organizations![0].id; // Assuming the first organization
        const response = await fetch(`/api/knowledge?organizationId=${organizationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch knowledge items");
        }
        const data = await response.json();
        setKnowledgeItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch all knowledge items if not currently searching
    if (searchResults === null) {
      fetchKnowledgeItems();
    }
  }, [session, status, router, searchResults]); // Added searchResults to dependencies

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null); // Clear search results if query is empty
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/search/knowledge?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to perform search");
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!session || !session.user || !session.user.organizations || session.user.organizations.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>
        <p>You need to be logged in and belong to an organization to view the knowledge base.</p>
        <Link href="/login" className="text-indigo-600 hover:underline">Login</Link>
      </div>
    );
  }

  const itemsToDisplay = searchResults !== null ? searchResults : knowledgeItems;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Search
        </button>
        {searchResults !== null && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSearchResults(null);
            }}
            className="rounded-md bg-gray-300 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-800 shadow-sm hover:bg-gray-400"
          >
            Clear Search
          </button>
        )}
      </form>

      {itemsToDisplay.length === 0 ? (
        <p>{searchResults !== null ? "No search results found." : "No knowledge items found for your organization. Start capturing some knowledge!"}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsToDisplay.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/dashboard/knowledge/${item.id}`} className="text-indigo-600 hover:underline">
                  {item.title}
                </Link>
              </h2>
              <p className="text-gray-600 text-sm mb-2">{item.summary || "No summary available."}</p>
              {item.similarity !== undefined && (
                <p className="text-gray-500 text-xs">Similarity: {(item.similarity * 100).toFixed(2)}%</p>
              )}
              <p className="text-gray-500 text-xs">Created: {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
