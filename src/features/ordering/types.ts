// Represents one item in the order
export interface OrderItem {
    id: number;      
    coffee_type: string;
    size: string;
    milk: string;
    extras: string[];
    price: number;
    quantity: number;
    notes?: string;       
  }
  
  // Represents the full order (summary) - matches database schema
  export interface OrderSummary {
    id?: number;          // order ID from Supabase (optional at creation, auto-generated)
    name: string;         // customer name (matches DB column)
    user_phone_number?: string; // customer phone (matches DB column)
    items: OrderItem[];
    total: number;
    status: "pending" | "completed" | "cancelled";
    pickup_time?: string | null; // pickup time as ISO string (matches DB column)
    created_at?: string;  // Supabase adds this automatically
  }
  