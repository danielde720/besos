// we need to subscrivbe to inert and update orders in real time

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// This hook fetches and listens for changes in 'orders'
export const useRealTimeOrders = () => {
  const queryClient = useQueryClient();

  // 1️⃣ Base data fetching (React Query)
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
  });

  // 2️⃣ Realtime subscription
  useEffect(() => {
    console.log("Setting up real-time subscription for orders...");
    
    // Use a unique channel name to avoid conflicts
    const channelName = `orders-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "orders"
        },
        (payload) => {
          console.log("Realtime event:", payload);

          // Invalidate and refetch the orders query to ensure we get the latest data
          queryClient.invalidateQueries({ queryKey: ["orders"] });

          // Also update the cache directly for immediate UI updates
          queryClient.setQueryData(["orders"], (old: any[] = []) => {
            console.log("Processing real-time update:", payload.eventType, (payload.new as any)?.status);
            
            if (payload.eventType === "INSERT") {
              // add new order to the list (only if it's pending)
              if ((payload.new as any)?.status === "pending") {
                console.log("Adding new pending order:", (payload.new as any)?.id);
                return [payload.new, ...old];
              }
              return old;
            }
            if (payload.eventType === "UPDATE") {
              console.log("Order status changed:", (payload.new as any)?.status);
              
              // if order is no longer pending, remove it from current orders
              if ((payload.new as any)?.status !== "pending") {
                console.log("Removing non-pending order:", (payload.new as any)?.id);
                return old.filter((order) => order.id !== (payload.new as any)?.id);
              }
              
              // if order is still pending, update it
              console.log("Updating pending order:", (payload.new as any)?.id);
              return old.map((order) =>
                order.id === (payload.new as any)?.id ? payload.new : order
              );
            }
            if (payload.eventType === "DELETE") {
              console.log("Deleting order:", (payload.old as any)?.id);
              // remove cancelled/deleted order
              return old.filter((order) => order.id !== (payload.old as any)?.id);
            }
            return old;
          });
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Successfully subscribed to orders real-time updates");
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error("❌ Error subscribing to orders real-time updates:", status);
        }
      });

    // 3️⃣ Cleanup on unmount
    return () => {
      console.log("Cleaning up real-time subscription...");
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - queryClient is stable from React Query

  return { data, isLoading, error };
};
