// src/components/SubscriptionsManagement.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Edit,
  Trash2,
  X,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";

// Import API functions
import {
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
} from "../../api/subscriptions";
import { showSuccessToast } from "../../lib/react-query";

const SubscriptionsManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view' or 'edit'
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [formData, setFormData] = useState({
    status: "",
    cancelAtPeriodEnd: false,
  });

  /**
   * Fetch subscriptions using TanStack Query
   * Automatic caching, retry, and error handling
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
   * Update subscription mutation
   */
  const updateMutation = useMutation({
    mutationFn: updateSubscription,
    onSuccess: (data) => {
      // Show success notification
      showSuccessToast(data.message || "Subscription updated successfully!");

      // Close modal
      setIsModalOpen(false);

      // Invalidate and refetch subscriptions
      queryClient.invalidateQueries(["subscriptions"]);
    },
    // Error is automatically handled by global error handler
  });

  /**
   * Delete subscription mutation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: (data) => {
      // Show success notification
      showSuccessToast(data.message || "Subscription deleted successfully!");

      // Invalidate and refetch subscriptions
      queryClient.invalidateQueries(["subscriptions"]);
    },
    // Error is automatically handled by global error handler
  });

  /**
   * Open modal to view subscription
   */
  const handleView = (item) => {
    setModalMode("view");
    setSelectedSubscription(item);
    setFormData({
      status: item.subscription.status,
      cancelAtPeriodEnd: item.subscription.cancelAtPeriodEnd,
    });
    setIsModalOpen(true);
  };

  /**
   * Switch to edit mode
   */
  const handleEdit = () => {
    setModalMode("edit");
  };

  /**
   * Handle subscription update
   */
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedSubscription) return;

    updateMutation.mutate({
      id: selectedSubscription.subscription.id,
      ...formData,
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

        {/* Refresh Button */}
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
            placeholder="Search by name, email, or status..."
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
                <td colSpan="5" className="px-6 py-12 text-center">
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
                <td colSpan="5" className="px-6 py-12 text-center">
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
                        <XCircle size={14} />
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
                        disabled={
                          updateMutation.isPending || deleteMutation.isPending
                        }
                      >
                        <Edit size={18} />
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

      {/* Total Count and Stats */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-sm text-gray-600">
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

        {isLoading && (
          <div className="text-xs text-emerald-600 flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin" />
            Syncing with server...
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "view"
                  ? "Subscription Details"
                  : "Edit Subscription"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                disabled={updateMutation.isPending}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  User Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {selectedSubscription.user?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {selectedSubscription.user?.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {selectedSubscription.user?.phone || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Subscription ID
                  </div>
                  <div className="text-sm font-semibold text-gray-900 font-mono truncate">
                    {selectedSubscription.subscription?.id || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Stripe Sub ID
                  </div>
                  <div className="text-sm font-semibold text-gray-900 font-mono truncate">
                    {selectedSubscription.subscription?.stripeSubscriptionId ||
                      "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Created At</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(selectedSubscription.subscription?.createdAt)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Period End</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(
                      selectedSubscription.subscription?.currentPeriodEnd,
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {modalMode === "edit" ? (
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                      disabled={updateMutation.isPending}
                    >
                      <option value="active">Active</option>
                      <option value="canceled">Canceled</option>
                      <option value="past_due">Past Due</option>
                      <option value="trialing">Trialing</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.cancelAtPeriodEnd}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cancelAtPeriodEnd: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        disabled={updateMutation.isPending}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Cancel at period end
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalMode("view")}
                      className="flex-1 px-4 py-3 cursor-pointer border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                      disabled={updateMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border cursor-pointer border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                  >
                    Edit Subscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManagement;
