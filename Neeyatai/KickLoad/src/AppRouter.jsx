import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axiosInstance, { setNavigate } from "./api/axiosInstance";
import UserGuidePage from "./pages/UserGuidePage";
import Dashboard from "./pages/Dashboard";
import IntelligentTestAnalysis from "./pages/IntelligentTestAnalysis";
import TestPlanGeneration from "./pages/TestPlanGeneration";
import GatlingTestGeneration from "./pages/GatlingTestGeneration";
import RunTestPage from "./pages/RunTestPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotAndResetPasswordPage from "./pages/ForgotAndResetPasswordPage";
import Layout from "./Layout";
import PaymentPage from "./pages/Payment/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import VerifiedPopup from "./components/VerifiedPopup";
import PerformanceComparison from "./pages/PerformanceComparison";
import JenkinsTriggerForm from "./pages/JenkinsTriggerForm";

import GithubSuccessPage from "./components/GitHubSuccess";
import ApiIntegration from "./pages/ApiIntegration";
import ApiDocsPage from "./pages/ApiDocsPage";
import PoweringNeeyatAIVision from "./pages/PoweringNeeyatAIVision";

const AppRouter = () => {
  const [user, setUser] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginTriggered, setLoginTriggered] = useState(false);
  const navigate = useNavigate();
  const [initialPath] = useState(window.location.pathname);

  const evaluateLicense = (data) => {
    const now = new Date();
    const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const paidEnd = data.paid_ends_at ? new Date(data.paid_ends_at) : null;
    if (paidEnd && paidEnd > now) return "paid";
    if (trialEnd && trialEnd > now) return "trial";
    return "expired";
  };

  // Auth initialization
  useEffect(() => {
    const initAuth = async () => {
      setNavigate(navigate);
      setLoading(true);
      const rememberMe = localStorage.getItem("rememberMe") === "true";
      const storedUser = rememberMe
        ? localStorage.getItem("user")
        : sessionStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLicenseStatus(evaluateLicense(parsedUser));
        localStorage.setItem("isAuthenticated", "true");
      } else if (rememberMe) {
        try {
          await axiosInstance.post("/refresh");
          const refreshedUser = localStorage.getItem("user");
          if (refreshedUser) {
            const parsedUser = JSON.parse(refreshedUser);
            setUser(parsedUser);
            setLicenseStatus(evaluateLicense(parsedUser));
            localStorage.setItem("isAuthenticated", "true");
          } else {
            setUser(null);
            setLicenseStatus(null);
          }
        } catch (err) {
          console.warn("Token refresh failed. Redirecting to login.");
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          setLicenseStatus(null);
        }
      } else {
        localStorage.removeItem("isAuthenticated");
        setUser(null);
        setLicenseStatus(null);
      }

      setLoading(false);
    };

    initAuth();
  }, [navigate, loginTriggered]);

  useEffect(() => {
    if (!loading && window.location.pathname === "/") {
      const publicPaths = ["/login", "/signup", "/forgot-password", "/verify"];
      const current = window.location.pathname;
      const isPublic = publicPaths.some((p) => current.startsWith(p));
      if (!isPublic) {
        navigate("/login", { replace: true });
      }
    }
  }, [loading, navigate]);


  const handleLoginSuccess = (userData) => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";

    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }

    localStorage.setItem("isAuthenticated", "true");
    setUser(userData);
    setLicenseStatus(evaluateLicense(userData));
    setLoginTriggered((prev) => !prev);

    const publicPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/verified-popup",
    ];
    const redirectTo = publicPaths.includes(initialPath)
      ? "/dashboard"
      : initialPath;

    navigate(redirectTo);
  };

  const isAuthenticated = !!user;

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/logout");  // hit backend to clear JWT cookies
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setLicenseStatus(null);
      navigate("/login");
    }
  };

  if (loading) return null;

  const ProtectedRoute = ({ children, requireActiveLicense = true }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (requireActiveLicense && licenseStatus === "expired") {
      return <Navigate to="/payment" replace />;
    }

    return children;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/signup"
        element={
          !isAuthenticated ? (
            <SignupPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/help/Neeyataivision" element={<PoweringNeeyatAIVision />} />

      <Route path="/verify" element={<VerifiedPopup />} />

      <Route path="/github/success" element={<GithubSuccessPage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />

      <Route
        path="/forgot-password"
        element={
          !isAuthenticated ? (
            <ForgotAndResetPasswordPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        element={
          <Layout licenseStatus={licenseStatus} onLogout={handleLogout} />
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intelligent-test-analysis"
          element={
            <ProtectedRoute>
              <IntelligentTestAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-plan-generation"
          element={
            <ProtectedRoute>
              <TestPlanGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gatling"
          element={
            <ProtectedRoute>
              <GatlingTestGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/run-test"
          element={
            <ProtectedRoute>
              <RunTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute requireActiveLicense={false}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
  path="/user-guide"
  element={
    <ProtectedRoute requireActiveLicense={false}>
      <UserGuidePage />
    </ProtectedRoute>
  }
/>

        <Route
          path="/performance-comparison"
          element={
            <ProtectedRoute>
              <PerformanceComparison />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jenkins-integration"
          element={
            <ProtectedRoute>
              <JenkinsTriggerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-integration"
          element={
            <ProtectedRoute>
              <ApiIntegration />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-All */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
