import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, logoutUser } from "../api/authAPI";

const defaultPreferences = {
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  theme: "Light",
};

const defaultNotifications = {
  email: true,
  expenses: true,
  weekly: false,
  budget: true,
};

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

// Common API function
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Profile");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(() => {
    let savedUser = {};

    try {
      savedUser = JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      savedUser = {};
    }

    return {
      name: savedUser.name || localStorage.getItem("userName") || "",
      email: savedUser.email || localStorage.getItem("userEmail") || "",
    };
  });

  const [preferences, setPreferences] = useState(() =>
    readStorage("expenseTrackPreferences", defaultPreferences)
  );

  const [notifications, setNotifications] = useState(() =>
    readStorage("expenseTrackNotifications", defaultNotifications)
  );

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Load profile from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await apiRequest("/users/me");

        const user =
          result.data?.user ||
          result.data ||
          result.user;

        if (user) {
          const updatedProfile = {
            name: user.name || "",
            email: user.email || "",
          };

          setProfile(updatedProfile);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              ...updatedProfile,
            })
          );

          localStorage.setItem("userName", updatedProfile.name);
          localStorage.setItem("userEmail", updatedProfile.email);
        }
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadProfile();
  }, []);

  // Apply theme globally
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", preferences.theme === "Dark");

    root.style.colorScheme =
      preferences.theme === "Dark" ? "dark" : "light";

    localStorage.setItem(
      "expenseTrackPreferences",
      JSON.stringify(preferences)
    );
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update profile
  const saveProfile = async (e) => {
    e.preventDefault();

    if (!profile.name.trim()) {
      setMessage("Name cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await apiRequest("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
        }),
      });

      const user =
        result.data?.user ||
        result.data ||
        result.user ||
        profile;

      const updatedProfile = {
        name: user.name || profile.name.trim(),
        email: user.email || profile.email.trim(),
      };

      setProfile(updatedProfile);

      let oldUser = {};
      try {
        oldUser = JSON.parse(localStorage.getItem("user")) || {};
      } catch {
        oldUser = {};
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...updatedProfile,
        })
      );

      localStorage.setItem("userName", updatedProfile.name);
      localStorage.setItem("userEmail", updatedProfile.email);

      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = () => {
    localStorage.setItem(
      "expenseTrackPreferences",
      JSON.stringify(preferences)
    );

    setMessage("Preferences saved successfully!");
  };

  // Notifications
  const toggleNotification = (key) => {
    setNotifications((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };

      localStorage.setItem(
        "expenseTrackNotifications",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!password.current || !password.new || !password.confirm) {
      setMessage("Please fill all password fields.");
      return;
    }

    if (password.new.length < 8) {
      setMessage("New password must be at least 8 characters.");
      return;
    }

    if (password.new !== password.confirm) {
      setMessage("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await apiRequest("/users/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new,
        }),
      });

      setPassword({
        current: "",
        new: "",
        confirm: "",
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");

      navigate("/login", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (error) {
      console.error("Logout API error:", error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");

      sessionStorage.clear();

      setShowLogout(false);
      setLoading(false);

      navigate("/login", { replace: true });
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage("Please enter your current password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await apiRequest("/users/me", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      localStorage.clear();
      sessionStorage.clear();

      setShowDelete(false);
      setDeletePassword("");

      navigate("/register", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: "Profile", icon: "👤" },
    { name: "Preferences", icon: "⚙️" },
    { name: "Notifications", icon: "🔔" },
    { name: "Security", icon: "🔒" },
  ];

  const Section = ({ title, description, children }) => (
    <section className="settings-card rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="settings-muted mt-1 mb-6 text-sm">
        {description}
      </p>
      {children}
    </section>
  );

  const Input = ({ label, value, onChange, type = "text" }) => (
    <div>
      <label className="settings-label mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="settings-input w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      aria-label="Toggle notification"
      aria-pressed={checked}
      className={`relative h-6 w-12 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-gray-400"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );

  const primaryButton =
    "rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50";

  return (
    <div className="settings-page min-h-screen w-full p-4 md:p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="settings-muted mt-2">
          Manage your account and application preferences.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

        {/* Sidebar */}
        <aside className="settings-card h-fit rounded-2xl border p-4">
          <p className="settings-muted mb-5 px-3 text-xs font-bold uppercase">
            Account Settings
          </p>

          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => {
                setActiveTab(tab.name);
                setMessage("");
              }}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activeTab === tab.name
                  ? "bg-blue-600 text-white"
                  : "settings-tab"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}

              {activeTab === tab.name && (
                <span className="ml-auto">›</span>
              )}
            </button>
          ))}

          <div className="settings-divider mt-5 border-t px-3 pt-5">
            <p className="settings-muted text-xs">
              ExpenseTrack v1.0
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="space-y-6 lg:col-span-3">

          {/* PROFILE */}
          {activeTab === "Profile" && (
            <>
              <Section
                title="Profile Information"
                description="Manage your personal account information."
              >
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                    {profile.name.charAt(0).toUpperCase() || "U"}
                  </div>

                  <div>
                    <h3 className="font-bold">{profile.name}</h3>
                    <p className="settings-muted text-sm">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <form onSubmit={saveProfile} className="space-y-5">
                  <Input
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        name: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        email: e.target.value,
                      })
                    }
                  />

                  <button
                    disabled={loading}
                    className={primaryButton}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </Section>

              <Section
                title="Account Information"
                description="Your application details."
              >
                <div className="flex justify-between py-3">
                  <span className="settings-muted">Account Type</span>
                  <span className="font-medium">Personal</span>
                </div>

                <div className="settings-divider flex justify-between border-t py-3">
                  <span className="settings-muted">Platform</span>
                  <span className="font-medium">ExpenseTrack</span>
                </div>
              </Section>
            </>
          )}

          {/* PREFERENCES */}
          {activeTab === "Preferences" && (
            <Section
              title="Application Preferences"
              description="Customize your ExpenseTrack experience."
            >
              <div className="space-y-7">

                <div>
                  <label className="settings-label mb-2 block text-sm font-semibold">
                    Currency
                  </label>

                  <select
                    value={preferences.currency}
                    onChange={(e) =>
                      updatePreference("currency", e.target.value)
                    }
                    className="settings-input w-full rounded-xl border px-4 py-3"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="settings-label mb-2 block text-sm font-semibold">
                    Date Format
                  </label>

                  <select
                    value={preferences.dateFormat}
                    onChange={(e) =>
                      updatePreference("dateFormat", e.target.value)
                    }
                    className="settings-input w-full rounded-xl border px-4 py-3"
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="settings-label mb-3 block text-sm font-semibold">
                    Appearance
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {["Light", "Dark"].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() =>
                          updatePreference("theme", item)
                        }
                        className={`rounded-xl border p-5 text-center transition ${
                          preferences.theme === item
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "settings-tab"
                        }`}
                      >
                        <div className="mb-2 text-3xl">
                          {item === "Light" ? "☀️" : "🌙"}
                        </div>

                        <span className="font-semibold">
                          {item} Mode
                        </span>

                        {preferences.theme === item && (
                          <p className="mt-1 text-xs">Selected</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <p className="settings-muted mt-3 text-xs">
                    Theme applies immediately across the app.
                  </p>
                </div>

                <button
                  onClick={savePreferences}
                  className={primaryButton}
                >
                  Save Preferences
                </button>
              </div>
            </Section>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "Notifications" && (
            <Section
              title="Notification Settings"
              description="Choose your notification preferences."
            >
              <div className="space-y-6">
                {[
                  {
                    key: "email",
                    title: "Email Notifications",
                    desc: "Important account updates.",
                  },
                  {
                    key: "expenses",
                    title: "Expense Notifications",
                    desc: "Updates when expenses are added.",
                  },
                  {
                    key: "weekly",
                    title: "Weekly Reports",
                    desc: "Weekly spending summaries.",
                  },
                  {
                    key: "budget",
                    title: "Budget Alerts",
                    desc: "Alerts when your budget limit is near.",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="settings-divider flex items-center justify-between gap-4 border-b pb-5 last:border-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {item.title}
                      </h3>

                      <p className="settings-muted mt-1 text-sm">
                        {item.desc}
                      </p>
                    </div>

                    <Toggle
                      checked={notifications[item.key]}
                      onChange={() => toggleNotification(item.key)}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SECURITY */}
          {activeTab === "Security" && (
            <>
              <Section
                title="Change Password"
                description="Update your account password."
              >
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-5"
                >
                  <Input
                    label="Current Password"
                    type="password"
                    value={password.current}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        current: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={password.new}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        new: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        confirm: e.target.value,
                      })
                    }
                  />

                  <button
                    disabled={loading}
                    className={primaryButton}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </Section>

              <Section
                title="Account Security"
                description="Your account security information."
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Authentication</h3>
                    <p className="settings-muted mt-1 text-sm">
                      Password-based login
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-700">
                    Enabled
                  </span>
                </div>
              </Section>
            </>
          )}

          {/* DANGER ZONE */}
          <section className="settings-card rounded-2xl border border-red-200 p-6">
            <h2 className="font-bold text-red-600">
              Danger Zone
            </h2>

            <p className="settings-muted my-3 text-sm">
              Account deletion is permanent.
            </p>

            <button
              onClick={() => setShowDelete(true)}
              className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete Account
            </button>
          </section>

          {/* SESSION */}
          <Section
            title="Session"
            description="Sign out of your ExpenseTrack account."
          >
            <button
              onClick={() => setShowLogout(true)}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </Section>

        </main>
      </div>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="settings-card w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold">Logout?</h2>

            <p className="settings-muted my-3">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="settings-tab rounded-xl px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="settings-card w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-600">
              Delete Account
            </h2>

            <p className="settings-muted my-3 text-sm">
              This action is permanent. Your account and associated
              expense data will be deleted.
            </p>

            <Input
              label="Current Password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setDeletePassword("");
                }}
                className="settings-tab rounded-xl px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || loading}
                className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;