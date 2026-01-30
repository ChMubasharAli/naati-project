import React, { useState } from "react";
import { Search, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDialogues } from "../../../api/dialogues";
import { queryKeys } from "../../../lib/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const ShowAllRapidDialogues = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Use React Query to fetch dialogues
  const {
    data: dialoguesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.dialogues.list(),
    queryFn: fetchDialogues,
  });

  // Extract dialogues from response
  const dialogues = dialoguesData?.data?.dialogues || [];

  // Filter dialogues based on user's preferred language and search term
  const filteredDialogues = dialogues.filter((dialogue) => {
    // Match user's preferred language with dialogue's language code
    const matchesUserLanguage =
      user?.preferredLanguage &&
      dialogue.Language?.langCode === user.preferredLanguage;

    const matchesSearch = dialogue.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesUserLanguage && matchesSearch;
  });

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

  return (
    <div className="p-6 bg-white  max-h-[calc(100vh-64px)] lg:max-h-screen h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Rapid Review Dialogues
        </h1>
        <p className="text-gray-600">
          Choose a dialogue for rapid review practice
        </p>
      </div>

      {/* Search Bar Only - Language Filter Removed */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search dialogues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 left-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dialogue
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
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading dialogues...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-red-500">
                  Failed to load dialogues. Please try again.
                </td>
              </tr>
            ) : !user?.preferredLanguage ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-amber-600"
                >
                  Please set your preferred language in your profile to see
                  dialogues.
                </td>
              </tr>
            ) : filteredDialogues.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm
                    ? `No dialogues found matching "${searchTerm}" in ${user.preferredLanguage.toUpperCase()}`
                    : `No dialogues available in ${user.preferredLanguage.toUpperCase()}`}
                </td>
              </tr>
            ) : (
              filteredDialogues.map((dialogue) => (
                <tr
                  key={dialogue.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
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
                      </div>
                    </div>
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
                    <Link
                      to={`/user/rapid-review-dialogues?dialogueId=${dialogue.id}&examType=rapid_review&languageCode=${dialogue.Language?.langCode}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <Play size={16} fill="currentColor" />
                      Practice
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      {!isLoading && !isError && user?.preferredLanguage && (
        <div className="mt-4 text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredDialogues.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {
              dialogues.filter(
                (d) => d.Language?.langCode === user.preferredLanguage,
              ).length
            }
          </span>{" "}
          dialogues in {user.preferredLanguage.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ShowAllRapidDialogues;
