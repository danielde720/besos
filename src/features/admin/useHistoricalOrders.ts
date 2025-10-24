import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useHistoricalOrders() {
  const queryClient = useQueryClient();

  // Use React Query for better state management
  const { data, isLoading, error } = useQuery({
    queryKey: ["historical-orders"],
    queryFn: async () => {
      // Calculate date 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['completed', 'cancelled'])
        .gte('created_at', twoDaysAgo.toISOString()) // Only orders from last 2 days
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
            // Calculate date 2 days ago for filtering
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            
            if (payload.eventType === "INSERT") {
              // add new order to historical if it's completed/cancelled and within last 2 days
              if (payload.new.status === "completed" || payload.new.status === "cancelled") {
                const orderDate = new Date(payload.new.created_at);
                if (orderDate >= twoDaysAgo) {
                  return [payload.new, ...old];
                }
              }
              return old;
            }
            if (payload.eventType === "UPDATE") {
              // if order becomes completed/cancelled, add it to historical if within last 2 days
              if (payload.new.status === "completed" || payload.new.status === "cancelled") {
                const orderDate = new Date(payload.new.created_at);
                if (orderDate >= twoDaysAgo) {
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
                } else {
                  // Remove order if it's older than 2 days
                  return old.filter((order) => order.id !== payload.new.id);
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
