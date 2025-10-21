import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/16/solid'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../../lib/supabaseClient'
import type { OrderItem, OrderSummary as OrderSummaryType } from './types.ts'
import OrderClosedMessage from './OrderClosedMessage'

// Export constants for reuse in admin
export const MENU_CATEGORIES = {
  'regular': {
    name: 'Regular Menu (Menú Regular)',
    coffees: [
      'Cafe de Olla Latte',
      'Cinnamon Crunch Latte',
      'Dulce de Leche Latte',
      'Chocomil Latte',
      'Mazapan Latte',
      'Nutella Latte',
      'Banana Bean Late',
      'Biscoff Cookie Latte',
      'Fresas Y Crema Latte'
    ]
  },
  'fall': {
    name: 'Fall Menu (Menú de Otoño)',
    coffees: [
      'Arroz Con Leche Latte',
      'Churro Jack-O-Latte',
      'Smores Latte',

    ]
  },
  'spooky': {
    name: 'Spooky Menu (Menú Espeluznante)',
    coffees: [
      'Haunted Oreo Mazapan',
      'Bloody Besos',
      'Ghost Face'
 
    ]
  },
  'drea': {
    name: 'Drea\'s Secret Menu (Menú Secreto de Drea)',
    coffees: [
      'Blvd latte(Brown Sugar Shaken Expresso)',
      'A Town Latte(Caramel Latte)'
    ]
  }
}

export const SIZE_OPTIONS = [ 'Regular (16oz)', 'Large (24oz)']
export const MILK_OPTIONS = ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Coconut Milk']
export const EXTRA_OPTIONS = [ 'Hot', 'Iced' ]

// Pricing
export const SIZE_PRICES = {
  'Regular (16oz)': 7,
  'Large (24oz)': 9
}

export const EXTRA_PRICES = {
  'Extra Shot': 1,
  'Extra Drizzle': 0.5,
  'Extra Cold Foam': 0.5
}

export default function Example() {
  // Order acceptance status
  const [isTakingOrders, setIsTakingOrders] = useState(true);
  const [checkingOrderStatus, setCheckingOrderStatus] = useState(true);
  
  // Booked time slots for availability checking
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  
  // Use your new state management approach
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentOrder, setCurrentOrder] = useState<OrderSummaryType>({
    name: '',
    items: [],
    total: 0,
    status: 'pending'
  })

  // Current coffee form state
  const [currentCoffee, setCurrentCoffee] = useState({
    coffee: '',
    size: '',
    milk: 'Whole Milk', // Default milk type
    extras: [] as string[],
    quantity: 1, // Default quantity
    notes: ''
  })

  // Time picker state - no default value, user must select
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    pickupTime: '',
    coffeeType: '',
    size: '',
    milk: '',
    quantity: ''
  })

  // Check order acceptance status on component mount
  useEffect(() => {
    const checkOrderStatus = () => {
      const takingOrders = localStorage.getItem('besos_taking_orders');
      if (takingOrders !== null) {
        setIsTakingOrders(takingOrders === 'true');
      }
      setCheckingOrderStatus(false);
    };
    
    checkOrderStatus();
    
    // Check every 30 seconds for status changes
    const interval = setInterval(checkOrderStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch booked time slots
  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('pickup_time')
          .eq('status', 'pending')
          .not('pickup_time', 'is', null)
        
        if (error) {
          console.error('❌ Error fetching booked slots:', error);
          return;
        }
        
        // Convert pickup times to slot keys (YYYY-MM-DD HH:MM format)
        const slots = new Set<string>();
        data?.forEach(order => {
          if (order.pickup_time) {
            const date = new Date(order.pickup_time);
            // Normalize to 5-minute intervals
            const minutes = date.getMinutes();
            const normalizedMinutes = Math.floor(minutes / 5) * 5;
            date.setMinutes(normalizedMinutes, 0, 0);
            
            const slotKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            slots.add(slotKey);
          }
        });
        
        console.log('📊 Loaded booked slots:', Array.from(slots));
        setBookedSlots(slots);
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      }
    };
    
    if (isTakingOrders) {
      fetchBookedSlots();
      // Refresh every 30 seconds
      const interval = setInterval(fetchBookedSlots, 30000);
      return () => clearInterval(interval);
    }
  }, [isTakingOrders]);

  // Check if a time slot is available
  const isSlotAvailable = (date: Date) => {
    // Normalize to 5-minute intervals
    const minutes = date.getMinutes();
    const normalizedMinutes = Math.floor(minutes / 5) * 5;
    const normalizedDate = new Date(date);
    normalizedDate.setMinutes(normalizedMinutes, 0, 0);
    
    const slotKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')} ${String(normalizedDate.getHours()).padStart(2, '0')}:${String(normalizedDate.getMinutes()).padStart(2, '0')}`;
    
    return !bookedSlots.has(slotKey);
  };

  // Validation functions
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        return value.trim() ? '' : 'First name is required'
      case 'lastName':
        return value.trim() ? '' : 'Last name is required'
      case 'phone':
        return value.trim() ? '' : 'Phone number is required'
      case 'pickupTime':
        return value ? '' : 'Pickup time is required'
      case 'coffeeType':
        return value ? '' : 'Please select a coffee type'
      case 'size':
        return value ? '' : 'Please select a size'
      case 'milk':
        return value ? '' : 'Please select a milk type'
      case 'quantity':
        return value && parseInt(value) >= 1 ? '' : 'Please enter a valid quantity'
      default:
        return ''
    }
  }

  const updateValidationError = (field: string, value: string) => {
    const error = validateField(field, value)
    setValidationErrors(prev => ({ ...prev, [field]: error }))
  }

  // Functions from your OrderPage component
  const addItem = (item: OrderItem) => {
    setOrderItems((prev) => [...prev, item])
    updateOrderTotal()
  }

  const removeItem = (itemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
    updateOrderTotal()
  }

  const updateOrderTotal = () => {
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setCurrentOrder(prev => ({ ...prev, total }))
  }

  const updateCustomerName = () => {
    const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim()
    setCurrentOrder(prev => ({ ...prev, name: customerName }))
  }

  // Functions to handle current coffee form
  const updateCurrentCoffee = (field: string, value: any) => {
    setCurrentCoffee(prev => ({ ...prev, [field]: value }))
  }

  const toggleExtra = (extra: string) => {
    setCurrentCoffee(prev => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter(e => e !== extra)
        : [...prev.extras, extra]
    }))
  }

  const addExtraShot = () => {
    setCurrentCoffee(prev => ({
      ...prev,
      extras: [...prev.extras, 'Extra Shot']
    }))
  }

  const calculateCurrentPrice = () => {
    let total = SIZE_PRICES[currentCoffee.size as keyof typeof SIZE_PRICES] || 0
    
    // Add extra shot pricing (multiple shots)
    const extraShots = currentCoffee.extras.filter(extra => extra.startsWith('Extra Shot')).length
    total += extraShots * EXTRA_PRICES['Extra Shot']
    
    // Add other extras
    currentCoffee.extras.forEach(extra => {
      if (extra === 'Extra Drizzle') {
        total += EXTRA_PRICES['Extra Drizzle']
      }
      if (extra === 'Extra Cold Foam') {
        total += EXTRA_PRICES['Extra Cold Foam']
      }
    })
    
    return total * currentCoffee.quantity
  }

  const addCurrentCoffeeToOrder = () => {
    // Validate required fields and update error state
    const coffeeError = validateField('coffeeType', currentCoffee.coffee)
    const sizeError = validateField('size', currentCoffee.size)
    const milkError = validateField('milk', currentCoffee.milk)
    const quantityError = validateField('quantity', currentCoffee.quantity.toString())
    
    setValidationErrors(prev => ({
      ...prev,
      coffeeType: coffeeError,
      size: sizeError,
      milk: milkError,
      quantity: quantityError
    }))
    
    // If any validation errors, don't add the item
    if (coffeeError || sizeError || milkError || quantityError) {
      return
    }

    const newItem: OrderItem = {
      id: Date.now(),
      coffee_type: currentCoffee.coffee,
      size: currentCoffee.size,
      milk: currentCoffee.milk,
      extras: currentCoffee.extras,
      price: calculateCurrentPrice() / currentCoffee.quantity, // Price per item
      quantity: currentCoffee.quantity,
      notes: currentCoffee.notes
    }

    addItem(newItem)
    
    // Reset form and clear validation errors
    setCurrentCoffee({
      coffee: '',
      size: '',
      milk: 'Whole Milk', // Reset to default
      extras: [],
      quantity: 1, // Reset to default
      notes: ''
    })
    
    setValidationErrors(prev => ({
      ...prev,
      coffeeType: '',
      size: '',
      milk: '',
      quantity: ''
    }))
  }

  // Helper function to calculate price breakdown
  const getPriceBreakdown = (item: OrderItem) => {
    const breakdown = []
    
    // Base price
    const basePrice = SIZE_PRICES[item.size as keyof typeof SIZE_PRICES] || 0
    breakdown.push(`${item.size}: $${basePrice.toFixed(2)}`)
    
    // Extra shots
    const extraShots = item.extras.filter(extra => extra.startsWith('Extra Shot')).length
    if (extraShots > 0) {
      const shotPrice = extraShots * EXTRA_PRICES['Extra Shot']
      breakdown.push(`Extra Shot${extraShots > 1 ? `s (${extraShots})` : ''}: $${shotPrice.toFixed(2)}`)
    }
    
    // Extra drizzle
    if (item.extras.includes('Extra Drizzle')) {
      breakdown.push(`Extra Drizzle: $${EXTRA_PRICES['Extra Drizzle'].toFixed(2)}`)
    }
    
    if (item.extras.includes('Extra Cold Foam')) {
      breakdown.push(`Extra Cold Foam: $${EXTRA_PRICES['Extra Cold Foam'].toFixed(2)}`)
    }
    
    return breakdown
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateCustomerName()
    updateOrderTotal()
    
    const finalOrder: OrderSummaryType = {
      ...currentOrder,
      name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
      user_phone_number: customerInfo.phone,
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      pickup_time: selectedDateTime?.toISOString()
    }
    
    // Enhanced logging for debugging
    console.log('=== ORDER SUBMISSION DEBUG ===')
    console.log('Final Order Object:', finalOrder)
    console.log('Customer Info:', customerInfo)
    console.log('Order Items:', orderItems)
    console.log('Selected DateTime:', selectedDateTime)
    console.log('Supabase Client:', supabase)
    
    // Check Supabase configuration
    console.log('Supabase client available:', !!supabase)
    
    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase.from('orders').select('count').limit(1)
      console.log('Supabase connection test - Data:', testData, 'Error:', testError)
    } catch (testErr) {
      console.error('Supabase connection test failed:', testErr)
    }
    
    // Add this to your handleSubmit function, right after the Supabase client check
    console.log('🔍 Testing actual role...')
    try {
      const { data: roleTest } = await supabase.rpc('get_current_role')
      console.log('Current role:', roleTest)
    } catch (e) {
      console.log('Role test failed:', e)
    }
    
    // Comprehensive form validation with inline errors
    const firstNameError = validateField('firstName', customerInfo.firstName)
    const lastNameError = validateField('lastName', customerInfo.lastName)
    const phoneError = validateField('phone', customerInfo.phone)
    const pickupTimeError = validateField('pickupTime', selectedDateTime ? 'selected' : '')
    
    setValidationErrors(prev => ({
      ...prev,
      firstName: firstNameError,
      lastName: lastNameError,
      phone: phoneError,
      pickupTime: pickupTimeError
    }))
    
    // If any validation errors, don't submit
    if (firstNameError || lastNameError || phoneError || pickupTimeError) {
      return
    }
    
    if (orderItems.length === 0) {
      alert('Please add at least one coffee to your order.')
      return
    }
    
    try {
      console.log('=== ORDER SUBMISSION DEBUG START ===')
      console.log('Attempting to submit order to Supabase...')
      
      // Log raw input data
      console.log('🔍 RAW INPUT DATA:')
      console.log('Customer Info:', JSON.stringify(customerInfo, null, 2))
      console.log('Order Items:', JSON.stringify(orderItems, null, 2))
      console.log('Selected DateTime:', selectedDateTime)
      console.log('DateTime Type:', typeof selectedDateTime)
      console.log('DateTime instanceof Date:', selectedDateTime instanceof Date)

      const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
      console.log('📝 Full Name:', fullName)

      const cleanedItems = orderItems.map(i => ({
        coffee_type: i.coffee_type,
        size: i.size,
        milk: i.milk,
        extras: i.extras ?? [],
        price: i.price ?? 0,
        quantity: i.quantity ?? 1,
        notes: i.notes ?? ''
      }));

      console.log('🧹 CLEANED ITEMS:')
      console.log('Original items count:', orderItems.length)
      console.log('Cleaned items count:', cleanedItems.length)
      console.log('Cleaned items:', JSON.stringify(cleanedItems, null, 2))

      const calculatedTotal = cleanedItems.reduce((s, i) => s + i.price * i.quantity, 0)
      console.log('💰 Calculated Total:', calculatedTotal)

      const orderData = {
        name: fullName,
        user_phone_number: customerInfo.phone || '',
        items: cleanedItems,                     // fully serializable
        total: calculatedTotal,
        status: 'pending',
        pickup_time: selectedDateTime?.toISOString() || null
      };
      
      console.log('📦 FINAL ORDER DATA:')
      console.log('Order Data Object:', JSON.stringify(orderData, null, 2))
      console.log('Order Data Keys:', Object.keys(orderData))
      console.log('Order Data Types:', {
        name: typeof orderData.name,
        user_phone_number: typeof orderData.user_phone_number,
        items: typeof orderData.items,
        total: typeof orderData.total,
        status: typeof orderData.status,
        pickup_time: typeof orderData.pickup_time
      })
      
      // Test JSON serialization
      try {
        const serialized = JSON.stringify(orderData)
        console.log('✅ JSON Serialization Test: PASSED')
        console.log('Serialized Length:', serialized.length)
      } catch (serializeError) {
        console.error('❌ JSON Serialization Test: FAILED', serializeError)
      }

      // Inspect Supabase client
      console.log('🔌 SUPABASE CLIENT INFO:')
      console.log('Supabase client exists:', !!supabase)
      console.log('Supabase client type:', typeof supabase)
      console.log('Supabase from method exists:', typeof supabase.from === 'function')
      
      // Try to inspect table schema
      console.log('🔍 SCHEMA INSPECTION:')
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from('orders')
          .select('*')
          .limit(0)
        
        console.log('Schema inspection result:', { schemaData, schemaError })
        
        // Try to get table info (this RPC doesn't exist, so we'll catch the error)
        try {
          const { data: tableInfo, error: tableError } = await supabase
            .rpc('get_table_info', { table_name: 'orders' })
          console.log('Table info:', { tableInfo, tableError })
        } catch (rpcError) {
          console.log('RPC not available (expected):', rpcError instanceof Error ? rpcError.message : 'Unknown error')
        }
      } catch (schemaErr) {
        console.log('Schema inspection failed:', schemaErr)
      }
      
      console.log('🚀 ATTEMPTING INSERT...')
      
      console.log('🚀 Submitting order using raw fetch (Supabase client has issues)...')
      
      // Debug: Log the exact request being made
      const requestUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders`
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      const requestHeaders = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
      
      console.log('🌐 Request URL:', requestUrl)
      console.log('🌐 Request Headers:', requestHeaders)
      console.log('🌐 Request Body:', JSON.stringify(orderData, null, 2))
      
      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(orderData)
        })
        
        console.log('Raw fetch status:', response.status)
        console.log('Raw fetch status text:', response.statusText)
        console.log('Raw fetch headers:', Object.fromEntries(response.headers.entries()))
        
        if (response.ok) {
          const responseData = await response.json()
          console.log('✅ Order submitted successfully via raw fetch!')
          console.log('Response data:', responseData)
          
          // Save order data to local storage for persistence
          const confirmationData = {
            id: responseData[0]?.id || Date.now(),
            name: orderData.name,
            user_phone_number: orderData.user_phone_number,
            items: orderData.items,
            total: orderData.total,
            pickup_time: orderData.pickup_time,
            status: 'pending',
            created_at: new Date().toISOString()
          }
          
          localStorage.setItem('besos_order_confirmation', JSON.stringify(confirmationData))
          
          // Redirect to confirmation page
          window.location.href = '/confirmation'
          return
        } else {
          const errorText = await response.text()
          console.log('❌ Raw fetch failed with status:', response.status)
          console.log('❌ Raw fetch error response:', errorText)
          
          try {
            const errorJson = JSON.parse(errorText)
            console.log('❌ Parsed error:', errorJson)
            
            if (errorJson.code === '42501') {
              console.log('🔍 RLS Policy Error Details:')
              console.log('- Error Code:', errorJson.code)
              console.log('- Message:', errorJson.message)
              console.log('- Details:', errorJson.details)
              console.log('- Hint:', errorJson.hint)
            }
          } catch (e) {
            console.log('❌ Error response is not JSON:', errorText)
          }
          
          alert(`Order submission failed: ${errorText}`)
          return
        }
      } catch (fetchError) {
        console.error('❌ Raw fetch network error:', fetchError)
        alert(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
        return
      }
      
    } catch (error) {
      console.error('Unexpected error during submission:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      {/* Show loading while checking order status */}
      {checkingOrderStatus && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking order status...</p>
          </div>
        </div>
      )}
      
      {/* Show closed message if not taking orders */}
      {!checkingOrderStatus && !isTakingOrders && (
        <OrderClosedMessage />
      )}
      
      {/* Show normal form if taking orders */}
      {!checkingOrderStatus && isTakingOrders && (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12">
        {/* Customer Information */}
        <div className="pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900 dark:text-gray-800">Customer Information (Información del Cliente)</h2>
          <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-600">
            Please provide your contact information for the order. (Por favor proporcione su información de contacto para el pedido.)
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                First name (Nombre)
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="given-name"
                  value={customerInfo.firstName}
                  onChange={(e) => {
                    setCustomerInfo({...customerInfo, firstName: e.target.value})
                    updateValidationError('firstName', e.target.value)
                  }}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 ${
                    validationErrors.firstName ? 'border-red-500 outline-red-500' : ''
                  }`}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                Last name (Apellido)
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="family-name"
                  value={customerInfo.lastName}
                  onChange={(e) => {
                    setCustomerInfo({...customerInfo, lastName: e.target.value})
                    updateValidationError('lastName', e.target.value)
                  }}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 ${
                    validationErrors.lastName ? 'border-red-500 outline-red-500' : ''
                  }`}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                Phone number (Número de teléfono)
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={customerInfo.phone}
                  onChange={(e) => {
                    setCustomerInfo({...customerInfo, phone: e.target.value})
                    updateValidationError('phone', e.target.value)
                  }}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 ${
                    validationErrors.phone ? 'border-red-500 outline-red-500' : ''
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Selection & Coffee Orders */}
        <div className="pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900 dark:text-gray-800 mb-6">Choose Your Menu</h2>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-300">
            <nav className="-mb-px flex space-x-8">
              {Object.entries(MENU_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMenu(key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    selectedMenu === key
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
                    </div>

          {/* Coffee Selection - Beautiful styled form */}
          {selectedMenu && (
            <div className="mt-8 rounded-lg border border-gray-200 p-6 dark:border-gray-300">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                {/* Coffee Selection */}
                <div className="sm:col-span-6">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Coffee Type *
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                      value={currentCoffee.coffee}
                      onChange={(e) => {
                        updateCurrentCoffee('coffee', e.target.value)
                        updateValidationError('coffeeType', e.target.value)
                      }}
                      className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:focus:outline-indigo-500 ${
                        validationErrors.coffeeType ? 'border-red-500 outline-red-500' : ''
                      }`}
                    >
                      <option value="">Select a coffee</option>
                      {MENU_CATEGORIES[selectedMenu as keyof typeof MENU_CATEGORIES]?.coffees.map(coffee => (
                        <option key={coffee} value={coffee}>{coffee}</option>
                      ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
                />
              </div>
              {validationErrors.coffeeType && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.coffeeType}</p>
              )}
            </div>

                {/* Size Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Size (Tamaño)
              </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select 
                      value={currentCoffee.size}
                      onChange={(e) => {
                        updateCurrentCoffee('size', e.target.value)
                        updateValidationError('size', e.target.value)
                      }}
                      className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:focus:outline-indigo-500 ${
                        validationErrors.size ? 'border-red-500 outline-red-500' : ''
                      }`}>
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
                />
              </div>
              {validationErrors.size && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.size}</p>
              )}
            </div>

                {/* Milk Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Milk Type (Tipo de Leche)
              </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select 
                      value={currentCoffee.milk}
                      onChange={(e) => {
                        updateCurrentCoffee('milk', e.target.value)
                        updateValidationError('milk', e.target.value)
                      }}
                      className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:focus:outline-indigo-500 ${
                        validationErrors.milk ? 'border-red-500 outline-red-500' : ''
                      }`}>
                      {MILK_OPTIONS.map(milk => (
                        <option key={milk} value={milk}>{milk}</option>
                      ))}
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
                />
              </div>
              {validationErrors.milk && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.milk}</p>
              )}
            </div>

                {/* Extras */}
            <div className="sm:col-span-2">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Extras (Extras)
              </label>
                  <div className="mt-2 space-y-2">
                    {/* Extra Shot with Plus Icon */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                <input
                          type="checkbox"
                          checked={currentCoffee.extras.some(extra => extra.startsWith('Extra Shot'))}
                          onChange={() => {
                            const hasExtraShot = currentCoffee.extras.some(extra => extra.startsWith('Extra Shot'))
                            if (hasExtraShot) {
                              const newExtras = currentCoffee.extras.filter(extra => !extra.startsWith('Extra Shot'))
                              updateCurrentCoffee('extras', newExtras)
                            } else {
                              updateCurrentCoffee('extras', [...currentCoffee.extras, 'Extra Shot'])
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-400 dark:bg-gray-100 dark:focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-gray-800">
                          Extra Shot (+$1)
                          {currentCoffee.extras.filter(extra => extra.startsWith('Extra Shot')).length > 1 && 
                            ` x${currentCoffee.extras.filter(extra => extra.startsWith('Extra Shot')).length}`
                          }
                        </span>
              </label>
                      {currentCoffee.extras.some(extra => extra.startsWith('Extra Shot')) && (
                        <button
                          type="button"
                          onClick={addExtraShot}
                          className="ml-2 p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                        >
                          <PlusIcon className="size-3 text-indigo-600 dark:text-indigo-400" />
                        </button>
                      )}
        </div>

                    {/* Extra Drizzle */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentCoffee.extras.includes('Extra Drizzle')}
                        onChange={() => toggleExtra('Extra Drizzle')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-400 dark:bg-gray-100 dark:focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-800">Extra Drizzle (+$0.50)</span>
                    </label>
                    
                    {/* Extra Cold Foam */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentCoffee.extras.includes('Extra Cold Foam')}
                        onChange={() => toggleExtra('Extra Cold Foam')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-400 dark:bg-gray-100 dark:focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-800">Extra Cold Foam (+$0.50)</span>
                    </label>
                    
                    {/* Other Extras */}
                    {EXTRA_OPTIONS.map(extra => (
                      <label key={extra} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentCoffee.extras.includes(extra)}
                          onChange={() => toggleExtra(extra)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-400 dark:bg-gray-100 dark:focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-gray-800">{extra}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Quantity (Cantidad)
                    </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentCoffee.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        updateCurrentCoffee('quantity', value)
                        updateValidationError('quantity', value.toString())
                      }}
                      className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:focus:outline-indigo-500 ${
                        validationErrors.quantity ? 'border-red-500 outline-red-500' : ''
                      }`}
                    />
                    {validationErrors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.quantity}</p>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="sm:col-span-4">
                  <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-800">
                    Special Instructions (Instrucciones Especiales)
                  </label>
                  <div className="mt-2">
                    <textarea
                      rows={2}
                      value={currentCoffee.notes}
                      onChange={(e) => updateCurrentCoffee('notes', e.target.value)}
                      placeholder="Any special requests for this coffee... (Cualquier solicitud especial para este café...)"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Price Display and Add Coffee Button */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-800">
                  Total: (Total:) ${currentCoffee.size ? calculateCurrentPrice().toFixed(2) : '0.00'}
                </div>
                <button
                  type="button"
                  onClick={addCurrentCoffeeToOrder}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:focus-visible:outline-indigo-500"
                >
                  <PlusIcon className="size-4" />
                  Add Coffee (Agregar Café)
                </button>
              </div>
            </div>
          )}

          {!selectedMenu && (
            <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please select a menu above to see available coffee options.
                    </p>
                  </div>
          )}
                </div>

        {/* Order Summary - Beautiful styled summary */}
        {selectedMenu && orderItems.length > 0 && (
          <div className="pb-12">
            <h2 className="text-base/7 font-semibold text-gray-900 dark:text-gray-800 mb-6">Order Summary (Resumen del Pedido)</h2>
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-300">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-800">{item.coffee_type}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-600">
                        {item.size} • {item.milk}
                        {item.extras.length > 0 && ` • ${item.extras.join(', ')}`}
                        {item.notes && ` • ${item.notes}`}
                      </p>
                      {/* Price breakdown */}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        {getPriceBreakdown(item).join(' • ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-gray-800">
                          Qty: {item.quantity}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item (Eliminar artículo)"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-800">Total:</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-800">
                      ${orderItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Time Picker */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-300">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-800 mb-3">Select Pickup Time * (Seleccionar Hora de Recogida *)</h3>
                    <DatePicker
                      selected={selectedDateTime}
                      onChange={(date: Date | null) => {
                        if (date) {
                          // Since filterTime already prevents unavailable slots, we can directly set the date
                          setSelectedDateTime(date)
                          updateValidationError('pickupTime', 'selected')
                          console.log('✅ Time slot selected:', date.toLocaleString())
                        } else {
                          setSelectedDateTime(null)
                          updateValidationError('pickupTime', '')
                        }
                      }}
                      showTimeSelect
                      timeIntervals={5}
                      timeFormat="h:mm aa"
                      dateFormat="MMMM d, yyyy h:mm aa"
                      minTime={new Date(new Date().setHours(7, 0, 0, 0))}
                      maxTime={new Date(new Date().setHours(17, 0, 0, 0))}
                      filterDate={(date) => {
                        // Only allow today and future dates
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date >= today;
                      }}
                      filterTime={(time) => {
                        const now = new Date();
                        
                        // First check if time is in the past
                        if (time <= now) {
                          return false;
                        }
                        
                        // Then check slot availability
                        return isSlotAvailable(time);
                      }}
                      className={`w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white dark:text-gray-800 dark:outline-gray-300 dark:focus:outline-indigo-500 ${
                        validationErrors.pickupTime ? 'border-red-500 outline-red-500' : ''
                      }`}
                      placeholderText="Select pickup date and time * (7am-5pm, 5-minute intervals)"
                      isClearable={true}
                      required
                    />
                    {validationErrors.pickupTime && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.pickupTime}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      ⏰ Pickup times are available from 7:00 AM to 5:00 PM in 5-minute intervals (Horas de recogida disponibles de 7:00 AM a 5:00 PM en intervalos de 5 minutos)
                      <br />
                      📅 Booked time slots are automatically unavailable (Las franjas horarias reservadas no están disponibles automáticamente)
                      <br />
                      🚫 Past dates and times cannot be selected (No se pueden seleccionar fechas y horas pasadas)
                    </p>
                </div>
                </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Submit Button - Only show when at least one coffee is added */}
      {orderItems.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:focus-visible:outline-indigo-500"
          >
            Submit Order (Enviar Pedido)
          </button>
          
          {/* Mobile-friendly error summary */}
          {(() => {
            const errors = Object.entries(validationErrors).filter(([_, error]) => error);
            return errors.map(([field, error]) => (
              <p key={field} className="mt-2 text-sm text-red-600">{error}</p>
            ));
          })()}
        </div>
      )}
    </form>
      )}
    </>
  )
}