import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useHistoricalOrders() {
  const queryClient = useQueryClient();

  // Use React Query for better state management
  const { data, isLoading, error } = useQuery({
    queryKey: ["historical-orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return orders || [];
    },
  });

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("historical-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Historical orders realtime event:", payload);

          queryClient.setQueryData(["historical-orders"], (old: any[] = []) => {
            if (payload.eventType === "INSERT") {
              // add new order to historical if it's completed/cancelled
              if (payload.new.status === "completed" || payload.new.status === "cancelled") {
                return [payload.new, ...old];
              }
              return old;
            }
            if (payload.eventType === "UPDATE") {
              // if order becomes completed/cancelled, add it to historical
              if (payload.new.status === "completed" || payload.new.status === "cancelled") {
                // Check if it's already in the list
                const exists = old.some(order => order.id === payload.new.id);
                if (!exists) {
                  return [payload.new, ...old];
                } else {
                  // Update existing historical order
                  return old.map((order) =>
                    order.id === payload.new.id ? payload.new : order
                  );
                }
              }
              return old;
            }
            if (payload.eventType === "DELETE") {
              // remove deleted order
              return old.filter((order) => order.id !== payload.old.id);
            }
            return old;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { data, isLoading, error };
}
