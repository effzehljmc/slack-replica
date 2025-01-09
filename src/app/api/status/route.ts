import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { NEXT_PUBLIC_CONVEX_URL } from '@/config';

export async function GET() {
  console.log("GET: Status API route hit");
  return NextResponse.json({ message: "Status API is working" });
}

export async function POST(req: Request) {
  console.log("POST: Status API route hit");
  try {
    const body = await req.json();
    console.log("Received beacon request");
    console.log("Beacon data:", body);

    // Basic input validation
    if (!body.userId || !body.status) {
      return NextResponse.json({ error: "Missing userId or status" }, { status: 400 });
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(NEXT_PUBLIC_CONVEX_URL);

    // Update user status in Convex
    await convex.mutation(api.users.updateStatus, {
      userId: body.userId,
      status: body.status
    });
    
    console.log("Successfully updated status in Convex");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing beacon:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 