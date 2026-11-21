import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "📊",
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: "💳",
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: "📈",
  },
  {
    name: "Settings",
    path: "/settings",
    icon: "⚙️",
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white p-5">
      <h1 className="mb-10 text-2xl font-bold">
        Expense<span className="text-blue-600">Track</span>
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;