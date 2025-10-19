import React, { useState, useEffect } from 'react'
import { useRealTimeOrders } from './useRealTimeOrders'
import { useHistoricalOrders } from './useHistoricalOrders'
import { supabase } from '../../lib/supabaseClient'
import { CheckIcon, XMarkIcon, ClockIcon, PencilIcon, ChevronDownIcon, PlusIcon, ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/24/outline'
import { 
  MENU_CATEGORIES, 
  SIZE_OPTIONS, 
  MILK_OPTIONS, 
  EXTRA_OPTIONS, 
  SIZE_PRICES, 
  EXTRA_PRICES 
} from '../ordering/Form'
import { useQueryClient } from '@tanstack/react-query'

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('AdminPage Error:', error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Edit Order Form Component
function EditOrderForm({ order, onSave, onCancel, isUpdating }: {
  order: any;
  onSave: (updatedOrder: any) => void;
  onCancel: () => void;
  isUpdating: boolean;
}) {
  // Create a proper state for the edited order to ensure React detects changes
  const [editedOrder, setEditedOrder] = useState(order);
  const [newItem, setNewItem] = useState({
    coffee_type: '',
    size: '',
    milk: '',
    extras: [] as string[],
    price: 0,
    quantity: 1,
    notes: ''
  });
  const [newItemErrors, setNewItemErrors] = useState({
    coffee_type: '',
    size: '',
    milk: ''
  });

  // Combine all coffee options from all categories into one unified list
  const getAllCoffeeOptions = () => {
    const allCoffees: string[] = [];
    Object.values(MENU_CATEGORIES).forEach(category => {
      allCoffees.push(...category.coffees);
    });
    return allCoffees;
  };

  // Calculate price for an item
  const calculateItemPrice = (item: any) => {
    let price = SIZE_PRICES[item.size as keyof typeof SIZE_PRICES] || 0;
    
    // Add extra shot pricing
    const extraShots = item.extras?.filter((extra: string) => extra.startsWith('Extra Shot')).length || 0;
    price += extraShots * EXTRA_PRICES['Extra Shot'];
    
    // Add other extras
    item.extras?.forEach((extra: string) => {
      if (extra === 'Extra Drizzle') {
        price += EXTRA_PRICES['Extra Drizzle'];
      }
      if (extra === 'Extra Cold Foam') {
        price += EXTRA_PRICES['Extra Cold Foam'];
      }
    });
    
    return price;
  };

  // Update total when items change
  const updateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => {
      const itemPrice = calculateItemPrice(item);
      return sum + (itemPrice * (item.quantity || 1));
    }, 0);
    // Update the edited order's total
    setEditedOrder((prev: any) => ({ ...prev, total }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate final total before saving
    updateTotal(editedOrder.items);
    onSave(editedOrder);
  };

  const validateNewItem = () => {
    const errors = {
      coffee_type: '',
      size: '',
      milk: ''
    };
    
    if (!newItem.coffee_type.trim()) {
      errors.coffee_type = 'Coffee type is required';
    }
    if (!newItem.size.trim()) {
      errors.size = 'Size is required';
    }
    if (!newItem.milk.trim()) {
      errors.milk = 'Milk type is required';
    }
    
    setNewItemErrors(errors);
    return !errors.coffee_type && !errors.size && !errors.milk;
  };

  const addNewItem = () => {
    if (validateNewItem()) {
      const itemWithId = {
        ...newItem,
        id: Date.now(),
        price: calculateItemPrice(newItem)
      };
      // Add to edited order items
      const updatedItems = [...editedOrder.items, itemWithId];
      setEditedOrder((prev: any) => ({ ...prev, items: updatedItems }));
      updateTotal(updatedItems);
      
      // Reset new item form
      setNewItem({
        coffee_type: '',
        size: '',
        milk: '',
        extras: [],
        price: 0,
        quantity: 1,
        notes: ''
      });
      setNewItemErrors({
        coffee_type: '',
        size: '',
        milk: ''
      });
    }
  };

  const removeItem = (index: number) => {
    // Remove from edited order items
    const updatedItems = editedOrder.items.filter((_: any, i: number) => i !== index);
    setEditedOrder((prev: any) => ({ ...prev, items: updatedItems }));
    updateTotal(updatedItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    // Create a new items array to trigger React re-render
    const updatedItems = [...editedOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate price if size or extras changed
    if (field === 'size' || field === 'extras') {
      updatedItems[index].price = calculateItemPrice(updatedItems[index]);
    }
    
    // Update the edited order items array
    setEditedOrder((prev: any) => ({ ...prev, items: updatedItems }));
    updateTotal(updatedItems);
  };

  const toggleExtra = (itemIndex: number, extra: string) => {
    const currentExtras = editedOrder.items[itemIndex].extras || [];
    
    if (currentExtras.includes(extra)) {
      const updatedItems = [...editedOrder.items];
      updatedItems[itemIndex].extras = currentExtras.filter((e: string) => e !== extra);
      setEditedOrder((prev: any) => ({ ...prev, items: updatedItems }));
      updateItem(itemIndex, 'extras', updatedItems[itemIndex].extras);
    } else {
      const updatedItems = [...editedOrder.items];
      updatedItems[itemIndex].extras = [...currentExtras, extra];
      setEditedOrder((prev: any) => ({ ...prev, items: updatedItems }));
      updateItem(itemIndex, 'extras', updatedItems[itemIndex].extras);
    }
  };

  const addExtraToNewItem = (extra: string) => {
    const currentExtras = newItem.extras || [];
    if (!currentExtras.includes(extra)) {
      setNewItem(prev => ({ ...prev, extras: [...currentExtras, extra] }));
    }
  };

  const removeExtraFromNewItem = (extraToRemove: string) => {
    setNewItem(prev => ({ 
      ...prev, 
      extras: (prev.extras || []).filter((extra: string) => extra !== extraToRemove) 
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={editedOrder.name}
              onChange={(e) => setEditedOrder((prev: any) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={editedOrder.user_phone_number}
              onChange={(e) => setEditedOrder((prev: any) => ({ ...prev, user_phone_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
          <input
            type="datetime-local"
            value={editedOrder.pickup_time ? new Date(editedOrder.pickup_time).toISOString().slice(0, 16) : ''}
            onChange={(e) => setEditedOrder((prev: any) => ({ ...prev, pickup_time: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>


      {/* Order Items */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
        
        {/* Existing Items */}
        <div className="space-y-4 mb-6">
          {editedOrder.items.map((item: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              
              {/* Coffee Type Dropdown */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Coffee Type</label>
                <div className="relative">
                  <select
                    value={item.coffee_type || ''}
                    onChange={(e) => updateItem(index, 'coffee_type', e.target.value)}
                    className="w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a coffee</option>
                    {getAllCoffeeOptions().map(coffee => (
                      <option key={coffee} value={coffee}>{coffee}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>

              {/* Size and Milk Dropdowns */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <div className="relative">
                    <select
                      value={item.size || ''}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      className="w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milk</label>
                  <div className="relative">
                    <select
                      value={item.milk || ''}
                      onChange={(e) => updateItem(index, 'milk', e.target.value)}
                      className="w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select milk</option>
                      {MILK_OPTIONS.map(milk => (
                        <option key={milk} value={milk}>{milk}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Auto-calculated)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Extras */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Extras</label>
                <div className="space-y-2">
                  {/* Extra Shot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(item.extras || []).some((extra: string) => extra.startsWith('Extra Shot'))}
                        onChange={() => {
                          const currentExtras = item.extras || [];
                          const hasExtraShot = currentExtras.some((extra: string) => extra.startsWith('Extra Shot'));
                          if (hasExtraShot) {
                            const newExtras = currentExtras.filter((extra: string) => !extra.startsWith('Extra Shot'));
                            updateItem(index, 'extras', newExtras);
                          } else {
                            updateItem(index, 'extras', [...currentExtras, 'Extra Shot']);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        Extra Shot (+$1)
                      </span>
                    </label>
                  </div>
                  
                  {/* Extra Drizzle */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(item.extras || []).includes('Extra Drizzle')}
                        onChange={() => toggleExtra(index, 'Extra Drizzle')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        Extra Drizzle (+$0.50)
                      </span>
                    </label>
                  </div>
                  
                  {/* Extra Cold Foam */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(item.extras || []).includes('Extra Cold Foam')}
                        onChange={() => toggleExtra(index, 'Extra Cold Foam')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        Extra Cold Foam (+$0.50)
                      </span>
                    </label>
                  </div>
                  
                  {/* Other Extras */}
                  {EXTRA_OPTIONS.map(extra => (
                    <label key={extra} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(item.extras || []).includes(extra)}
                        onChange={() => toggleExtra(index, extra)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{extra}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={item.notes || ''}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special instructions"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
          <h4 className="font-medium text-gray-900 mb-3">Add New Item</h4>
          
          {/* Coffee Type Dropdown */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Coffee Type</label>
            <div className="relative">
              <select
                value={newItem.coffee_type}
                onChange={(e) => {
                  setNewItem({...newItem, coffee_type: e.target.value});
                  if (newItemErrors.coffee_type) {
                    setNewItemErrors({...newItemErrors, coffee_type: ''});
                  }
                }}
                className={`w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border focus:outline-none focus:ring-2 ${
                  newItemErrors.coffee_type 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a coffee</option>
                {getAllCoffeeOptions().map(coffee => (
                  <option key={coffee} value={coffee}>{coffee}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            {newItemErrors.coffee_type && (
              <p className="text-red-500 text-xs mt-1">{newItemErrors.coffee_type}</p>
            )}
          </div>

          {/* Size and Milk Dropdowns */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <div className="relative">
                <select
                  value={newItem.size}
                  onChange={(e) => {
                    setNewItem({...newItem, size: e.target.value});
                    if (newItemErrors.size) {
                      setNewItemErrors({...newItemErrors, size: ''});
                    }
                  }}
                  className={`w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border focus:outline-none focus:ring-2 ${
                    newItemErrors.size 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select size</option>
                  {SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              {newItemErrors.size && (
                <p className="text-red-500 text-xs mt-1">{newItemErrors.size}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Milk</label>
              <div className="relative">
                <select
                  value={newItem.milk}
                  onChange={(e) => {
                    setNewItem({...newItem, milk: e.target.value});
                    if (newItemErrors.milk) {
                      setNewItemErrors({...newItemErrors, milk: ''});
                    }
                  }}
                  className={`w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 border focus:outline-none focus:ring-2 ${
                    newItemErrors.milk 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select milk</option>
                  {MILK_OPTIONS.map(milk => (
                    <option key={milk} value={milk}>{milk}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              {newItemErrors.milk && (
                <p className="text-red-500 text-xs mt-1">{newItemErrors.milk}</p>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Extras for New Item */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Extras</label>
            <div className="space-y-2">
              {/* Extra Shot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(newItem.extras || []).some((extra: string) => extra.startsWith('Extra Shot'))}
                    onChange={() => {
                      const currentExtras = newItem.extras || [];
                      const hasExtraShot = currentExtras.some((extra: string) => extra.startsWith('Extra Shot'));
                      if (hasExtraShot) {
                        removeExtraFromNewItem('Extra Shot');
                      } else {
                        addExtraToNewItem('Extra Shot');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Extra Shot (+$1)
                  </span>
                </label>
              </div>
              
              {/* Extra Drizzle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(newItem.extras || []).includes('Extra Drizzle')}
                    onChange={() => {
                      if ((newItem.extras || []).includes('Extra Drizzle')) {
                        removeExtraFromNewItem('Extra Drizzle');
                      } else {
                        addExtraToNewItem('Extra Drizzle');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Extra Drizzle (+$0.50)
                  </span>
                </label>
              </div>
              
              {/* Extra Cold Foam */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(newItem.extras || []).includes('Extra Cold Foam')}
                    onChange={() => {
                      if ((newItem.extras || []).includes('Extra Cold Foam')) {
                        removeExtraFromNewItem('Extra Cold Foam');
                      } else {
                        addExtraToNewItem('Extra Cold Foam');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Extra Cold Foam (+$0.50)
                  </span>
                </label>
              </div>
              
              {/* Other Extras */}
              {EXTRA_OPTIONS.map(extra => (
                <label key={extra} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(newItem.extras || []).includes(extra)}
                    onChange={() => {
                      if ((newItem.extras || []).includes(extra)) {
                        removeExtraFromNewItem(extra);
                      } else {
                        addExtraToNewItem(extra);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">{extra}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={newItem.notes}
              onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions"
            />
          </div>

          <button
            type="button"
            onClick={addNewItem}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="size-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          {editedOrder.items.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.coffee_type}</h4>
                <p className="text-sm text-gray-600">
                  {item.size} • {item.milk}
                  {item.extras?.length > 0 && ` • ${item.extras.join(', ')}`}
                  {item.notes && ` • ${item.notes}`}
                </p>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  Qty: {item.quantity}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-gray-900">${editedOrder.total.toFixed(2)}</span>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { data: orders, isLoading, error } = useRealTimeOrders();
  const { data: historicalOrders, isLoading: historicalLoading, error: historicalError } = useHistoricalOrders();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    orderId: number;
    action: 'completed' | 'cancelled';
    orderName: string;
  } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Pagination state for historical orders
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Check authentication on component mount
  useEffect(() => {
    console.log('AdminPage: Checking authentication...');
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('AdminPage: Auth session result:', { data, error });
      if (error) {
        console.error('Auth session error:', error);
        setAuthError(error.message);
        return;
      }
      if (!data.session) {
        console.log('AdminPage: No session, redirecting to login...');
        // Use more mobile-friendly redirect
        window.location.replace("/login");
      } else {
        console.log('AdminPage: Session found, setting session...');
        setSession(data.session);
      }
    }).catch((error) => {
      console.error('Auth session catch error:', error);
      setAuthError(error.message);
    });
  }, []);

  // Request notification permission on component mount (with mobile compatibility check)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.log('Notification permission denied or not supported:', error);
      });
    }
  }, []);

  // Show loading screen while checking authentication
  if (!session && !authError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error screen if authentication failed
  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.replace("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleActionClick = (orderId: number, action: 'completed' | 'cancelled', orderName: string) => {
    setPendingAction({ orderId, action, orderName });
    setCancellationReason(''); // Reset cancellation reason
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    
    // Validate cancellation reason if cancelling
    if (pendingAction.action === 'cancelled' && !cancellationReason.trim()) {
      alert('Please provide a reason for cancelling this order.');
      return;
    }
    
    setUpdatingOrder(pendingAction.orderId);
    setShowConfirmModal(false);
    
    try {
      const updateData: any = { status: pendingAction.action };
      
      // Add cancellation reason if cancelling
      if (pendingAction.action === 'cancelled') {
        updateData.cancellation_reason = cancellationReason.trim();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', pendingAction.orderId);

      if (error) throw error;

      // Invalidate both queries to ensure immediate UI updates
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["historical-orders"] });
      
      // Force a refetch as a fallback in case real-time doesn't work
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["orders"] });
        queryClient.refetchQueries({ queryKey: ["historical-orders"] });
      }, 100);
      
      // Clear local storage if this order matches the stored confirmation
      const storedOrder = localStorage.getItem('besos_order_confirmation')
      if (storedOrder) {
        try {
          const parsedOrder = JSON.parse(storedOrder)
          if (parsedOrder.id === pendingAction.orderId) {
            localStorage.removeItem('besos_order_confirmation')
            console.log('Cleared local storage for completed/cancelled order')
          }
        } catch (error) {
          console.error('Error checking stored order:', error)
        }
      }
      
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
      setPendingAction(null);
      setCancellationReason(''); // Reset cancellation reason
    }
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
    setCancellationReason(''); // Reset cancellation reason
  };

  const handleEditClick = (order: any) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleEditSave = async (updatedOrder: any) => {
    if (!editingOrder) return;
    
    setUpdatingOrder(editingOrder.id);
    setShowEditModal(false);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update(updatedOrder)
        .eq('id', editingOrder.id);

      if (error) throw error;
      
      // Invalidate both queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["historical-orders"] });
      
      // Force a refetch as a fallback in case real-time doesn't work
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["orders"] });
        queryClient.refetchQueries({ queryKey: ["historical-orders"] });
      }, 100);
      
      // Clear local storage if this order matches the stored confirmation and status changed
      const storedOrder = localStorage.getItem('besos_order_confirmation')
      if (storedOrder) {
        try {
          const parsedOrder = JSON.parse(storedOrder)
          if (parsedOrder.id === editingOrder.id && 
              (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled')) {
            localStorage.removeItem('besos_order_confirmation')
            console.log('Cleared local storage for edited order that was completed/cancelled')
          }
        } catch (error) {
          console.error('Error checking stored order:', error)
        }
      }
      
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setUpdatingOrder(null);
      setEditingOrder(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingOrder(null);
  };

  const formatPickupTime = (pickupTime: string) => {
    const date = new Date(pickupTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="w-5 h-5 text-green-600" />
      case 'cancelled':
        return <XMarkIcon className="w-5 h-5 text-red-600" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const isRunningLate = (pickupTime: string) => {
    const now = new Date();
    const pickup = new Date(pickupTime);
    return pickup < now;
  };

  const isCustomerArrived = (order: any) => {
    return order.customer_arrived === true;
  };

  // Pagination logic for historical orders
  const getPaginatedOrders = () => {
    if (!historicalOrders) return [];
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return historicalOrders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!historicalOrders) return 0;
    return Math.ceil(historicalOrders.length / ordersPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Pagination component
  const Pagination = () => {
    const totalPages = getTotalPages();
    
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const total = totalPages;
      const current = currentPage;
      
      if (total <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Show first page
        pages.push(1);
        
        if (current > 4) {
          pages.push('...');
        }
        
        // Show pages around current page
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
        
        if (current < total - 3) {
          pages.push('...');
        }
        
        // Show last page
        if (total > 1) {
          pages.push(total);
        }
      }
      
      return pages;
    };

    return (
      <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6">
        <div className="-mt-px flex w-0 flex-1">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <ArrowLongLeftIcon aria-hidden="true" className="mr-3 h-5 w-5 text-gray-400" />
            Previous
          </button>
        </div>
        
        <div className="hidden md:-mt-px md:flex">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'border-blue-500 text-blue-600'
                  : page === '...'
                  ? 'border-transparent text-gray-500 cursor-default'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <div className="-mt-px flex w-0 flex-1 justify-end">
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Next
            <ArrowLongRightIcon aria-hidden="true" className="ml-3 h-5 w-5 text-gray-400" />
          </button>
        </div>
      </nav>
    );
  };

  // ✅ Sorting by soonest pickup time with safety checks
  const sortedOrders = (orders ?? [])
    .filter(order => order && order.pickup_time) // Filter out invalid orders
    .sort((a, b) => new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Error loading orders: {error.message}
      </div>
    );
  }

  return (
    <div className={`${activeTab === 'history' ? 'w-full' : 'max-w-[1600px]'} mx-auto px-4 sm:px-6 py-4 sm:py-8`}>
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Besos Dashboard</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              {activeTab === 'current' ? 'Manage coffee orders in real-time' : 'View past completed and cancelled orders'}
            </p>
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('current');
                setCurrentPage(1); // Reset pagination when switching tabs
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'current'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Current Orders
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setCurrentPage(1); // Reset pagination when switching tabs
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Order History
            </button>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'current' ? (
        // Current Orders Tab
        <>
          {sortedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {sortedOrders.map((order) => (
            <div
              key={order.id}
                  className={`
                    flex flex-col justify-between 
                    rounded-2xl shadow-lg 
                    border transition-all 
                    duration-200 
                    p-4
                    h-full
                    w-full
                    ${isCustomerArrived(order) 
                      ? 'bg-green-100 border-green-400 hover:shadow-xl hover:bg-green-200' 
                      : 'bg-white border-gray-200 hover:shadow-xl'
                    }
                  `}
                >
                  {/* === Header === */}
                  <div className="flex justify-between items-start mb-3">
                <div>
                      <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                      <p className="text-gray-600 text-sm">{order.name}</p>
                  {order.user_phone_number && (
                        <p className="text-xs text-gray-500">📞 {order.user_phone_number}</p>
                  )}
                </div>
                    <div className="text-right space-y-1">
                      {isCustomerArrived(order) && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          🚗 Customer Here!
                  </span>
                      )}
                      {isRunningLate(order.pickup_time) && !isCustomerArrived(order) && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                          Running Late
                        </span>
                      )}
                </div>
              </div>

                  {/* === Order Items === */}
                  <div className="flex-1 mb-3">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm border-b border-gray-200 pb-1">
                      ☕ Items
                    </h4>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-2 text-sm">
                            <div className="flex justify-between">
                <div>
                                <p className="font-medium text-gray-900">{item?.coffee_type || 'Unknown Item'}</p>
                                <p className="text-gray-600 text-xs">
                                  {item?.size || 'N/A'} • {item?.milk || 'N/A'}
                                  {item?.extras?.length ? ` • +${item.extras.join(', ')}` : ''}
                                  {item?.notes ? ` • Notes: ${item.notes}` : ''}
                                </p>
                        </div>
                        <div className="text-right">
                                <p className="text-xs text-gray-500">x{item?.quantity || 1}</p>
                                <p className="text-green-600 font-semibold">
                                  ${((item?.price || 0) * (item?.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center">No items</p>
                      )}
                  </div>
                </div>

                  {/* === Footer: Total + Pickup + Buttons === */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                <div>
                        <div className="text-xs text-gray-600">Total</div>
                        <div className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</div>
                    </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Pickup</div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatPickupTime(order.pickup_time)}
                        </div>
                      </div>
                    </div>

                  {order.status === 'pending' && (
                      <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleEditClick(order)}
                        disabled={updatingOrder === order.id}
                        className="flex-1 min-w-0 flex items-center justify-center px-2 py-1.5 
                                   rounded-md bg-blue-600 text-white hover:bg-blue-700 
                                   disabled:opacity-50 font-medium text-xs transition-all"
                        >
                          <PencilIcon className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                        onClick={() => handleActionClick(order.id, 'completed', order.name)}
                          disabled={updatingOrder === order.id}
                        className="flex-1 min-w-0 flex items-center justify-center px-2 py-1.5 
                                   rounded-md bg-green-600 text-white hover:bg-green-700 
                                   disabled:opacity-50 font-medium text-xs transition-all"
                        >
                          <CheckIcon className="w-3 h-3 mr-1" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleActionClick(order.id, 'cancelled', order.name)}
                        disabled={updatingOrder === order.id}
                        className="flex-1 min-w-0 flex items-center justify-center px-2 py-1.5 
                                   rounded-md bg-red-600 text-white hover:bg-red-700 
                                   disabled:opacity-50 font-medium text-xs transition-all"
                      >
                          <XMarkIcon className="w-3 h-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              ))}
                        </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders ready for pickup at the moment.
                          </p>
                        </div>
          )}
        </>
      ) : (
        // Historical Orders Tab
        <>
          {historicalLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-600">
              Loading historical orders...
                      </div>
          ) : historicalError ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              Error loading historical orders: {historicalError.message}
                  </div>
          ) : historicalOrders && historicalOrders.length > 0 ? (
            <>
              <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pickup Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancellation Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedOrders().map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.name}</div>
                          {order.user_phone_number && (
                            <div className="text-sm text-gray-500">{order.user_phone_number}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item: any, index: number) => (
                                  <div key={index} className="text-xs">
                                    {item.coffee_type} ({item.size})
                                    {item.quantity > 1 && ` x${item.quantity}`}
                </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{order.items.length - 2} more items
                    </div>
                                )}
                      </div>
                            ) : (
                              <span className="text-gray-500">No items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.total?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.pickup_time ? formatPickupTime(order.pickup_time) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                      </span>
                    </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.created_at ? formatDate(order.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          {order.cancellation_reason ? (
                            <div className="truncate" title={order.cancellation_reason}>
                              {order.cancellation_reason}
                  </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
        </div>
              </div>
              <Pagination />
            </>
      ) : (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No historical orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                No completed or cancelled orders found.
          </p>
        </div>
          )}
        </>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                pendingAction.action === 'completed' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {pendingAction.action === 'completed' ? (
                  <CheckIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <XMarkIcon className="w-6 h-6 text-red-600" />
      )}
    </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingAction.action === 'completed' ? 'Complete Order' : 'Cancel Order'}
                </h3>
                <p className="text-sm text-gray-600">
                  Order #{pendingAction.orderId} - {pendingAction.orderName}
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to {pendingAction.action === 'completed' ? 'mark this order as completed' : 'cancel this order'}? 
              This action cannot be undone.
            </p>
            
            {/* Cancellation Reason Input */}
            {pendingAction.action === 'cancelled' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for cancelling this order..."
                  required
                />
                {!cancellationReason.trim() && (
                  <p className="text-red-500 text-xs mt-1">Cancellation reason is required</p>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmAction}
                disabled={updatingOrder === pendingAction.orderId}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  pendingAction.action === 'completed'
                    ? 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {updatingOrder === pendingAction.orderId ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-blue-100">
                <PencilIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Order</h3>
                <p className="text-sm text-gray-600">Order #{editingOrder.id} - {editingOrder.name}</p>
              </div>
            </div>
            
            <EditOrderForm 
              order={editingOrder} 
              onSave={handleEditSave} 
              onCancel={handleEditCancel}
              isUpdating={updatingOrder === editingOrder.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export with Error Boundary
export default function AdminPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminPage />
    </ErrorBoundary>
  );
}
