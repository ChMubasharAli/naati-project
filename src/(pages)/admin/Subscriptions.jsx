// src/components/SubscriptionsManagement.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Eye,
  Trash2,
  X,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  RefreshCw,
  Globe,
  AlertCircle,
  Clock,
  Hash,
  CreditCard as CardIcon,
  BadgeCheck,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";

// Import API functions
import {
  getSubscriptions,
  deleteSubscription,
  cancelSubscription,
} from "../../api/subscriptions";
import { showSuccessToast } from "../../lib/react-query";

const SubscriptionsManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  /**
   * Fetch subscriptions using TanStack Query
   */
  const {
    data: subscriptions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Delete subscription mutation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Subscription deleted successfully!");
      queryClient.invalidateQueries(["subscriptions"]);
    },
  });

  /**
   * Cancel subscription mutation (Same pattern as reference code)
   */
  const cancelMutation = useMutation({
    mutationFn: ({ subscriptionId, userId, cancelNow }) =>
      cancelSubscription(subscriptionId, userId, cancelNow),
    onSuccess: (data, variables) => {
      const message = variables.cancelNow
        ? "Subscription canceled successfully!"
        : "Subscription scheduled for cancellation!";

      showSuccessToast(message);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsModalOpen(false); // Close modal after successful cancel
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  /**
   * Open modal to view subscription details
   */
  const handleView = (item) => {
    setSelectedSubscription(item);
    setIsModalOpen(true);
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  /**
   * Handle subscription cancellation with confirmation
   */
  const handleCancelSubscription = async (cancelNow) => {
    if (!selectedSubscription) return;

    const confirmMessage = cancelNow
      ? "Are you sure you want to cancel this subscription immediately? Access will be revoked right away."
      : `Are you sure you want to cancel at period end? User can access until ${formatDate(
          selectedSubscription.subscription?.currentPeriodEnd,
        )}.`;

    if (!window.confirm(confirmMessage)) return;

    cancelMutation.mutate({
      subscriptionId: selectedSubscription.subscription.id,
      userId: selectedSubscription.user?.id,
      cancelNow: cancelNow,
    });
  };

  /**
   * Handle subscription deletion
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  /**
   * Filter subscriptions based on search term
   */
  const filteredSubscriptions = subscriptions.filter(
    (item) =>
      item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subscription?.status
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.subscription?.language?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  /**
   * Status badge styling
   */
  const getStatusStyle = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      canceled: "bg-red-100 text-red-700 border-red-200",
      past_due: "bg-yellow-100 text-yellow-700 border-yellow-200",
      trialing: "bg-blue-100 text-blue-700 border-blue-200",
      incomplete: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Subscriptions Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage all user subscriptions and billing
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 cursor-pointer bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error Display */}
      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-medium mb-1">
            Failed to load subscriptions
          </div>
          <div className="text-red-600 text-sm">
            {error?.message || "Please try again"}
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm cursor-pointer text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, status or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Period End
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Auto-Renew
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <div className="text-gray-500">
                      Loading subscriptions...
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    {subscriptions.length === 0
                      ? "No subscriptions available"
                      : "No subscriptions match your search"}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((item) => (
                <tr
                  key={item.subscription.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {item.user?.name || "Unknown User"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.user?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {item.subscription?.language?.name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(
                        item.subscription?.status,
                      )}`}
                    >
                      {item.subscription?.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(item.subscription?.currentPeriodEnd)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.subscription?.cancelAtPeriodEnd ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <Ban size={14} />
                        Canceled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(item)}
                        className="p-2 text-gray-600 cursor-pointer hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                        title="View Details"
                        disabled={cancelMutation.isPending}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.subscription.id)}
                        className="p-2 text-gray-600 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === item.subscription.id ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
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

      {/* View Details Modal */}
      {isModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CardIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Subscription Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {selectedSubscription.subscription?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={cancelMutation.isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <User size={16} />
                  User Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedSubscription.user?.name || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Email Address
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedSubscription.user?.email || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Phone Number
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedSubscription.user?.phone || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Hash className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">User ID</div>
                        <div className="text-sm font-semibold text-gray-900 font-mono">
                          {selectedSubscription.user?.id || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Preferred Language
                        </div>
                        <div className="text-sm font-semibold text-gray-900 uppercase">
                          {selectedSubscription.user?.preferredLanguage ||
                            "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <BadgeCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Verification Status
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedSubscription.user?.isVerified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle size={12} /> Verified
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle size={12} /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      User Since:{" "}
                      {formatDate(selectedSubscription.user?.createdAt)}
                    </span>
                    <span className="font-mono">
                      Stripe Customer:{" "}
                      {selectedSubscription.user?.stripeCustomerId || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard size={16} />
                  Subscription Details
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(
                        selectedSubscription.subscription?.status,
                      )}`}
                    >
                      {selectedSubscription.subscription?.status || "unknown"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <div className="text-xs text-gray-500 mb-1">Language</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedSubscription.subscription?.language?.name ||
                        "N/A"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedSubscription.subscription?.isSubscription ? (
                        <span className="text-emerald-600">Recurring</span>
                      ) : (
                        <span className="text-gray-600">One-time</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Subscription ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 truncate">
                        {selectedSubscription.subscription?.id}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Stripe Subscription ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 truncate">
                        {selectedSubscription.subscription
                          ?.stripeSubscriptionId || "N/A"}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Stripe Price ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 truncate">
                        {selectedSubscription.subscription?.stripePriceId ||
                          "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Current Period End
                      </div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-600" />
                        {formatDate(
                          selectedSubscription.subscription?.currentPeriodEnd,
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Created At
                      </div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Clock size={14} className="text-emerald-600" />
                        {formatDate(
                          selectedSubscription.subscription?.createdAt,
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-500 mb-1">
                        Auto-Renew Status
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedSubscription.subscription
                          ?.cancelAtPeriodEnd ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <Ban size={14} /> Canceled at period end
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle size={14} /> Active renewal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Only show for active subscriptions */}
              {selectedSubscription.subscription?.status === "active" && (
                <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                  <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Cancellation Actions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCancelSubscription(false)}
                      disabled={
                        cancelMutation.isPending ||
                        selectedSubscription.subscription?.cancelAtPeriodEnd
                      }
                      className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      {cancelMutation.isPending &&
                      !cancelMutation.variables?.cancelNow ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Calendar size={18} />
                      )}
                      Cancel at Period End
                    </button>

                    <button
                      onClick={() => handleCancelSubscription(true)}
                      disabled={cancelMutation.isPending}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      {cancelMutation.isPending &&
                      cancelMutation.variables?.cancelNow ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Ban size={18} />
                      )}
                      Cancel Immediately
                    </button>
                  </div>
                  {selectedSubscription.subscription?.cancelAtPeriodEnd && (
                    <p className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                      This subscription is already scheduled for cancellation at
                      period end.
                    </p>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  disabled={cancelMutation.isPending}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManagement;
