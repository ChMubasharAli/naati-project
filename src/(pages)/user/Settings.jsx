import React from "react";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../../components/LanguageSwither";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center py-20 text-gray-500">
          Loading user information...
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <User className="w-8 h-8 text-emerald-600" />
          Account Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your profile and preferences
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-emerald-600" />
              Profile Information
            </h2>

            <div className="space-y-6">
              {/* Name */}
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Full Name
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {user.name}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {user.phone}
                  </div>
                </div>
              </div>

              {/* NAATI Exam Date */}
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    NAATI CCL Exam Date
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatDate(user.naatiCclExamDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Actions */}
        <div className="flex flex-col justify-between">
          {/* Language Switcher Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Language Preferences
            </h2>

            {/* Language Switcher with Updated Styling */}
            <LanguageSwitcher />
          </div>

          {/* Subscription Management Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Subscription
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Manage your subscription plan and billing information
                </p>
              </div>
              <Link
                to={"/user/user-subscriptions"}
                className="w-full inline-block py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="container mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          Account Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verification Status */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Verification Status
            </div>
            {user.isVerified ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600">
                    Verified
                  </div>
                  <div className="text-xs text-gray-600">
                    Your account is verified
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-red-600">
                    Not Verified
                  </div>
                  <div className="text-xs text-gray-600">
                    Please verify your account
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Role */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account Type
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 capitalize">
                  {user.role}
                </div>
                <div className="text-xs text-gray-600">Role type</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
