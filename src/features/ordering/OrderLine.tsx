// OrderLine.tsx
import { useState } from "react";
import type { OrderItem } from "./types.ts";

export default function OrderLine({ onAddItem }: { onAddItem: (item: OrderItem) => void }) {
  const [coffee_type, setCoffeeType] = useState("");
  const [size, setSize] = useState("");
  const [milk, setMilk] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!coffee_type || !size) return;

    // Normally you'd calculate price dynamically (based on size, extras)
    const price = 5 + (extras.length * 0.5);

    const newItem: OrderItem = {
      id: Date.now(),
      coffee_type,
      size,
      milk,
      extras,
      price,
      quantity,
      notes,
    };

    onAddItem(newItem); // Send item to parent (OrderPage)

    // Reset form for next item
    setCoffeeType("");
    setSize("");
    setMilk("");
    setExtras([]);
    setQuantity(1);
    setNotes("");
  }

  function toggleExtra(extra: string) {
    setExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  }

  return (
    <div className="space-y-3 border p-4 rounded shadow">
      <h2 className="font-bold text-lg">Add a Coffee</h2>

      <select value={coffee_type} onChange={(e) => setCoffeeType(e.target.value)} className="border p-2 w-full">
        <option value="">Select coffee</option>
        <option value="Latte">Latte</option>
        <option value="Cappuccino">Cappuccino</option>
        <option value="Espresso">Espresso</option>
      </select>

      <select value={size} onChange={(e) => setSize(e.target.value)} className="border p-2 w-full">
        <option value="">Select size</option>
        <option value="Small">Small</option>
        <option value="Medium">Medium</option>
        <option value="Large">Large</option>
      </select>

      <input
        placeholder="Milk type"
        value={milk}
        onChange={(e) => setMilk(e.target.value)}
        className="border p-2 w-full"
      />

      <div>
        <p className="font-medium">Extras:</p>
        {["Whipped Cream", "Vanilla", "Caramel"].map((extra) => (
          <label key={extra} className="block">
            <input
              type="checkbox"
              checked={extras.includes(extra)}
              onChange={() => toggleExtra(extra)}
            />{" "}
            {extra}
          </label>
        ))}
      </div>

      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="border p-2 w-full"
      />

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={handleAdd}
        className="bg-green-600 text-white py-2 px-4 rounded w-full"
      >
        Add to Order
      </button>
    </div>
  );
}
