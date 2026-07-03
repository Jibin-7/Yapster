import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let searchQuery = searchParams.get("q");
    const pageStr = searchParams.get("page") || "0";
    const page = parseInt(pageStr, 10);
    const pageSize = 15;

    await connectToDatabase();
    
    // If a new search query is provided, update the user's lastSearchQuery preference
    let queryToUse = "General News";
    if (searchQuery) {
      queryToUse = searchQuery;
      // Only update the database if we're on the first page of a new search
      if (page === 0) {
        await User.findByIdAndUpdate((session.user as any).id, { lastSearchQuery: searchQuery });
      }
    } else {
      // If no query is provided, use the user's lastSearchQuery
      const user = await User.findById((session.user as any).id).lean();
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      queryToUse = user.lastSearchQuery || "General News";
      searchQuery = queryToUse; // Treat this as the active query for the UI
    }

    // Use The Guardian API for true massive endless scrolling, any topic, and deep historical data.
    // Guardian pages are 1-indexed.
    const guardianPage = page + 1;
    
    // Wrap the query in double quotes to ensure exact phrase matching, preventing irrelevant broad results
    const exactQuery = `"${queryToUse}"`;
    const apiUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(exactQuery)}&api-key=test&order-by=newest&page=${guardianPage}&page-size=${pageSize}&show-fields=trailText`;
    
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      throw new Error("Failed to fetch from The Guardian API");
    }

    const data = await res.json();
    
    // Transform Guardian data to match our UI expectations
    const validArticles = (data.response.results || [])
      .map((hit: any) => {
        return {
          id: hit.id,
          title: hit.webTitle,
          description: hit.fields?.trailText || `Published in ${hit.sectionName}.`,
          url: hit.webUrl,
          urlToImage: null, // User requested NO images
          source: { name: "The Guardian" },
          publishedAt: hit.webPublicationDate,
          category: `Search: ${queryToUse}`
        };
      });

    // Fallback if no results found on first page
    if (validArticles.length === 0 && page === 0) {
      return NextResponse.json({ 
        articles: [{
          id: "1",
          title: "No recent news found for your search",
          description: `We couldn't find any breaking news articles for "${queryToUse}". Try a broader search term.`,
          url: "#",
          urlToImage: null,
          source: { name: "System" },
          publishedAt: new Date().toISOString(),
          category: `Search: ${queryToUse}`
        }], 
        searchQuery: queryToUse,
        hasMore: false
      });
    }

    return NextResponse.json({ 
      articles: validArticles, 
      searchQuery: queryToUse,
      hasMore: guardianPage < data.response.pages // True if there are more pages
    });
    
  } catch (error) {
    console.error("Fetch news error:", error);
    // Silent fallback to prevent complete crash
    return NextResponse.json({ message: "An error occurred", articles: [], hasMore: false }, { status: 500 });
  }
}
