import React from 'react';

export default function OrderClosedMessage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Closed Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sorry, We're Not Taking Orders Right Now
          <br />
          <span className="text-lg font-normal text-gray-600">
            (Lo sentimos, no estamos tomando pedidos en este momento)
          </span>
        </h1>
        
        {/* Message */}
        <div className="text-gray-600 mb-6 space-y-3">
          <p>
            We're currently busy and unable to accept new orders at this time.
          </p>
          <p className="font-medium">
            Please check back in about 30 minutes
          </p>
          <p className="text-sm text-gray-500">
            (Estamos ocupados y no podemos aceptar nuevos pedidos en este momento. 
            Por favor, vuelva a verificar en unos 30 minutos.)
          </p>
        </div>
        

        
        {/* Refresh Button */}
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Check Again
        </button>
        
        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Thank you for your patience! (¡Gracias por su paciencia!)
        </p>
      </div>
    </div>
  );
}
