import React, { useState } from "react";
import {
  Globe,
  Calendar,
  Clock,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Import your existing APIs

// Import queryKeys from your existing setup
import { queryKeys, showSuccessToast } from "../../lib/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  cancelSubscription,
  fetchUserSubscriptions,
} from "../../api/subscriptions";

const UserSubscriptions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [cancelModal, setCancelModal] = useState({
    open: false,
    subscription: null,
    cancelNow: false,
  });

  // Fetch subscriptions using React Query
  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: queryKeys.subscriptions.user(user?.id),
    queryFn: () => fetchUserSubscriptions(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: ({ subscriptionId, cancelNow }) =>
      cancelSubscription(subscriptionId, user?.id, cancelNow),
    onSuccess: (data, variables) => {
      const message = variables.cancelNow
        ? "Subscription canceled successfully!"
        : "Subscription scheduled for cancellation!";

      showSuccessToast(message);
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.user(user?.id),
      });
      closeCancelModal();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((item) => {
    if (filter === "all") return true;
    return item.subscription?.status === filter;
  });

  // Get count by status
  const getCounts = () => {
    const all = subscriptions.length;
    const active = subscriptions.filter(
      (s) => s.subscription?.status === "active",
    ).length;
    const canceled = subscriptions.filter(
      (s) => s.subscription?.status === "canceled",
    ).length;
    return { all, active, canceled };
  };

  const counts = getCounts();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Open cancel modal
  const openCancelModal = (subscription, cancelNow) => {
    setCancelModal({ open: true, subscription, cancelNow });
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setCancelModal({ open: false, subscription: null, cancelNow: false });
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!cancelModal.subscription || !user?.id) return;

    cancelMutation.mutate({
      subscriptionId: cancelModal.subscription.subscription.id,
      cancelNow: cancelModal.cancelNow,
    });
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      canceled: "bg-red-100 text-red-700 border-red-200",
    };

    const icons = {
      active: <CheckCircle size={14} />,
      canceled: <XCircle size={14} />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
          styles[status] || "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {icons[status] || <AlertCircle size={14} />}
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Subscriptions
        </h1>
        <p className="text-gray-600">
          Manage your active subscriptions and billing preferences
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setFilter("all")}
            disabled={isLoading}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              filter === "all"
                ? "text-emerald-600"
                : "text-gray-600 hover:text-gray-900"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            All
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
              {counts.all}
            </span>
            {filter === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>

          <button
            onClick={() => setFilter("active")}
            disabled={isLoading}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              filter === "active"
                ? "text-emerald-600"
                : "text-gray-600 hover:text-gray-900"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Active
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {counts.active}
            </span>
            {filter === "active" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>

          <button
            onClick={() => setFilter("canceled")}
            disabled={isLoading}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              filter === "canceled"
                ? "text-emerald-600"
                : "text-gray-600 hover:text-gray-900"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Canceled
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              {counts.canceled}
            </span>
            {filter === "canceled" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading subscriptions...
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {item?.subscription?.language?.name ||
                            "Unknown Language"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={item.subscription?.status || "unknown"}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(item.subscription?.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock size={14} className="text-gray-400" />
                      {formatDate(item.subscription?.currentPeriodEnd)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {item.subscription?.status === "active" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCancelModal(item, false)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel at Period End
                        </button>
                        <button
                          onClick={() => openCancelModal(item, true)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel Now
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        No actions available
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {filteredSubscriptions.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-900">
          {subscriptions.length}
        </span>{" "}
        subscriptions
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && cancelModal.subscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm Cancellation
                </h3>
              </div>
              <button
                onClick={closeCancelModal}
                disabled={cancelMutation.isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Subscription</div>
                <div className="text-lg font-bold text-gray-900">
                  {cancelModal.subscription.subscription?.language?.name ||
                    "Unknown"}
                </div>
              </div>

              {cancelModal.cancelNow ? (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-900 mb-1">
                        Cancel Immediately
                      </div>
                      <div className="text-sm text-red-700">
                        Your subscription will be canceled right away. You will
                        lose access immediately and no refund will be issued.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-orange-900 mb-1">
                        Cancel at Period End
                      </div>
                      <div className="text-sm text-orange-700">
                        You can continue using this subscription until{" "}
                        <strong>
                          {formatDate(
                            cancelModal.subscription.subscription
                              ?.currentPeriodEnd,
                          )}
                        </strong>
                        . After that, it will not auto-renew.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600">
                Are you sure you want to proceed with this cancellation?
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeCancelModal}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelMutation.isPending}
                className={`flex-1 px-4 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  cancelModal.cancelNow
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {cancelMutation.isPending
                  ? "Processing..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptions;
