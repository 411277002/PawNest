import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/customer/Header';
import { Footer } from './components/customer/Footer';
import { FloatingBookingButton } from './components/customer/FloatingBookingButton';
import { HomePage } from './components/customer/HomePage';
import { ActivitiesPage } from './components/customer/ActivitiesPage';
import { ServicesPage } from './components/customer/ServicesPage';
import { StoresPage } from './components/customer/StoresPage';
import { ReviewsPage } from './components/customer/ReviewsPage';
import { ContactPage } from './components/customer/ContactPage';
import { CustomerLoginPage } from './components/customer/CustomerLoginPage';
import { BookingPage } from './components/customer/BookingPage';
import { ProfilePage } from './components/customer/ProfilePage';
import { PetProfilePage } from './components/customer/PetProfilePage';
import { MyBookingsPage } from './components/customer/MyBookingsPage';
import { clearAuth, getToken } from './services/api';

function hasLoginToken() {
  return Boolean(getToken());
}

export default function CustomerApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasLoginToken());

  useEffect(() => {
    const syncLoginState = () => setIsLoggedIn(hasLoginToken());
    window.addEventListener('storage', syncLoginState);
    window.addEventListener('pawnest-auth-change', syncLoginState);
    return () => {
      window.removeEventListener('storage', syncLoginState);
      window.removeEventListener('pawnest-auth-change', syncLoginState);
    };
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    clearAuth('customer');
    setIsLoggedIn(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf1]">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivitiesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/reviews" element={<ReviewsPage isLoggedIn={isLoggedIn} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/profile" replace /> : <CustomerLoginPage onLogin={handleLogin} />} />
          <Route path="/booking" element={isLoggedIn ? <BookingPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/pets" element={isLoggedIn ? <PetProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/my-bookings" element={isLoggedIn ? <MyBookingsPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingBookingButton isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  );
}
