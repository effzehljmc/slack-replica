import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  { params }: { params: { storageId: string } }
) {
  const storageId = params.storageId;
  
  try {
    const url = await client.query(api.files.getStorageUrl, { storageId });
    if (!url) {
      return new Response("Not found", { status: 404 });
    }
    return Response.redirect(url);
  } catch (error) {
    console.error("Failed to get storage URL:", error);
    return new Response("Internal server error", { status: 500 });
  }
} 