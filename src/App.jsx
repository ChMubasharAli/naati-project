import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  AdminProtectedRoute,
  LoginProtectedRoute,
  UserProtectedRoute,
} from "./components/ProtectedRoutes";
import AdminLayout from "./components/AdminLayout";
import UserLayout from "./components/UserLayout";
import AdminDashboard from "./(pages)/admin/Dashboard";
import UserDashboard from "./(pages)/user/Dashboard";
import NotFound from "./components/NotFound";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyOTP from "./components/auth/VerifyOTP";
import Languages from "./(pages)/admin/Languages";
import Domains from "./(pages)/admin/Domains";
import Dialogues from "./(pages)/admin/Dialogues";
import Segments from "./(pages)/admin/Segments";
import Users from "./(pages)/admin/Users";
import ResetPassword from "./components/auth/ResetPassword";
import Contact from "./components/contact-us/Contact";
import ScrollToTop from "./components/ScrollToTop";
import Courses from "./components/subscriptions/Subscriptions";
import PracticeDialogue from "./(pages)/user/PracticeDialogue";
import ShowAllDomans from "./(pages)/user/ShowAllDialogues";
import ShowAllDialogues from "./(pages)/user/ShowAllDialogues";
import RapidReview from "./(pages)/user/rapid-review/RapidReview";
import ShowAllRapidDialogues from "./(pages)/user/rapid-review/ShowAllRapidDialogues";
import PaymentSuccess from "./components/stripe-pages/PaymentSuccess";
import PaymentFailure from "./components/stripe-pages/PaymentFailure";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes  */}

        <Route
          path="/"
          element={
            <LoginProtectedRoute>
              {/* <LoginPage /> */}
              <Home />
            </LoginProtectedRoute>
          }
        />
        <Route
          path="/contact-us"
          element={
            <LoginProtectedRoute>
              <Contact />
            </LoginProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <LoginProtectedRoute>
              <Courses />
            </LoginProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            <LoginProtectedRoute>
              <Login />
            </LoginProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <LoginProtectedRoute>
              <Signup />
            </LoginProtectedRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <LoginProtectedRoute>
              <ForgotPassword />
            </LoginProtectedRoute>
          }
        />

        <Route
          path="/verify-otp"
          element={
            <LoginProtectedRoute>
              <VerifyOTP />
            </LoginProtectedRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <LoginProtectedRoute>
              <ResetPassword />
            </LoginProtectedRoute>
          }
        />

        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="languages" element={<Languages />} />
            <Route path="domains" element={<Domains />} />
            <Route path="dialogues" element={<Dialogues />} />
            <Route path="segments" element={<Segments />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>

        {/* Users Routes  */}

        <Route element={<UserProtectedRoute />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="dialogues" element={<ShowAllDialogues />} />
            <Route path="practice-dialogue" element={<PracticeDialogue />} />
            <Route path="rapid-review" element={<ShowAllRapidDialogues />} />
            <Route path="rapid-review-dialogues" element={<RapidReview />} />
            <Route path="subscriptions" element={<Courses />} />
          </Route>
        </Route>

        {/* Stripe payment routes success and failure  */}
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/failure" element={<PaymentFailure />} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
