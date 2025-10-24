import { CheckCircleIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get order data from local storage
    const storedOrder = localStorage.getItem('besos_order_confirmation')
    if (storedOrder) {
      try {
        const parsedOrder = JSON.parse(storedOrder)
        setOrderData(parsedOrder)
        
        // Check if order has been completed or cancelled
        if (parsedOrder.id) {
          checkOrderStatus(parsedOrder.id)
        }
      } catch (error) {
        console.error('Error parsing stored order:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const checkOrderStatus = async (orderId: number) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, cancellation_reason')
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Route to appropriate page based on status
      if (data?.status === 'completed') {
        // Store order data for the completed page
        localStorage.setItem('besos_order_completed', JSON.stringify({
          orderId,
          orderDetails: orderData
        }))
        navigate('/order-completed')
      } else if (data?.status === 'cancelled') {
        // Store order data for the cancelled page
        localStorage.setItem('besos_order_cancelled', JSON.stringify({
          orderId,
          orderDetails: orderData,
          cancellationReason: data.cancellation_reason
        }))
        navigate('/order-cancelled')
      }
    } catch (error) {
      console.error('Error checking order status:', error)
    }
  }


  const formatPickupTime = (pickupTime: string) => {
    const date = new Date(pickupTime)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    )
  }


  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Order Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your order information. Please place a new order.
          </p>
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Place New Order
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Order Confirmed! 🎉 (¡Pedido Confirmado! 🎉)
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Your coffee order has been successfully submitted and is being prepared. (Su pedido de café ha sido enviado exitosamente y está siendo preparado.)
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            📋 Order Details
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Order #:</span>
              <span className="text-gray-900 font-semibold">#{orderData.id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Customer:</span>
              <span className="text-gray-900">{orderData.name}</span>
            </div>
            
            {orderData.user_phone_number && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{orderData.user_phone_number}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="text-gray-900 font-semibold">${orderData.total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-700">Pickup Time:</span>
              <span className="text-gray-900 text-right">{formatPickupTime(orderData.pickup_time)}</span>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h3 className="font-semibold text-gray-900 mb-3">☕ Your Order:</h3>
            <div className="space-y-2">
              {orderData.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.coffee_type}</p>
                    <p className="text-sm text-gray-600">
                      {item.size} • {item.milk}
                      {item.extras?.length > 0 && ` • ${item.extras.join(', ')}`}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 italic">Note: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    <p className="font-semibold text-gray-900">
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            💳 Payment Instructions
          </h2>
          <p className="text-gray-700 mb-2">
            Please have proof of payment sent and screenshot ready at the time of pickup when in drive thru lane. We accept Zelle/Apple Pay (714)749-6701 - CashApp/Venmo @besoscafe or perferably cash. (Por favor tenga prueba de pago enviada y captura de pantalla listo al momento de recoger cuando esté en el carril de autoservicio. Aceptamos Zelle/Apple Pay (714)749-6701 - CashApp/Venmo @besoscafe o preferiblemente efectivo.)
          </p>
        </div>

        {/* Pickup Location */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <MapPinIcon className="w-6 h-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              📍 Pickup Location
            </h2>
          </div>
          
          <div className="text-left space-y-3">
            <div>
              <p className="font-semibold text-gray-900">Besos Coffee</p>
              <a 
                href="https://maps.google.com/maps?q=603+W+Bellevue+Dr+Anaheim+CA+92805"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                <p className="text-gray-700 hover:text-blue-600">603 W Bellevue Dr</p>
                <p className="text-gray-700 hover:text-blue-600">Anaheim, CA 92805</p>
              </a>
              <p className="text-xs text-gray-500 mt-1">📍 Click address to open in maps</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                🧭 Navigation Help:
              </p>
              <p className="text-sm text-gray-700">
              Once you get there, go into the alley beside the building and make a left.
              You'll see our pickup area in front of the garage, next to orange cones  — that's where we'll meet you. (Una vez que llegues, ve por el callejón al lado del edificio y gira a la izquierda. Verás nuestra área de recogida frente al garaje, alado de los conos naranjas  — ahí es donde nos encontraremos.)
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-gray-500 space-y-2">
          <p>• If you cant make it or need to modify your order please DM us on instagram so we can cancel or modify your order. DM us @ besos.cafe (• Si no puedes venir o necesitas modificar tu pedido, por favor envíanos un DM en Instagram para que podamos cancelar o modificar tu pedido. Envíanos un DM @ besos.cafe)</p>
        </div>
      </div>
    </div>
  )
}
