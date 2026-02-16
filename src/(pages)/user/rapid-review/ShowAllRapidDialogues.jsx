import React, { useState } from "react";
import { Search, Play, Lock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://api.prepsmart.au/api/v1";

const fetchRapidReviews = async (userId, languageId) => {
  const response = await axios.get(
    `${API_BASE_URL}/rapid-review?languageId=${languageId}&userId=${userId}`,
  );
  return response.data;
};

const ShowAllRapidReviews = () => {
  const { user: logedInUser, userLanguage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch rapid reviews data
  const {
    data: rapidReviewData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rapidReviews", logedInUser?.id, userLanguage?.id],
    queryFn: () => fetchRapidReviews(logedInUser?.id, userLanguage?.id),
    enabled: Boolean(logedInUser?.id && userLanguage?.id),
    retry: 2,
    retryDelay: 1000,
  });

  // Extract data from response
  const rapidReviews = rapidReviewData?.data?.rapidReviews || [];
  const isSubscribed = rapidReviewData?.data?.isSubscribed || false;
  const dailyRemaining = rapidReviewData?.data?.dailyRemaining || 0;
  const dailyDone = rapidReviewData?.data?.dailyDone || 0;
  const dailyLimit = rapidReviewData?.data?.dailyLimit || 5;

  // Check if user has access to practice
  const hasAccess = isSubscribed || dailyRemaining > 0;

  // Filter rapid reviews based on search term (title only)
  const filteredReviews = rapidReviews.filter((review) =>
    review.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapid Review</h1>
        <p className="text-gray-600">
          Choose a rapid review to practice your NAATI CCL skills
        </p>

        {/* Subscription Status Warning */}
        {!isLoading && !isError && !isSubscribed && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-amber-800 mb-1">
                  <span className="font-semibold">Trial Status:</span>{" "}
                  <span className="ml-2">
                    {dailyRemaining > 0 ? (
                      <span className="text-amber-700">
                        ({dailyRemaining} rapid review
                        {dailyRemaining === 1 ? "" : "s"} left today)
                      </span>
                    ) : (
                      <span className="text-red-600">
                        (Daily limit reached)
                      </span>
                    )}
                  </span>
                </div>

                {dailyRemaining > 0 ? (
                  <p className="text-xs text-amber-700">
                    You can practice {dailyRemaining} more rapid review
                    {dailyRemaining !== 1 ? "s" : ""} today. Choose wisely!
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-amber-700">
                      Your daily limit ({dailyLimit}) has been reached. Upgrade
                      to unlock unlimited access or try again tomorrow.
                    </p>
                    <div className="mt-2">
                      <Link
                        to="/user/subscriptions"
                        className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Upgrade to unlock unlimited access →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscribed User Info */}
        {!isLoading && !isError && isSubscribed && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-emerald-800 font-medium">
                Premium Active - Unlimited Access
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Filter Only */}
      <div className="mb-6">
        <div className="relative ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rapid reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Segments
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
                  colSpan="4"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading rapid reviews...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-red-500">
                  Failed to load rapid reviews. Please try again.
                </td>
              </tr>
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No rapid reviews found
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {review.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {review.segmentObjects?.length || 0} dialogue segments
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {review.language?.name || userLanguage?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {review.segments?.length || 0} segments
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {hasAccess ? (
                      <Link
                        to={`/rapid-review-dialogues?rapidReviewId=${review.id}&userId=${logedInUser?.id}&languageId=${userLanguage?.id}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <Play size={16} fill="currentColor" />
                        Practice Now
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-lg opacity-70 cursor-not-allowed"
                        title="Daily limit reached. Please upgrade or try again tomorrow."
                      >
                        <Lock size={16} />
                        Practice
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex justify-between items-center">
        {!isLoading && !isError && (
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredReviews.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {rapidReviews.length}
            </span>{" "}
            rapid reviews
          </div>
        )}

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
};

export default ShowAllRapidReviews;
