import React, { useState, useRef } from "react";
import { BookOpen, Search, Play, Pause, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Import your existing APIs
import { fetchLanguages } from "../../api/languages";
import { fetchVocabularies } from "../../api/vocabulary";

// Import queryKeys from your existing setup
import { queryKeys } from "../../lib/react-query";
import { useAuth } from "../../context/AuthContext";

const VocabularyManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Audio states
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  // Define userId (you should get this from your auth system)
  const { user, userLanguage } = useAuth();

  // Fetch languages using React Query with your existing API
  const {
    data: languagesData = {},
    isLoading: languagesLoading,
    error: languagesError,
  } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch vocabularies without filter
  const {
    data: vocabulariesData = {},
    isLoading: vocabulariesLoading,
    error: vocabulariesError,
  } = useQuery({
    queryKey: queryKeys.vocabulary.list({
      userId: user?.id,
      languageId: userLanguage?.id,
    }),
    queryFn: () =>
      fetchVocabularies({ userId: user?.id, languageId: userLanguage?.id }),
    enabled: Boolean(user?.id && userLanguage?.id),
    retry: 2,
    retryDelay: 1000,
  });

  // Extract data from responses
  const languages = languagesData.data || [];
  const vocabularies = vocabulariesData.data || [];
  const isSubscribed = vocabulariesData.isSubscribed || false;

  // Audio control function
  const toggleAudio = (vocabId, audioType, url) => {
    if (!url) return;

    const audioKey = `${vocabId}-${audioType}`;

    if (!audioRefs.current[audioKey]) {
      audioRefs.current[audioKey] = new Audio(url);
      audioRefs.current[audioKey].onended = () => {
        setPlayingAudio(null);
      };
    }

    const audio = audioRefs.current[audioKey];

    if (playingAudio === audioKey) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Stop all other audios
      Object.keys(audioRefs.current).forEach((key) => {
        if (key !== audioKey && !audioRefs.current[key].paused) {
          audioRefs.current[key].pause();
          audioRefs.current[key].currentTime = 0;
        }
      });

      audio.play();
      setPlayingAudio(audioKey);
    }
  };

  // Filter vocabularies by search
  const filteredVocabularies = vocabularies.filter(
    (vocab) =>
      vocab.originalWord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.convertedWord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get language name
  const getLanguageName = (languageId) => {
    const lang = languages.find((l) => l.id === languageId);
    return lang ? lang.name : `Language #${languageId}`;
  };

  const isLoading = vocabulariesLoading;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Vocabulary Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View vocabulary words with audio pronunciations
          </p>
        </div>
      </div>

      {/* Show errors if any */}
      {vocabulariesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{vocabulariesError.message}</span>
          </div>
        </div>
      )}

      {/* Search Bar Only */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Original Word
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Converted Word
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Original Audio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Converted Audio
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && vocabularies.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading vocabularies...
                </td>
              </tr>
            ) : filteredVocabularies.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No vocabularies found
                </td>
              </tr>
            ) : (
              filteredVocabularies.map((vocab, index) => {
                // Check if this row should be blurred
                const shouldBlur = !isSubscribed && index >= 50;

                return (
                  <tr
                    key={vocab.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      shouldBlur ? "blur-sm opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {vocab.originalWord}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-emerald-600">
                        {vocab.convertedWord}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                        {getLanguageName(vocab.languageId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-600 max-w-xs truncate"
                        title={vocab.description}
                      >
                        {vocab.description || "-"}
                      </div>
                    </td>

                    {/* Original Audio Column */}
                    <td className="px-6 py-4">
                      {vocab.originalAudioUrl ? (
                        <button
                          onClick={() =>
                            toggleAudio(
                              vocab.id,
                              "original",
                              vocab.originalAudioUrl,
                            )
                          }
                          className={`flex items-center justify-center p-2 rounded-full transition-all ${
                            playingAudio === `${vocab.id}-original`
                              ? "bg-emerald-100 text-emerald-600"
                              : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                          }`}
                          title="Play original audio"
                        >
                          {playingAudio === `${vocab.id}-original` ? (
                            <span className="flex items-center gap-1 cursor-pointer">
                              <Pause size={18} /> Pause
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 cursor-pointer">
                              <Play size={18} /> Play
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No audio
                        </span>
                      )}
                    </td>

                    {/* Converted Audio Column */}
                    <td className="px-6 py-4">
                      {vocab.convertedAudioUrl ? (
                        <button
                          onClick={() =>
                            toggleAudio(
                              vocab.id,
                              "converted",
                              vocab.convertedAudioUrl,
                            )
                          }
                          className={`flex items-center justify-center p-2 rounded-full transition-all ${
                            playingAudio === `${vocab.id}-converted`
                              ? "bg-emerald-100 text-emerald-600"
                              : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                          }`}
                          title="Play converted audio"
                        >
                          {playingAudio === `${vocab.id}-converted` ? (
                            <span className="flex items-center gap-1 cursor-pointer">
                              <Pause size={18} /> Pause
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 cursor-pointer">
                              <Play size={18} /> Play
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No audio
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Total Count */}
      <div className="mt-4 text-sm text-gray-600">
        Total Vocabularies:{" "}
        <span className="font-semibold text-gray-900">
          {filteredVocabularies.length}
        </span>
        {!isSubscribed && filteredVocabularies.length > 50 && (
          <span className="ml-2 text-xs text-amber-600">
            (Showing first 50 entries. Subscribe to see all!)
          </span>
        )}
      </div>
    </div>
  );
};

export default VocabularyManagement;
