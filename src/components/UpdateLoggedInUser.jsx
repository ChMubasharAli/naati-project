// src/components/UpdateLoggedInUser.jsx
import { Button, PasswordInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function UpdateLoggedInUser() {
  const { user } = useAuth();
  const [passwordValues, setPasswordValues] = useState({
    password: "",
    confirmPassword: "",
  });

  // Update mutation - Fixed API endpoint
  const updateMutation = useMutation({
    mutationFn: ({ password }) =>
      apiClient.put(`/api/v1/users/${user?.id}`, { password }),

    onSuccess: () => {
      toast.success("Password updated successfully!");
      setPasswordValues({ password: "", confirmPassword: "" });
    },

    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        "Failed to update password. Please try again.";
      toast.error(msg);
    },
  });

  const handleUpdate = () => {
    const { password, confirmPassword } = passwordValues;

    // Validation
    if (!user?.id) {
      toast.error("User ID not found. Please sign in again.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        "Your new password and confirmation do not match. Please try again.",
      );
      return;
    }

    updateMutation.mutate({ password });
  };

  return (
    <section className="p-4">
      <PasswordInput
        classNames={{ label: "mb-1 text-slate-400!" }}
        radius="md"
        label="New Password"
        placeholder="Enter new password"
        mb="md"
        required
        value={passwordValues.password}
        onChange={(e) =>
          setPasswordValues((prev) => ({
            ...prev,
            password: e.target.value,
          }))
        }
        disabled={updateMutation.isPending}
      />

      <PasswordInput
        classNames={{ label: "mb-1 text-slate-400!" }}
        radius="md"
        label="Confirm Password"
        placeholder="Confirm new password"
        mb="md"
        required
        value={passwordValues.confirmPassword}
        onChange={(e) =>
          setPasswordValues((prev) => ({
            ...prev,
            confirmPassword: e.target.value,
          }))
        }
        disabled={updateMutation.isPending}
      />

      <Button
        loading={updateMutation.isPending}
        disabled={updateMutation.isPending || !user?.id}
        onClick={handleUpdate}
        loaderProps={{ type: "bars" }}
        fullWidth
        radius="md"
        size="sm"
        classNames={{
          root: "!bg-gradient-to-r from-emerald-500 to-teal-500 text-white! font-semibold! hover:from-emerald-600! hover:to-teal-600! transition-all! shadow-lg! hover:shadow-emerald-500/50!",
        }}
      >
        Update Password
      </Button>
    </section>
  );
}
