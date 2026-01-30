import React, { useState } from "react";
import { Search, Play, Lock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMockTests } from "../../../api/mockTests";
import { queryKeys } from "../../../lib/react-query";
import { useAuth } from "../../../context/AuthContext";

const ShowAllMockTests = () => {
  const { user, userLanguage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Use React Query to fetch mock tests
  const {
    data: mockTestsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.mockTests.list(),
    queryFn: () => fetchMockTests(user?.id, userLanguage?.id),
    enabled: Boolean(user?.id && userLanguage?.id),
    retry: 2,
    retryDelay: 1000,
  });

  // Extract data from response
  const mockTests = mockTestsData?.data || [];
  const isSubscribed = mockTestsData?.isSubscribed || false;
  const limitRemaining = mockTestsData?.limitRemaining || 0;
  const attemptCount = mockTestsData?.attemptCount || 0;
  const maxLimit = mockTestsData?.maxLimit || 1;

  // Filter mock tests based on search only
  const filteredMockTests = mockTests.filter((mockTest) => {
    return mockTest.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format duration (seconds to minutes)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} minutes`;
  };

  // Check if mock test can be accessed
  const canAccessMockTest = () => {
    if (isSubscribed) {
      return { accessible: true, reason: "subscribed" };
    }

    if (limitRemaining > 0) {
      return { accessible: true, reason: "trial_available" };
    }

    return { accessible: false, reason: "no_trial_left" };
  };

  const accessStatus = canAccessMockTest();
  const showTrialHeader = !isSubscribed && mockTests.length > 0;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Mock Tests
        </h1>
        <p className="text-gray-600">
          Complete mock tests with 2 dialogues each (20 minutes total)
        </p>

        {/* Trial Status Info - Only show if NOT subscribed AND mock tests exist */}
        {showTrialHeader && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-amber-800 mb-1">
                  <span className="font-semibold">Trial Status:</span>{" "}
                  {attemptCount} of {maxLimit} mock tests attempted
                  {limitRemaining > 0 ? (
                    <span className="ml-2 text-emerald-600">
                      ({limitRemaining} remaining)
                    </span>
                  ) : (
                    <span className="ml-2 text-red-600">
                      (No trial attempts left)
                    </span>
                  )}
                </div>

                {/* Message based on trial status */}
                {limitRemaining > 0 ? (
                  <p className="text-xs text-amber-700">
                    You can practice any one of the available mock tests. Choose
                    wisely!
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    Your trial for this language has ended. You can either
                    upgrade your subscription or switch to a different language
                    to continue practicing.
                  </p>
                )}

                {/* Upgrade link only when no attempts left */}
                {!isSubscribed && limitRemaining === 0 && (
                  <div className="mt-2">
                    <Link
                      to="/user/subscriptions"
                      className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Upgrade to unlock unlimited access →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar - Only show if mock tests exist */}
      {mockTests.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search mock tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Subscription Required Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Access Restricted
              </h3>
              <p className="text-gray-600 mb-4">
                Your trial for this language has ended. You've attempted{" "}
                {attemptCount} of {maxLimit} mock tests.
              </p>
              <p className="text-gray-600 mb-6">
                You can either upgrade your subscription or switch to a
                different language to continue practicing.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/user/subscriptions"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all text-center"
                  onClick={() => setShowPopup(false)}
                >
                  View Subscription Plans
                </Link>
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {mockTests.length === 0 && !isLoading && !isError ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Mock Tests Available
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            There are currently no mock tests available for this language.
            Please check back later or switch to a different language.
          </p>
          <Link
            to="/user"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mock Test
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Dialogues
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading mock tests...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-red-500"
                  >
                    Failed to load mock tests. Please try again.
                  </td>
                </tr>
              ) : filteredMockTests.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No mock tests found matching your search
                  </td>
                </tr>
              ) : (
                filteredMockTests.map((mockTest) => {
                  const canAccess = canAccessMockTest();

                  return (
                    <tr
                      key={mockTest.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "#3b82f620",
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{
                                backgroundColor: "#3b82f6",
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {mockTest.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Contains 2 complete dialogues
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700">
                            {mockTest.dialogue1?.title || "Dialogue 1"}
                          </div>
                          <div className="text-sm text-gray-700">
                            {mockTest.dialogue2?.title || "Dialogue 2"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          {mockTest.language?.name ||
                            `Language ${mockTest.languageId}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDuration(mockTest.durationSeconds)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {mockTest.totalMarks || 90} marks
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canAccess.accessible ? (
                          <Link
                            to={`/user/mock-test-practice?mockTestId=${mockTest.id}`}
                            className="inline-flex cursor-pointer items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                          >
                            <Play size={16} fill="currentColor" />
                            Practice Mock Test
                          </Link>
                        ) : (
                          <button
                            onClick={() => setShowPopup(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5
bg-linear-to-r from-gray-400 to-gray-500
hover:bg-linear-to-r hover:from-gray-600 hover:to-gray-700
text-white font-semibold rounded-lg opacity-80 cursor-pointer transition-all"
                          >
                            <Lock size={16} />
                            Practice Mock Test
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count - Only show if mock tests exist */}
      {!isLoading && !isError && mockTests.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredMockTests.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {mockTests.length}
          </span>{" "}
          mock tests
        </div>
      )}
    </div>
  );
};

export default ShowAllMockTests;
