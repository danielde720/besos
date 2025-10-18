import { Routes, Route } from "react-router";
import logo from './assets/logo.png';
import Form from "./features/ordering/Form.tsx";
import Admin from "./features/admin/AdminPage.tsx";
import AdminLogin from "./features/admin/AdminLogin.tsx";
import ConfirmationPage from "./features/ordering/ConfirmationPage.tsx";

export default function App() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `url(${logo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Semi-transparent overlay for better readability */}
      <div className="min-h-screen bg-white/80 dark:bg-white/90">
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
              <Form />
            </div>
          } />
          <Route path="/confirmation" element={
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
              <ConfirmationPage />
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}


// psql postgresql://postgres:postgres@127.0.0.1:54322/postgres command to connect to the database
