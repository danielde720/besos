

export default function OrderClosedMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
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
            Please check our Instagram for the latest updates
          </p>
          <p className="text-sm text-gray-500">
            (Estamos ocupados y no podemos aceptar nuevos pedidos en este momento. 
            Por favor, revisa nuestro Instagram para las últimas actualizaciones.)
          </p>
        </div>
        
        {/* Instagram Link */}
        <div className="mb-6">
          <a 
            href="https://instagram.com/besos.cafe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281c-.49 0-.98-.49-.98-.98s.49-.98.98-.98.98.49.98.98-.49.98-.98.98zm-1.297 9.281c-1.297 0-2.448-.49-3.323-1.297-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
            </svg>
            Follow @besos.cafe
          </a>
        </div>
        
        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Thank you for your patience! (¡Gracias por su paciencia!)
        </p>
      </div>
    </div>
  );
}
