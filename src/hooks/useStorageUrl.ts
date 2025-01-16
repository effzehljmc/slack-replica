import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useStorageUrl() {
  const convex = useConvex();

  const getUrl = async (storageId: string) => {
    return await convex.query(api.files.getStorageUrl, { storageId });
  };

  return { getUrl };
} 