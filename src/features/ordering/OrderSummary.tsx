// OrderSummary.tsx
import type { OrderItem } from "./types.ts";

export default function OrderSummary({ items }: { items: OrderItem[] }) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="border p-4 rounded shadow space-y-3">
      <h2 className="font-bold text-lg">Order Summary</h2>
      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="border-b pb-2">
                <strong>{i.coffee_type}</strong> ({i.size}) — ${i.price.toFixed(2)} × {i.quantity}
                {i.extras.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Extras: {i.extras.join(", ")}
                  </p>
                )}
                {i.notes && (
                  <p className="text-sm text-gray-500 italic">"{i.notes}"</p>
                )}
              </li>
            ))}
          </ul>

          <p className="font-semibold mt-2">
            Total: ${total.toFixed(2)}
          </p>
        </>
      )}
    </div>
  );
}
