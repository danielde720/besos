import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrderCompletedPage() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // Get order data from localStorage
    const storedData = localStorage.getItem('besos_order_completed');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setOrderData(parsedData);
        // Clear the stored data after reading
        localStorage.removeItem('besos_order_completed');
      } catch (error) {
        console.error('Error parsing stored order data:', error);
      }
    }
  }, []);

  const handleNewOrder = () => {
    // Clear any stored order data
    localStorage.removeItem('besos_order_confirmation');
    // Navigate to the ordering form
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Orden Completada! / Order Completed!
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Gracias por elegirnos. Tu pedido ha sido completado exitosamente.
          <br />
          <span className="text-sm text-gray-500">
            Thank you for choosing us. Your order has been completed successfully.
          </span>
        </p>

        {/* Order Details */}
        {orderData?.orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Detalles del Pedido / Order Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Orden #:</span> {orderData.orderId}</p>
              <p><span className="font-medium">Cliente:</span> {orderData.orderDetails.name}</p>
              <p><span className="font-medium">Total:</span> ${orderData.orderDetails.total}</p>
              <p><span className="font-medium">Hora de Recogida:</span> {orderData.orderDetails.pickup_time ? new Date(orderData.orderDetails.pickup_time).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleNewOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Hacer Nuevo Pedido / Place New Order
        </button>

        {/* Additional Message */}
        <p className="text-sm text-gray-500 mt-4">
          ¡Esperamos verte pronto! / We hope to see you soon!
        </p>
      </div>
    </div>
  );
}
