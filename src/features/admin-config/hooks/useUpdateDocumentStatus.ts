import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ADMIN_BASE_URL } from "@/config/env";

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const res = await fetch(`${ADMIN_BASE_URL}/admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }), 
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },

    // 1. When mutate is called:
    onMutate: async (newStatusObj) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["document-types"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["document-types"]);

      // Optimistically update the cache
      queryClient.setQueryData(["document-types"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          documentTypes: old.documentTypes.map((doc: any) =>
            doc.id === newStatusObj.id ? { ...doc, status: newStatusObj.status } : doc
          ),
        };
      });

      // Return context with the snapshot
      return { previousData };
    },

    // 2. If the mutation fails, use the context we returned above to roll back
    onError: (err, newStatusObj, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["document-types"], context.previousData);
      }
    },

    // 3. Always refetch after error or success to ensure we are in sync with the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}