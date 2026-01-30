// src/components/AdminDashboard.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  MessageCircle,
  Globe,
  CreditCard,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Import API functions
import { getDashboardData, formatCurrency } from "../../api/admin";
// Import query keys
import { queryKeys } from "../../lib/react-query";

// Reusable Loading Skeleton Component (Moved outside)
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6"
        >
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gray-300 rounded-2xl"></div>
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Reusable Error State Component (Moved outside)
const ErrorState = ({ error, refetch }) => (
  <div className="p-6 bg-white rounded-2xl shadow-lg border border-red-200">
    <div className="text-center py-10">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Failed to Load Dashboard
      </h3>
      <p className="text-gray-600 mb-6">
        {error?.message || "An error occurred while loading dashboard data"}
      </p>
      <button
        onClick={() => refetch()}
        className="px-6 py-2.5 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
      >
        Retry
      </button>
    </div>
  </div>
);

// Reusable Stat Card Component (Moved outside)
const StatCard = ({ icon, value, label, color, iconBg, iconShadow }) => (
  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:border-emerald-400 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-14 h-14 bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center shadow-lg ${iconShadow}`}
      >
        {icon}
      </div>
      <TrendingUp className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="text-4xl font-bold text-gray-900 mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-medium text-gray-600">{label}</div>
  </div>
);

// Reusable Stat Box Component (Moved outside)
const StatBox = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-5 border border-emerald-200">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
  </div>
);

// Main Dashboard Component
const AdminDashboard = () => {
  /**
   * TanStack Query for fetching dashboard data
   */
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [queryKeys.admin, "dashboard"],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Render states
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState error={error} refetch={refetch} />;
  if (!dashboardData?.success)
    return <ErrorState error={error} refetch={refetch} />;

  const { totals, top } = dashboardData;

  return (
    <div className="space-y-6  p-6 max-h-[calc(100dvh-64px)] lg:max-h-screen h-full overflow-hidden flex flex-col ">
      {/* Header */}
      {/* <div className="flex items-center gap-2 justify-end">
        {isRefetching && (
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
        )}
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="px-4 py-2 bg-white cursor-pointer shadow hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div> */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <StatCard
          icon={<Users className="w-7 h-7 text-white" />}
          value={totals.users}
          label="Total Users"
          color="emerald"
          iconBg="from-emerald-500 to-teal-500"
          iconShadow="shadow-emerald-200"
        />

        {/* Active Subscriptions */}
        <StatCard
          icon={<CreditCard className="w-7 h-7 text-white" />}
          value={totals.activeSubscriptions}
          label="Active Subscriptions"
          color="blue"
          iconBg="from-blue-500 to-cyan-500"
          iconShadow="shadow-blue-200"
        />

        {/* Total Dialogues */}
        <StatCard
          icon={<MessageCircle className="w-7 h-7 text-white" />}
          value={totals.dialogues}
          label="Total Dialogues"
          color="purple"
          iconBg="from-purple-500 to-pink-500"
          iconShadow="shadow-purple-200"
        />

        {/* Total Languages */}
        <StatCard
          icon={<Globe className="w-7 h-7 text-white" />}
          value={totals.languages}
          label="Languages"
          color="orange"
          iconBg="from-orange-500 to-red-500"
          iconShadow="shadow-orange-200"
        />
      </div>

      {/* Transaction Stats */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction Overview
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatBox
            label="Total Transactions"
            value={totals.transactions.totalCount}
            color="gray"
          />
          <StatBox
            label="Paid Transactions"
            value={totals.transactions.paidCount}
            color="green"
          />
          <StatBox
            label="Total Revenue (Cents)"
            value={totals.transactions.paidMoneyCents.toLocaleString()}
            color="gray"
          />
          <StatBox
            label="Total Revenue"
            value={formatCurrency(totals.transactions.paidMoneyCents)}
            color="emerald"
          />
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto rounded-2xl">
        {/* Top Used Dialogues */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6  overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Top Dialogues</h3>
          </div>
          {top.usedDialogues && top.usedDialogues.length > 0 ? (
            <div className="space-y-3">
              {top.usedDialogues.map((dialogue, index) => (
                <div
                  key={dialogue.dialogueId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {dialogue.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {dialogue.dialogueId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {dialogue.attempts}
                    </div>
                    <div className="text-xs text-gray-500">attempts</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Top Used Languages */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Top Languages</h3>
          </div>
          {top.usedLanguages && top.usedLanguages.length > 0 ? (
            <div className="space-y-3">
              {top.usedLanguages.map((language, index) => (
                <div
                  key={language.languageId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {language.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {language.langCode.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {language.attempts}
                    </div>
                    <div className="text-xs text-gray-500">attempts</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Top Performer Users */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
          </div>
          {top.performerUsers && top.performerUsers.length > 0 ? (
            <div className="space-y-3">
              {top.performerUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        User #{user.userId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.attempts} attempts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600">
                      {user.avgFinalScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">avg score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-emerald-600" />
            <span className="text-sm font-medium text-gray-600">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Data updates automatically every 5 minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
