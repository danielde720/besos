import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrderCancelledPage() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // Get order data from localStorage
    const storedData = localStorage.getItem('besos_order_cancelled');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setOrderData(parsedData);
        // Clear the stored data after reading
        localStorage.removeItem('besos_order_cancelled');
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Cancellation Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Cancellation Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Orden Cancelada / Order Cancelled
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Lamentamos informarte que tu pedido ha sido cancelado.
          <br />
          <span className="text-sm text-gray-500">
            We regret to inform you that your order has been cancelled.
          </span>
        </p>

        {/* Cancellation Reason */}
        {orderData?.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-800 mb-2">Razón de Cancelación / Cancellation Reason:</h3>
            <p className="text-sm text-red-700">{orderData.cancellationReason}</p>
          </div>
        )}

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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Hacer Nuevo Pedido / Place New Order
        </button>

        {/* Additional Message */}
        <p className="text-sm text-gray-500 mt-4">
          ¡Esperamos poder servirte pronto! / We hope to serve you soon!
        </p>
      </div>
    </div>
  );
}
