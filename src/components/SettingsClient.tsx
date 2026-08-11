"use client";

import { useState } from "react";
import {
  updateProfile,
  updatePassword,
  deleteAccount,
} from "@/app/actions/settings";

const tabs = ["Profile", "Password", "Danger Zone"] as const;

export default function SettingsClient({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");

  const inputClass =
    "w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Settings</h1>

      <div className="flex gap-1 mb-8 border-b border-white/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === tab
                ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <form action={updateProfile} className="space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={userName}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={userEmail}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all"
          >
            Save Changes
          </button>
        </form>
      )}

      {activeTab === "Password" && (
        <form action={updatePassword} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className={labelClass}>
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all"
          >
            Update Password
          </button>
        </form>
      )}

      {activeTab === "Danger Zone" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Delete Account
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Once you delete your account, there is no going back. All your
            resumes and data will be permanently removed.
          </p>
          <form action={deleteAccount}>
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-all"
            >
              Delete My Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
