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
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event:", payload);

          queryClient.setQueryData(["orders"], (old: any[] = []) => {
            if (payload.eventType === "INSERT") {
              // add new order to the list (only if it's pending)
              if (payload.new.status === "pending") {
                return [payload.new, ...old];
              }
              return old;
            }
            if (payload.eventType === "UPDATE") {
              // if order is no longer pending, remove it from current orders
              if (payload.new.status !== "pending") {
                return old.filter((order) => order.id !== payload.new.id);
              }
              
              // Check if customer just arrived (customer_arrived changed from false to true)
              const oldOrder = old.find(order => order.id === payload.new.id);
              if (oldOrder && !oldOrder.customer_arrived && payload.new.customer_arrived) {
                // Play notification sound
                playArrivalNotification();
              }
              
              // if order is still pending, update it
              return old.map((order) =>
                order.id === payload.new.id ? payload.new : order
              );
            }
            if (payload.eventType === "DELETE") {
              // remove cancelled/deleted order
              return old.filter((order) => order.id !== payload.old.id);
            }
            return old;
          });
        }
      )
      .subscribe();

    // 3️⃣ Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { data, isLoading, error };
};
