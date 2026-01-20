// src/components/UserMessages.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Mail,
  Search,
  Trash2,
  X,
  Eye,
  User,
  Phone,
  Calendar,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Import API functions
import { fetchMessages, deleteMessage } from "../../api/contact";
import { showSuccessToast } from "../../lib/react-query";

const UserMessages = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const itemsPerPage = 20;

  /**
   * Query for fetching messages with pagination and search
   * TanStack Query handles caching, loading, and error states
   */
  const {
    data: messagesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["messages", currentPage, searchTerm],
    queryFn: () =>
      fetchMessages({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  // Extract messages and metadata from query response
  const messages = messagesData?.data || [];
  const meta = messagesData?.meta || {
    page: 1,
    limit: itemsPerPage,
    total: 0,
    totalPages: 1,
  };

  /**
   * Mutation for deleting a message
   * Includes optimistic update for better UX
   */
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onMutate: async (messageId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["messages", currentPage, searchTerm]);

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData([
        "messages",
        currentPage,
        searchTerm,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(["messages", currentPage, searchTerm], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.filter((msg) => msg.id !== messageId),
          meta: {
            ...old.meta,
            total: old.meta.total - 1,
          },
        };
      });

      // Return context with the snapshot value
      return { previousMessages };
    },
    onSuccess: (data) => {
      showSuccessToast(data.message || "Message deleted successfully");

      // If we deleted the selected message, close modal
      if (selectedMessage?.id === data.deletedId) {
        setIsModalOpen(false);
        setSelectedMessage(null);
      }
    },
    onError: (err, messageId, context) => {
      // Revert optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", currentPage, searchTerm],
          context.previousMessages,
        );
      }

      // Error is shown via global error handler
      console.error("Delete error:", err);
    },
    onSettled: () => {
      // Refetch messages to ensure consistency
      queryClient.invalidateQueries(["messages"]);
    },
  });

  /**
   * Handle view message details
   */
  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  /**
   * Handle delete message with confirmation
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  /**
   * Format date for display
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

  /**
   * Truncate message for table display
   */
  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setCurrentPage(newPage);
    }
  };

  /**
   * Handle search with debounce (optional - you can add later)
   */
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to page 1 when searching
    setCurrentPage(1);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-7 h-7 text-emerald-600" />
            Contact Messages
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage and respond to user inquiries
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="text-sm font-semibold text-emerald-700">
            Total: {meta.total} messages
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Failed to load messages
              </p>
              <p className="text-sm text-red-600 mt-1">
                {error?.message || "Please try again later"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                First Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Message
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex justify-center">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <span>Loading messages...</span>
                  </div>
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm
                    ? "No messages found matching your search"
                    : "No messages found"}
                </td>
              </tr>
            ) : (
              messages.map((message) => (
                <tr
                  key={message.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {message.firstName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {message.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {message.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewMessage(message)}
                      className="text-sm text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                      disabled={deleteMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 group-hover:text-emerald-600" />
                      <span className="max-w-xs truncate">
                        {truncateMessage(message.message)}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewMessage(message)}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                        title="View Details"
                        disabled={deleteMutation.isPending}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === message.id ? (
                          <Loader2 size={18} className="animate-spin" />
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

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === meta.totalPages || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Message Details Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Message Details
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                disabled={deleteMutation.isPending}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedMessage.firstName} {selectedMessage.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedMessage.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedMessage.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Received</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedMessage.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-700 font-semibold mb-2 uppercase tracking-wider">
                  Subject
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {selectedMessage.subject}
                </div>
              </div>

              {/* Message */}
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-700 font-semibold mb-3 uppercase tracking-wider">
                  Message
                </div>
                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedMessage.id);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending &&
                  deleteMutation.variables === selectedMessage.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMessages;
