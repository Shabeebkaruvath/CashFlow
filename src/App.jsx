import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Income from "./pages/Income";
import Expense from "./pages/Expence";
import Navbar from "./components/Navbar";
import Signup from "./pages/Signin";
import Login from "./pages/Login";
import UserProfile from "./pages/settings/Profile";
import InitialBankBalance from "./pages/settings/InitialBB";
import DayRecordChecker from "./pages/settings/Dailydata";
import CategoryRecords from "./pages/settings/Categories";
import HistoricalData from "./pages/settings/HistoricalData";
import Downloads from "./pages/settings/Download";
import LogoutConfirm from "./pages/settings/Logout";

 
import { useNavigate } from "react-router-dom";

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
    const navigate = useNavigate();

  const authRoutes = ["/login", "/signup"];
  const isAuthPage = authRoutes.includes(location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className={isAuthPage ? "min-h-screen" : "pt-0  "}>
      {!isAuthPage && <Navbar />}

      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/income"
          element={user ? <Income /> : <Navigate to="/login" />}
        />
        <Route
          path="/expense"
          element={user ? <Expense /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings/profile"
          element={user ? <UserProfile /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings/download"
          element={user ? <Downloads /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings/initial-balance"
          element={user ? <InitialBankBalance /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings/daily-records"
          element={user ? <DayRecordChecker /> : <Navigate to="/login" />}
        />
         
        <Route
          path="/settings/categories"
          element={user ? <CategoryRecords /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings/history-data"
          element={user ? <HistoricalData /> : <Navigate to="/login" />}
        />
        HistoricalData
        <Route
          path="/settings/logout"
          element={
            user ? (
              <LogoutConfirm onCancel={() => navigate(-1)} /> // Go back one page
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
