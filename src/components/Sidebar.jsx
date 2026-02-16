// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { Avatar, Button, Modal, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import UpdateLoggedInUser from "./UpdateLoggedInUser";
import { LogOut, MoreVertical, X, User, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Sidebar({ isOpen, setIsOpen, menuItems, setActiveItem }) {
  const queryClient = useQueryClient();
  const { user: logedInUser, logout } = useAuth();

  // Single modal state for both mobile and desktop
  const [modalOpened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState("update");

  // Handle logout function
  const handleLogout = () => {
    logout();
    queryClient.clear();
    notifications.show({
      title: "Success",
      message: "You have been logged out successfully",
      color: "teal",
      position: "top-right",
      autoClose: 4000,
    });
    close();
    setIsOpen(false); // Close mobile sidebar on logout
  };

  // Handle open modal with specific tab
  const handleOpenModal = (tab = "update") => {
    setActiveTab(tab);
    open();
  };

  // Handle navigation click
  const handleNavClick = (itemName) => {
    setActiveItem(itemName);
    localStorage.setItem("activeItem", itemName);
    setIsOpen(false); // Close mobile sidebar on navigation click
  };

  // Get modal title based on active tab
  const getModalTitle = () => {
    return activeTab === "update" ? "Update Password" : "Logout";
  };

  return (
    <>
      {/* Mobile Version */}
      <div className="flex lg:hidden">
        {isOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div
          className={`fixed top-0 right-0 h-screen overflow-auto w-full max-w-md bg-slate-900 flex flex-col transform transition-transform duration-300 ease-in-out z-50 shadow-2xl border-l border-white/10 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile Header */}
          <div className="p-6 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div className="h-12 p-1  flex items-center justify-center  border-white/10">
              <img
                src="/logo-img.png"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <ul className="space-y-2 mt-3">
              {menuItems?.map((item) => (
                <li key={item.name}>
                  <NavLink
                    onClick={() => handleNavClick(item.name)}
                    to={item.href}
                    end={item.end}
                    className={({ isActive }) =>
                      `w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="mr-3">
                          <item.icon
                            size={20}
                            className={
                              isActive
                                ? "text-emerald-400"
                                : "text-slate-500 group-hover:text-emerald-400"
                            }
                          />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile User Section - Direct Click to Open Modal */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <div
              onClick={() => handleOpenModal("update")}
              className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/10 group"
            >
              <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                {logedInUser?.name ? (
                  <span className="text-white font-semibold text-sm">
                    {logedInUser.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="text-white" size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm capitalize truncate">
                  {logedInUser?.name || "Admin"}
                </div>
                <div className="text-slate-400 text-xs truncate">
                  {logedInUser?.email || "admin@example.com"}
                </div>
              </div>
              <MoreVertical
                size={18}
                className="text-emerald-400 group-hover:text-emerald-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Version */}
      <div className="w-64 bg-slate-900 lg:flex hidden flex-col shadow-2xl relative z-10 border-r border-white/10">
        {/* Desktop Logo */}
        <div className=" h-24 p-1 w-full flex items-center justify-center border-b border-white/10 ">
          <img
            src="/logo-img.png"
            alt="Logo"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems?.map((item) => (
              <li key={item.name}>
                <NavLink
                  end={item.end}
                  onClick={() => handleNavClick(item.name)}
                  to={item.href}
                  className={({ isActive }) =>
                    `w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="mr-3">
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-emerald-400"
                              : "text-slate-500 group-hover:text-emerald-400"
                          }
                        />
                      </div>
                      <span
                        className={
                          isActive
                            ? "font-semibold"
                            : "font-medium group-hover:font-semibold"
                        }
                      >
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop User Section - Direct Click to Open Modal */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div
            onClick={() => handleOpenModal("update")}
            className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/10 group"
          >
            <Avatar
              color="dark"
              radius="xl"
              className="bg-linear-to-br from-emerald-500 to-teal-500"
            >
              {logedInUser?.name?.charAt(0).toUpperCase() || "A"}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-white capitalize font-semibold text-sm truncate">
                {logedInUser?.name || "Admin"}
              </div>
              <div className="text-slate-400 text-xs truncate">
                {logedInUser?.email || "admin@example.com"}
              </div>
            </div>
            <MoreVertical
              size={18}
              className="text-emerald-400 group-hover:text-emerald-300"
            />
          </div>
        </div>
      </div>

      {/* Single Modal for Both Mobile and Desktop */}
      <Modal
        opened={modalOpened}
        onClose={close}
        closeOnClickOutside={false}
        size="md"
        centered
        title={getModalTitle()}
        radius="lg"
        classNames={{
          title: "text-white !text-xl !font-semibold",
          close: "hover:!text-emerald-400 !border-none",
          content: "bg-slate-900 border border-white/10",
          header: "bg-slate-800 border-b border-white/10",
        }}
        overlayProps={{
          backgroundOpacity: 0.5,
          blur: 3,
        }}
      >
        <Tabs
          color="teal"
          variant="default"
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.List className="border-b border-white/10">
            <Tabs.Tab
              value="update"
              className="text-slate-400 !font-medium data-[active]:text-emerald-400 data-[active]:font-semibold"
            >
              Update Password
            </Tabs.Tab>

            <Tabs.Tab
              value="logout"
              className="text-slate-400 !font-medium data-[active]:text-emerald-400 data-[active]:font-semibold"
            >
              Logout
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="update" className="pt-4">
            <UpdateLoggedInUser />
          </Tabs.Panel>

          <Tabs.Panel value="logout" className="pt-4">
            <div className="p-4">
              <p className="text-slate-400 mb-4 text-sm">
                Are you sure you want to logout? You will need to sign in again
                to access your account.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  color="gray"
                  radius="md"
                  onClick={close}
                  className="border-white/10 cursor-pointer text-white hover:bg-white/5 font-medium"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  radius="md"
                  className="!bg-linear-to-r !from-emerald-500 !to-teal-500 text-white !font-semibold transition-all hover:!from-emerald-600 hover:!to-teal-600"
                  onClick={handleLogout}
                  leftSection={<LogOut size={16} />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
