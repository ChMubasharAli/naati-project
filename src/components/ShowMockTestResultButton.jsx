// components/ShowMockTestResultButton.jsx

import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Loader, Alert } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ShowMockTestResultButton = () => {
  const { user } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);

  // React Query for fetching previous results
  const {
    data: resultsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mockTestResults", user?.id],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/mock-tests/users/${user?.id}/final-results`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      return response.json();
    },
    enabled: opened && Boolean(user?.id), // Only fetch when modal is open and user exists
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return (
    <>
      {/* Button to open modal */}
      <Button
        onClick={open}
        leftSection={<HistoryIcon size={16} />}
        color="orange"
        size="lg"
        className="ml-2"
        radius={"md"}
      >
        Get Previous Results
      </Button>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Previous Mock Test Results"
        size="lg"
        radius={"lg"}
        centered
        overlayProps={{
          blur: 3,
        }}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="lg" />
            </div>
          ) : isError ? (
            <Alert
              color="red"
              title="Error"
              icon={<History size={16} />}
              className="mb-4"
            >
              {error?.message || "Failed to load results. Please try again."}
            </Alert>
          ) : resultsData?.data?.length === 0 ? (
            <Alert
              color="yellow"
              title="No Results Found"
              icon={<History size={16} />}
            >
              You haven't completed any mock tests yet.
            </Alert>
          ) : (
            <div className="space-y-4">
              {resultsData?.data?.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Header with test info */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {result.MockTest?.title || "Mock Test"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Completed on{" "}
                        {new Date(result.computedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          result.passed
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </div>

                  {/* Score Summary */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Total Score</p>
                      <p className="text-xl font-bold text-gray-900">
                        {result.totalScore}/{result.outOf}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pass Marks: {result.passMarks}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Dialogue Scores</p>
                      <div className="flex justify-between text-sm">
                        <span>D1: {result.dialogue1Score}</span>
                        <span>D2: {result.dialogue2Score}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Out of: {result.perDialogueOutOf} each
                      </p>
                    </div>
                  </div>

                  {/* Averages */}
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Average Scores:
                    </h5>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(result.averages || {}).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-blue-50 p-2 rounded text-center"
                          >
                            <p className="text-xs text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                              {typeof value === "number"
                                ? value.toFixed(1)
                                : value}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Overall Feedback */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Overall Feedback:
                    </h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {result.overallFeedback || "No feedback available."}
                    </p>
                  </div>

                  {/* Session Details */}
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>
                        Duration:{" "}
                        {Math.floor(
                          result.MockTestSession?.completedSeconds / 60,
                        )}
                        m {result.MockTestSession?.completedSeconds % 60}s
                      </span>
                      <span>
                        Started:{" "}
                        {new Date(
                          result.MockTestSession?.startedAt,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Meta information */}
          {resultsData?.meta && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              Showing page {resultsData.meta.page} of{" "}
              {resultsData.meta.totalPages} ({resultsData.meta.total} total
              results)
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => {
              refetch();
            }}
            disabled={isLoading}
          >
            Refresh Data
          </Button>
          <Button onClick={close} variant="light" color="blue">
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ShowMockTestResultButton;
