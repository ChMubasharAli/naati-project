import React from "react";
import {
  Calendar,
  TrendingUp,
  Award,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";
import { useQuery } from "@tanstack/react-query";

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

const UserDashboard = () => {
  const { user: loggedInUser } = useAuth();

  // TanStack Query se dashboard data fetch karna
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dashboardData", loggedInUser.id],
    queryFn: async () => {
      if (!loggedInUser.id) {
        throw new Error("User ID not available");
      }

      const response = await apiClient.get(
        `/api/v1/dashboard/users/${loggedInUser.id}/kpis`,
      );
      const data = response.data;

      if (!data.success) {
        throw new Error("Failed to fetch dashboard data");
      }

      return data.data;
    },
    enabled: !!loggedInUser.id, // Sirf tab fetch kare jab user id available ho
    retry: 2, // 2 baar retry kare agar fail ho
    staleTime: 5 * 60 * 1000, // 5 minutes tak data fresh rahega
  });

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (isError || !dashboardData) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center py-20 text-gray-500">
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  const { user, kpis } = dashboardData;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get day name from date
  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  return (
    <div className="space-y-6 container mx-auto py-2 flex flex-col ">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-700">
              Your NAATI CCL exam is on{" "}
              <span className="font-semibold text-emerald-600">
                {formatDate(user.naatiCclExamDate)}
              </span>
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Award className="w-16 h-16 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Exam Countdown */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:border-red-400 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-5xl font-bold text-red-600 mb-2">
            {kpis.examCountdownDaysLeft !== null
              ? kpis.examCountdownDaysLeft
              : "--"}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Days Until Exam
          </div>
          {kpis.examCountdownDaysLeft !== null && (
            <div className="mt-3 text-xs text-gray-500">
              Countdown: {kpis.examCountdownDaysLeft} days left
            </div>
          )}
        </div>

        {/* Practice Days */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {kpis.practiceDays}
          </div>
          <div className="text-sm font-medium text-gray-600">Practice Days</div>
          <div className="mt-3 text-xs text-gray-500">
            Practicing since {kpis.daysSinceSignup} days ago
          </div>
        </div>

        {/* Today's Average */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Target className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-5xl font-bold text-emerald-600 mb-2">
            {kpis.scoresOutOf90.todayAverage !== null
              ? kpis.scoresOutOf90.todayAverage.toFixed(1)
              : "--"}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Today's Average
          </div>
          <div className="mt-3 text-xs text-gray-500">Out of 90</div>
        </div>

        {/* Highest Score */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Award className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {kpis.scoresOutOf90.highest !== null
              ? kpis.scoresOutOf90.highest.toFixed(1)
              : "--"}
          </div>
          <div className="text-sm font-medium text-gray-600">Highest Score</div>
          <div className="mt-3 text-xs text-gray-500">Personal best</div>
        </div>
      </div>

      {/* Tests Overview & Weekly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Test Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                Total Tests
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {kpis.tests.total}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <span className="text-sm font-medium text-yellow-700">
                Pending
              </span>
              <span className="text-2xl font-bold text-yellow-600">
                {kpis.tests.pending}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <span className="text-sm font-medium text-green-700">
                Completed
              </span>
              <span className="text-2xl font-bold text-green-600">
                {kpis.tests.completed}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Weekly Performance
              </h3>
              <p className="text-xs text-gray-500">
                Average:{" "}
                {kpis.scoresOutOf90.weeklyAverage !== null
                  ? `${kpis.scoresOutOf90.weeklyAverage.toFixed(1)}/90`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {kpis.scoresOutOf90.weeklyDaily.map((day, index) => {
              const score = day.avgOutOf90;
              const heightPercent = score !== null ? (score / 90) * 100 : 0;
              const hasScore = score !== null;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    {hasScore ? (
                      <>
                        <div className="text-xs font-bold text-emerald-600 mb-1">
                          {score.toFixed(1)}
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </>
                    ) : (
                      <div className="w-full h-2 bg-gray-200 rounded-lg"></div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    {getDayName(day.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Practice */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Recent Practice</h3>
        </div>

        {kpis.recentPractice && kpis.recentPractice.length > 0 ? (
          <div className="space-y-3">
            {kpis.recentPractice.map((practice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {practice.title}
                    </div>
                    <div className="text-xs text-gray-500">{practice.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">
                    {practice.score}
                  </div>
                  <div className="text-xs text-gray-500">{practice.date}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent practice found</p>
            <p className="text-sm text-gray-400 mt-2">
              Start practicing to see your progress here
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={() => refetch()} // TanStack Query ka refetch function
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
