import React from 'react';
import { useNavigate } from 'react-router-dom';

interface OrderEditedPageProps {
  orderId?: number;
  originalOrder?: any;
  editedOrder?: any;
}

export default function OrderEditedPage({ orderId, originalOrder, editedOrder }: OrderEditedPageProps) {
  const navigate = useNavigate();

  const handleNewOrder = () => {
    // Clear any stored order data
    localStorage.removeItem('besos_order_confirmation');
    // Navigate to the ordering form
    navigate('/');
  };

  const handleAcceptChanges = () => {
    // Store the edited order as the current order
    if (editedOrder) {
      localStorage.setItem('besos_order_confirmation', JSON.stringify(editedOrder));
    }
    // Navigate to confirmation page
    navigate('/confirmation');
  };

  // Helper function to compare and highlight changes
  const getChangedFields = () => {
    if (!originalOrder || !editedOrder) return [];
    
    const changes = [];
    
    // Compare basic fields
    if (originalOrder.name !== editedOrder.name) {
      changes.push({
        field: 'Nombre / Name',
        original: originalOrder.name,
        updated: editedOrder.name
      });
    }
    
    if (originalOrder.total !== editedOrder.total) {
      changes.push({
        field: 'Total',
        original: `$${originalOrder.total}`,
        updated: `$${editedOrder.total}`
      });
    }
    
    if (originalOrder.pickup_time !== editedOrder.pickup_time) {
      changes.push({
        field: 'Hora de Recogida / Pickup Time',
        original: originalOrder.pickup_time ? new Date(originalOrder.pickup_time).toLocaleString() : 'N/A',
        updated: editedOrder.pickup_time ? new Date(editedOrder.pickup_time).toLocaleString() : 'N/A'
      });
    }
    
    // Compare items (simplified comparison)
    if (JSON.stringify(originalOrder.items) !== JSON.stringify(editedOrder.items)) {
      changes.push({
        field: 'Artículos / Items',
        original: `${originalOrder.items?.length || 0} items`,
        updated: `${editedOrder.items?.length || 0} items`
      });
    }
    
    return changes;
  };

  const changes = getChangedFields();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Edit Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Pedido Editado / Order Edited
        </h1>
        
        <p className="text-lg text-gray-600 text-center mb-8">
          Tu pedido ha sido modificado por nuestro equipo. Por favor revisa los cambios.
          <br />
          <span className="text-sm text-gray-500">
            Your order has been modified by our team. Please review the changes.
          </span>
        </p>

        {/* Order ID */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <h3 className="font-semibold text-gray-900">Orden # {orderId}</h3>
        </div>

        {/* Changes Section */}
        {changes.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cambios Realizados / Changes Made:</h3>
            <div className="space-y-4">
              {changes.map((change, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">{change.field}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Original / Original:</span>
                      <p className="text-gray-800">{change.original}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Actualizado / Updated:</span>
                      <p className="text-gray-800">{change.updated}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 text-center">
              No se detectaron cambios específicos en los campos principales.
              <br />
              <span className="text-sm">No specific changes detected in main fields.</span>
            </p>
          </div>
        )}

        {/* Current Order Details */}
        {editedOrder && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Detalles Actuales / Current Details:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Cliente:</span> {editedOrder.name}</p>
              <p><span className="font-medium">Total:</span> ${editedOrder.total}</p>
              <p><span className="font-medium">Hora de Recogida:</span> {editedOrder.pickup_time ? new Date(editedOrder.pickup_time).toLocaleString() : 'N/A'}</p>
              <p><span className="font-medium">Artículos:</span> {editedOrder.items?.length || 0} items</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAcceptChanges}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Aceptar Cambios / Accept Changes
          </button>
          
          <button
            onClick={handleNewOrder}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Nuevo Pedido / New Order
          </button>
        </div>

        {/* Additional Message */}
        <p className="text-sm text-gray-500 mt-4 text-center">
          Si tienes preguntas sobre los cambios, contáctanos.
          <br />
          <span className="text-xs">If you have questions about the changes, please contact us.</span>
        </p>
      </div>
    </div>
  );
}
