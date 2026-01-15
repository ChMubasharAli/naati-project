// import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Admin-specific routes
export const AdminProtectedRoute = () => {
  // get data from the context
  const { user: logedInUser, token } = useAuth();

  console.log(logedInUser, token);

  if (!logedInUser || !token) {
    return <Navigate to={"/login"} replace />;
  }

  if (logedInUser.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// User-specific routes
export const UserProtectedRoute = () => {
  // get data from the context
  const { user: logedInUser, token } = useAuth();

  if (!logedInUser || !token) {
    return <Navigate to={"/login"} replace />;
  }

  if (logedInUser.role !== "user") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const LoginProtectedRoute = ({ children }) => {
  // get data from the context
  const { user: logedInUser, token } = useAuth();

  if (logedInUser && token) {
    if (logedInUser.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (logedInUser.role === "user") {
      return <Navigate to="/user" replace />;
    }
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  ); // agar login nahi hai to login page dikhao
};
