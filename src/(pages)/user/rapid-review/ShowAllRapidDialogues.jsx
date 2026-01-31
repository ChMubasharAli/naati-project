import React, { useState } from "react";
import {
  Search,
  Play,
  Lock,
  Filter,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDialogues } from "../../../api/dialogues";
import { queryKeys } from "../../../lib/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const ShowAllDialogues = () => {
  const { user, userLanguage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Use React Query to fetch dialogues
  const {
    data: dialoguesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.dialogues.list(),
    queryFn: () => fetchDialogues(user?.id, userLanguage?.id),
    enabled: Boolean(user?.id && userLanguage?.id),
    retry: 2,
    retryDelay: 1000,
  });

  // Extract data from response
  const dialogues = dialoguesData?.data?.dialogues || [];
  const isSubscribed = dialoguesData?.isSubscribed || false;
  const rapidReviewRemaining =
    dialoguesData?.limits?.rapid_review?.limitRemaining || 0;
  const hasRapidReviewAccess = isSubscribed || rapidReviewRemaining > 0;

  // Filter dialogues based on search term, status, and difficulty
  const filteredDialogues = dialogues.filter((dialogue) => {
    // Search filter
    const matchesSearch = dialogue.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || dialogue.status === statusFilter;

    // Difficulty filter
    const matchesDifficulty =
      difficultyFilter === "all" || dialogue.difficulty === difficultyFilter;

    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Get status counts
  const statusCounts = {
    all: dialogues.length,
    not_started: dialogues.filter((d) => d.status === "not_started").length,
    in_progress: dialogues.filter((d) => d.status === "in_progress").length,
    completed: dialogues.filter((d) => d.status === "completed").length,
  };

  // Difficulty badge colors
  const getDifficultyStyle = (difficulty) => {
    const styles = {
      easy: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      hard: "bg-red-100 text-red-700",
    };
    return styles[difficulty] || styles.easy;
  };

  // Format duration (seconds to minutes:seconds)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Status badge colors
  const getStatusStyle = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      in_progress: "bg-blue-100 text-blue-700",
      not_started: "bg-gray-100 text-gray-700",
    };
    return styles[status] || styles.not_started;
  };

  // Format status text for display
  const formatStatusText = (status) => {
    const statusMap = {
      completed: "Completed",
      in_progress: "In Progress",
      not_started: "Not Started",
    };
    return statusMap[status] || status;
  };

  // Check if practice button should be enabled
  const isPracticeEnabled = () => {
    if (isSubscribed) return true;
    return rapidReviewRemaining > 0;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Dialogues
        </h1>
        <p className="text-gray-600">
          Choose a dialogue to practice your NAATI CCL skills
        </p>

        {/* Trial Status Header - Exactly like reference code */}
        {!isLoading && !isError && !isSubscribed && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-amber-800 mb-1">
                  <span className="font-semibold">Trial Status:</span>{" "}
                  <span className="ml-2">
                    {rapidReviewRemaining > 0 ? (
                      <span className="text-amber-700">
                        ({rapidReviewRemaining} rapid review
                        {rapidReviewRemaining === 1 ? "" : "s"} left)
                      </span>
                    ) : (
                      <span className="text-red-600">
                        (No trial attempts left)
                      </span>
                    )}
                  </span>
                </div>

                {/* Message based on trial status */}
                {rapidReviewRemaining > 0 ? (
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
                {rapidReviewRemaining === 0 && (
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

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search dialogues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">
              Not Started ({statusCounts.not_started})
            </option>
            <option value="in_progress">
              In Progress ({statusCounts.in_progress})
            </option>
            <option value="completed">
              Completed ({statusCounts.completed})
            </option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Difficulty Filter Dropdown */}
        <div className="relative">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dialogue
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Domain
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
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading dialogues...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-red-500">
                  Failed to load dialogues. Please try again.
                </td>
              </tr>
            ) : filteredDialogues.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No dialogues found
                </td>
              </tr>
            ) : (
              filteredDialogues.map((dialogue) => {
                const canPractice = isPracticeEnabled();

                return (
                  <tr
                    key={dialogue.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: dialogue.Domain?.colorCode + "20",
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{
                              backgroundColor: dialogue.Domain?.colorCode,
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {dialogue.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dialogue.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(
                          dialogue.status,
                        )}`}
                      >
                        {formatStatusText(dialogue.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getDifficultyStyle(
                          dialogue.difficulty,
                        )}`}
                      >
                        {dialogue.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                        {dialogue.Language?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatDuration(dialogue.duration)} mins
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {dialogue.Domain?.title || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canPractice ? (
                        <Link
                          to={`/rapid-review-dialogues?dialogueId=${dialogue.id}&examType=rapid_review&languageCode=${dialogue.Language?.langCode}&languageName=${dialogue.Language?.name}${dialogue.status === "completed" ? "&new=true" : ""}`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                        >
                          <Play size={16} fill="currentColor" />
                          Practice
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-lg opacity-70 cursor-not-allowed"
                          title="Free trial ended. Please switch language or buy subscription."
                        >
                          <Lock size={16} />
                          Practice
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

      {/* Footer Info */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Results Count */}
        {!isLoading && !isError && (
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredDialogues.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {dialogues.length}
            </span>{" "}
            dialogues
          </div>
        )}

        {/* Active Filters Info */}
        {(statusFilter !== "all" || difficultyFilter !== "all") && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {statusFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700">
                Status: {formatStatusText(statusFilter)}
              </span>
            )}
            {difficultyFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700">
                Difficulty: {difficultyFilter}
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter("all");
                setDifficultyFilter("all");
              }}
              className="text-xs text-gray-500 hover:text-emerald-600"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowAllDialogues;
