// OrderPage.tsx
import { useState } from "react";
import OrderLine from "./OrderLine";
import OrderSummary from "./OrderSummary.tsx";
import type { OrderItem } from "./types.ts";

export default function OrderPage() {
  const [items, setItems] = useState<OrderItem[]>([]);

  // Function to add new items from OrderLine
  const addItem = (item: OrderItem) => {
    setItems((prev) => [...prev, item]);
  };

  return (
    <div className="grid grid-cols-2 gap-6 p-4">
      {/* Form to add new item */}
      <OrderLine onAddItem={addItem} />
      {/* List of all added items */}
      <OrderSummary items={items} />
    </div>
  );
}
