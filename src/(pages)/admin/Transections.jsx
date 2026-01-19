// src/components/TransactionsManagement.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Edit,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

// Import API functions
import {
  fetchTransactions,
  fetchTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../../api/transaction";
import { queryKeys, showSuccessToast } from "../../lib/react-query";

const TransactionsManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [formData, setFormData] = useState({
    status: "",
    amount: "",
  });

  /**
   * Fetch all transactions using React Query
   */
  const {
    data: transactions = [],
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: queryKeys.transactions.list(), // Fixed: using .list() function
    queryFn: fetchTransactions,
    staleTime: 1000 * 60, // 1 minute
  });

  /**
   * Mutation for updating a transaction
   */
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => {
      showSuccessToast("Transaction updated successfully!");

      // Invalidate transactions query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

      // Close modal
      setIsModalOpen(false);
    },
  });

  /**
   * Mutation for deleting a transaction
   */
  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      showSuccessToast("Transaction deleted successfully!");

      // Invalidate transactions query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  /**
   * Handle view transaction
   */
  const handleView = async (transaction) => {
    try {
      const data = await fetchTransactionById(transaction.id);
      setSelectedTransaction(data);
      setFormData({
        status: data.status,
        amount: data.amount,
      });
      setModalMode("view");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch transaction details:", error);
    }
  };

  /**
   * Handle edit transaction
   */
  const handleEdit = () => {
    setModalMode("edit");
  };

  /**
   * Handle update transaction
   */
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedTransaction) return;

    if (!formData.status) {
      toast.error("Please select a status");
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      data: formData,
    });
  };

  /**
   * Handle delete transaction
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    deleteTransactionMutation.mutate(id);
  };

  /**
   * Filter transactions locally (client-side)
   */
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.stripeInvoiceId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.stripeCustomerId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm);
    const matchesStatus = !filterStatus || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /**
   * Status badge styling
   */
  const getStatusStyle = (status) => {
    const styles = {
      paid: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      refunded: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  /**
   * Format amount with currency
   */
  const formatAmount = (amount, currency) => {
    const value = (amount / 100).toFixed(2);
    const currencySymbol =
      currency === "usd"
        ? "$"
        : currency === "aud"
          ? "A$"
          : currency?.toUpperCase() + " ";
    return `${currencySymbol}${value}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
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
            <Receipt className="w-7 h-7 text-emerald-600" />
            Transactions Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View and manage all payment transactions
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refetchTransactions()}
          disabled={isTransactionsLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={18}
            className={isTransactionsLoading ? "animate-spin" : ""}
          />
          {isTransactionsLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice ID, customer ID, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isTransactionsLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                  <p className="mt-2 text-gray-500">Loading transactions...</p>
                </td>
              </tr>
            ) : isTransactionsError ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-red-500">
                  Failed to load transactions. Please try again.
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {transactions.length === 0
                    ? "No transactions found"
                    : "No transactions match your search criteria"}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          #{transaction.id}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                          {transaction.stripeInvoiceId || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-gray-900">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(
                        transaction.status,
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(transaction.paidAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(transaction)}
                        disabled={deleteTransactionMutation.isPending}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteTransactionMutation.isPending}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
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
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <div>
          Total Transactions:{" "}
          <span className="font-semibold text-gray-900">
            {filteredTransactions.length}
          </span>
          {searchTerm || filterStatus ? (
            <span className="ml-2 text-gray-500">
              (Filtered from {transactions.length})
            </span>
          ) : null}
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "view"
                  ? "Transaction Details"
                  : "Edit Transaction"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={updateTransactionMutation.isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Transaction Overview */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Transaction ID
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    #{selectedTransaction.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {formatAmount(
                      selectedTransaction.amount,
                      selectedTransaction.currency,
                    )}
                  </span>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Invoice ID</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono break-all">
                    {selectedTransaction.stripeInvoiceId || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Customer ID</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono break-all">
                    {selectedTransaction.stripeCustomerId || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Subscription ID
                  </div>
                  <div className="text-sm font-semibold text-gray-900 font-mono break-all">
                    {selectedTransaction.stripeSubscriptionId || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Price ID</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono break-all">
                    {selectedTransaction.stripePriceId || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Paid At</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(selectedTransaction.paidAt)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Currency</div>
                  <div className="text-sm font-semibold text-gray-900 uppercase">
                    {selectedTransaction.currency || "N/A"}
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
                      disabled={updateTransactionMutation.isPending}
                    >
                      <option value="">Select Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Amount (in cents)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="6000"
                      disabled={updateTransactionMutation.isPending}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalMode("view")}
                      disabled={updateTransactionMutation.isPending}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateTransactionMutation.isPending}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updateTransactionMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Transaction"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Transaction
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

export default TransactionsManagement;
