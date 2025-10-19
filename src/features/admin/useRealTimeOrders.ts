// we need to subscrivbe to inert and update orders in real time

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import besoSound from "../../assets/beso.mp3";

// This hook fetches and listens for changes in 'orders'
export const useRealTimeOrders = () => {
  const queryClient = useQueryClient();

  // Audio notification function
  const playArrivalNotification = () => {
    try {
      // Simple custom sound notification
      const audio = new Audio(besoSound); // Your custom sound file
      audio.volume = 0.7; // Adjust volume (0.0 to 1.0)
      audio.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
      
      // Also show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification('Customer Arrived!', {
          body: 'A customer has arrived for pickup',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

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
    
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event:", payload);

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
              
              // Check if customer just arrived (customer_arrived changed from false to true)
              const oldOrder = old.find(order => order.id === (payload.new as any)?.id);
              if (oldOrder && !oldOrder.customer_arrived && (payload.new as any)?.customer_arrived) {
                console.log("Customer arrived notification for order:", (payload.new as any)?.id);
                // Play notification sound
                playArrivalNotification();
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
      });

    // 3️⃣ Cleanup on unmount
    return () => {
      console.log("Cleaning up real-time subscription...");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { data, isLoading, error };
};
