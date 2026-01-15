// src/components/UsersManagement.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Users as UsersIcon,
  Search,
  X,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import API functions
import { fetchUsers, createUser, updateUser, deleteUser } from "../../api/users";
import { showSuccessToast, queryKeys } from "../../lib/react-query";

const UsersManagement = () => {
  const queryClient = useQueryClient();
  
  // State variables
  // Here is the generic person code that i build for ht scemnatio and will push on the production and then will also inform that to the contractor and then they will ship th ecode to the vetrcel.com 
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of users to show per page


  // let new3 array = ["hello", ]

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    preferredLanguage: "en",
    naatiCclExamDate: "",
    isVerified: false,
  });

  // Fetch all users using React Query
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: fetchUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Show error if fetch fails
  useEffect(() => {
    if (usersError) {
      console.error("Failed to fetch users:", usersError);
    }
  }, [usersError]);

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      // Show success toast notification
      showSuccessToast(data.message || "User created successfully!");
      
      // Close modal
      setIsModalOpen(false);
      
      // Reset form
      resetForm();
      
      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
    },
    // Error is automatically handled by global error handler
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (data) => {
      // Show success toast notification
      showSuccessToast(data.message || "User updated successfully!");
      
      // Close modal
      setIsModalOpen(false);
      
      // Reset form
      resetForm();
      
      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
    },
    // Error is automatically handled by global error handler
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      // Show success toast notification
      showSuccessToast(data.message || "User deleted successfully!");
      
      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
    },
    // Error is automatically handled by global error handler
  });

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      preferredLanguage: "en",
      naatiCclExamDate: "",
      isVerified: false,
    });
    setSelectedUser(null);
    setShowPassword(false);
  };

  /**
   * Handle create new user button click
   */
  const handleCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  /**
   * Handle edit user button click
   */
  const handleEdit = (user) => {
    setModalMode("edit");
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "", // Don't show existing password
      preferredLanguage: user.preferredLanguage,
      naatiCclExamDate: user.naatiCclExamDate || "",
      isVerified: user.isVerified,
    });
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  /**
   * Handle form submission for create/update
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare user data object
    const userData = {
      name: formData.name,
      phone: formData.phone,
      preferredLanguage: formData.preferredLanguage,
      naatiCclExamDate: formData.naatiCclExamDate || null,
      isVerified: formData.isVerified,
    };

    // Add email and password for create operation
    if (modalMode === "create") {
      userData.email = formData.email;
      userData.password = formData.password;
      createMutation.mutate(userData);
    } else {
      // For edit, only add password if provided
      if (formData.password) {
        userData.password = formData.password;
      }
      updateMutation.mutate({ id: selectedUser.id, data: userData });
    }
  };

  /**
   * Handle delete user
   */
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Extract users from API response
  const allUsers = usersData?.data?.users || [];
  const totalUsers = allUsers.length;

  /**
   * Filter users based on search term
   */
  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
  );

  /**
   * Frontend Pagination Logic
   */
  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalFilteredUsers / itemsPerPage);
  
  // Calculate start and end index for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Get users for current page using slice
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  /**
   * Handle next page button click
   */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Handle previous page button click
   */
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * Handle page number click
   */
  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Generate page numbers to display in pagination controls
   */
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with intelligent positioning
      if (currentPage <= 3) {
        // Show first 5 pages when current page is near start
        for (let i = 1; i <= maxPagesToShow; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages when current page is near end
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Show pages around current page
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-emerald-600" />
            Users Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage platform users and their verification status
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={usersLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={usersLoading}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Exam Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Loading State */}
            {usersLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    <p>Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : 
            /* Empty State */
            paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? "No users found matching your search" : "No users found"}
                </td>
              </tr>
            ) : 
            /* Users List */
            paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                {/* User Name and Avatar */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                
                {/* Contact Information */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail size={14} className="text-gray-400" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      {user.phone}
                    </div>
                  </div>
                </td>
                
                {/* Preferred Language */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                    {user.preferredLanguage.toUpperCase()}
                  </span>
                </td>
                
                {/* Exam Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(user.naatiCclExamDate)}
                  </div>
                </td>
                
                {/* Verification Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle size={14} />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      <XCircle size={14} />
                      Unverified
                    </span>
                  )}
                </td>
                
                {/* Action Buttons */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Edit User"
                      disabled={deleteMutation.isPending}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete User"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteMutation.variables === user.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Only show if we have users */}
      {!usersLoading && totalFilteredUsers > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Showing count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
            <span className="font-semibold">
              {Math.min(endIndex, totalFilteredUsers)}
            </span>{" "}
            of <span className="font-semibold">{totalFilteredUsers}</span> users
            {totalUsers !== totalFilteredUsers && (
              <span className="text-gray-500 ml-2">
                (filtered from {totalUsers} total users)
              </span>
            )}
          </div>
          
          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              {/* Show ellipsis if there are more pages after current range */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              
              {/* Show last page if it's not in the current range */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => handlePageClick(totalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            
            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add New User" : "Edit User"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* First row: Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email {modalMode === "create" ? "*" : ""}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required={modalMode === "create"}
                    disabled={modalMode === "edit" || createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              </div>

              {/* Second row: Phone and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="03001234567"
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password {modalMode === "create" ? "*" : "(optional)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="••••••••"
                      required={modalMode === "create"}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Third row: Language and Exam Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="preferredLanguage"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Preferred Language *
                  </label>
                  <select
                    id="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredLanguage: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="naatiCclExamDate"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    NAATI CCL Exam Date
                  </label>
                  <input
                    type="date"
                    id="naatiCclExamDate"
                    value={formData.naatiCclExamDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        naatiCclExamDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              </div>

              {/* Verification Checkbox */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) =>
                      setFormData({ ...formData, isVerified: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mark user as verified
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Verified users can access all platform features
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {modalMode === "create" ? "Creating..." : "Updating..."}
                    </span>
                  ) : modalMode === "create" ? (
                    "Create User"
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;