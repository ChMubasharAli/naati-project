import React, { useState } from "react";
import { Search, Filter, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDialogues } from "../../api/dialogues";
import { queryKeys } from "../../lib/react-query";
import { Link } from "react-router-dom";

const ShowAllDialogues = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");

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

  // Get unique languages for filter
  const languages = [...new Set(dialogues.map((d) => d.Language?.name))].sort();

  // Filter dialogues
  const filteredDialogues = dialogues.filter((dialogue) => {
    const matchesSearch = dialogue.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLanguage =
      !filterLanguage || dialogue.Language?.name === filterLanguage;
    return matchesSearch && matchesLanguage;
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
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Dialogues
        </h1>
        <p className="text-gray-600">
          Choose a dialogue to practice your NAATI CCL skills
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
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
            ) : filteredDialogues.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No dialogues found
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
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getDifficultyStyle(
                        dialogue.difficulty
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
                      to={`/user/practice-dialogue?dialogueId=${dialogue.id}&examType=complete_dialogue&languageCode=${dialogue.Language?.langCode}`}
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
      {!isLoading && !isError && (
        <div className="mt-4 text-sm text-gray-600">
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
    </div>
  );
};

export default ShowAllDialogues;
