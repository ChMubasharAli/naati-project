import { NavLink } from "react-router-dom";

import { Avatar, Button, Menu, Modal, Tabs } from "@mantine/core";
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

  const [opened, { open, close }] = useDisclosure(false);
  const [modalTitle, setModalTitle] = useState("Update Password");

  return (
    <>
      {/* Mobile Version */}
      <div className="flex md:hidden">
        {isOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div
          className={`fixed top-0 right-0 h-screen overflow-auto w-full max-w-sm bg-slate-900 flex flex-col transform transition-transform duration-300 ease-in-out z-50 shadow-2xl border-l border-white/10 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile Header */}
          <div className="p-6 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-white text-xl font-bold">PREP SMART</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems?.map((item) => (
                <li key={item.name}>
                  <NavLink
                    onClick={() => {
                      setActiveItem(item.name);
                      localStorage.setItem("activeItem", item.name);
                      setIsOpen(!isOpen);
                    }}
                    to={item.href}
                    end={item.end}
                  >
                    {({ isActive }) => (
                      <div
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? "bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
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
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/10">
                  <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <User className="text-white" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">
                      {/* {userData?.name || "Admin"} */}
                      {"Admin"}
                    </div>
                    <div className="text-slate-400 text-xs truncate">
                      {/* {userData?.email || "admin@example.com"} */}
                      {"admin@example.com"}
                    </div>
                  </div>
                </div>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item color="red" leftSection={<LogOut size={16} />}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </div>

      {/* Desktop Version */}
      <div className="w-64 bg-slate-900 md:flex hidden flex-col  shadow-2xl relative z-10 border-r border-white/10">
        {/* Desktop Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-white text-xl font-bold">PREP SMART</div>
              <div className="text-slate-400 text-xs">CCL Platform</div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems?.map((item) => (
              <li key={item.name}>
                <NavLink
                  end={item.end}
                  onClick={() => {
                    setActiveItem(item.name);
                    localStorage.setItem("activeItem", item.name);
                  }}
                  to={item.href}
                >
                  {({ isActive }) => (
                    <div
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
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
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop User Section */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div
            onClick={open}
            className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/10 group"
          >
            <Avatar
              color="dark"
              radius="xl"
              className="bg-linear-to-br from-emerald-500 to-teal-500 "
            >
              {logedInUser?.name?.charAt(0).toUpperCase() || ""}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-white capitalize font-semibold text-sm">
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

      {/* Modal for update profile and logout */}
      <Modal
        opened={opened}
        onClose={close}
        closeOnClickOutside={false}
        size="md"
        centered
        title={modalTitle}
        radius="lg"
        classNames={{
          title: "text-white !text-xl !font-semibold",
          close: "hover:!text-emerald-400 !border-none",
        }}
      >
        <Tabs color="teal" variant="default" defaultValue="update">
          <Tabs.List className="border-b border-white/10">
            <Tabs.Tab
              onClick={() => setModalTitle("Update Password")}
              value="update"
              className="text-slate-400! data-active:text-emerald-400!"
            >
              Update Details
            </Tabs.Tab>

            <Tabs.Tab
              onClick={() => setModalTitle("Logout")}
              value="logout"
              className="text-slate-400! data-active:text-emerald-400!"
            >
              Logout
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="update" className="pt-4">
            <UpdateLoggedInUser />
          </Tabs.Panel>

          <Tabs.Panel value="logout" className="pt-4">
            <div className="p-4 flex items-center justify-end">
              <Button
                size="sm"
                radius="md"
                className="bg-linear-to-r! from-emerald-500 to-teal-500 text-white! font-semibold! hover:from-emerald-600! hover:to-teal-600! transition-all! shadow-lg! hover:shadow-emerald-500/50!"
                onClick={() => {
                  logout();
                  queryClient.clear();
                  notifications.show({
                    title: "Success",
                    message: "You have been logged out successfully",
                    color: "teal",
                    position: "top-right",
                    autoClose: 4000,
                  });
                }}
              >
                Logout
              </Button>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
