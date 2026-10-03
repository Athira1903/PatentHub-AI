import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Obsolete Login OTP Verification Page.
 * PatentHub AI uses email OTP verification during registration only.
 * Any direct access redirects to /login.
 */
export const LoginOtpPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};
