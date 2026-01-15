import { Link, useNavigate } from "react-router-dom";
import errorPageImage from "../assets/errorPageImage.svg";

const Unauthorized = () => {
  const navigate = useNavigate();

  // Trigger animation on mount

  return (
    <div className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-7xl lg:text-7xl font-extrabold text-accent">
                Access Denied
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800">
                Unauthorized Access
              </h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                Sorry, you don’t have permission to access this page. Please log
                in with the correct account or contact support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition-all duration-200 hover:scale-105 shadow-md"
                aria-label="Return to login page"
              >
                Go to Home
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="inline-block px-6 py-3 border border-accent text-accent font-semibold rounded-md hover:bg-accent hover:text-white hover:border-accent-hover transition-all duration-200"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <img
                src={errorPageImage} // Replace with your errorPageImage path
                alt="Unauthorized Illustration"
                className={`w-full max-w-md h-auto object-contain lg:scale-125 transition-all duration-500`}
              />
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent/60 rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-primary/40 rounded-full"></div>
              <div className="absolute top-1/2 -left-8 w-6 h-6 bg-secondary/50 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
