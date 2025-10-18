import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// Fetches all pending orders for the admin dashboard
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"], // cache key for React Query
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")                 // your Supabase table name
        .select("*")                    // all columns (you can limit this later)
        .eq("status", "pending")        // only pending orders
        .order("created_at", { ascending: false }); // newest first

      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true, // when the user returns to the tab
    refetchInterval: 10000,     // optional: refresh every 10 seconds
  });
};
