import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dashboard as DashboardIcon,
  Assessment,
  Create as CreateIcon,
  PlayArrow as PlayArrowIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  ChevronLeft,
  ChevronRight,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import ApiIcon from "@mui/icons-material/Api";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";

function Sidebar({ isMobile, sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const [userData, setUserData] = useState({ name: "User", organization: "Company" });

  useEffect(() => {
    try {
      const localUser = JSON.parse(localStorage.getItem("user")) || {};
      setUserData({
        name: localUser.name ?? "User",
        organization: localUser.organization ?? "N/A",
      });
    } catch (err) {
      console.warn("Failed to parse local user:", err);
    }
  }, []);

  const sections = [
    {
      title: "Features",
      items: [
        { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
        { name: "Create Test", icon: <CreateIcon />, path: "/test-plan-generation" },
        { name: "Run Test", icon: <PlayArrowIcon />, path: "/run-test" },
        { name: "Analysis", icon: <Assessment />, path: "/intelligent-test-analysis" },
        { name: "Comparison", icon: <BarChartIcon />, path: "/performance-comparison" },
      ],
    },
    {
      title: "API's & Integrations",
      items: [
        { name: "API's", icon: <ApiIcon />, path: "/api-integration" },
        { name: "Jenkins", icon: <BuildCircleIcon />, path: "/jenkins-integration" },
      ],
    },
    {
  title: "Plans & Billing",
  items: [
    { name: "Pricing", icon: <CurrencyExchangeIcon />, path: "/payment" },
    { name: "User Guide", icon: <BarChartIcon />, path: "/user-guide" }, // 📘 Added new tab
  ],
},

  ];

  const sidebarBaseWidth = isCollapsed ? "w-20" : "w-56";
  const Divider = () => (
    <div className="mt-2">
      <div className="!h-[2px] bg-white/40 w-full" />
    </div>
  );

  return (
    <aside
      className={`fixed ${isMobile ? "top-20 h-[calc(100vh-80px)] pt-6" : "top-0 h-screen"} left-0 
    transform transition-all duration-300 ease-in-out
    bg-gradient-to-b from-red-400 to-orange-400 shadow-lg text-white font-poppins z-[1300]
    ${isMobile
          ? (sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64")
          : `${sidebarBaseWidth} translate-x-0`}
`}
    >

      <div className="flex flex-col h-full">

        {/* Collapse Toggle only for desktop */}
        {!isMobile && (
          <div
            className={`flex items-center mt-20 px-2 py-3 transition-all duration-300 ease-in-out
            ${isCollapsed ? "justify-center" : "justify-end"}`}
          >
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="!bg-white !text-orange-700 shadow-md border border-gray-200 transition-all duration-300 ease-in-out hover:!bg-orange-100 hover:!text-orange-900"
              size="small"
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent px-2">
          {sections.map((section, index) => (
            <div key={section.title} className="mb-6">
              {!isCollapsed ? (
                <div className="pt-2 pb-1 px-4">
                  <div className="text-xs uppercase tracking-wide text-white/80 font-semibold">
                    {section.title}
                  </div>
                  <Divider />
                </div>
              ) : (
                index !== 0 && (
                  <div className="pt-2 pb-1 px-2">
                    <Divider />
                  </div>
                )
              )}

              <ul className="space-y-2 mt-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-300
                          ${isActive
                            ? "bg-white text-[#303952] bg-opacity-20 border-l-4 border-[#303952]"
                            : "hover:bg-white hover:text-orange-300 hover:bg-opacity-10"}
                          ${isCollapsed ? "justify-center" : ""}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <span className="text-orange-800">{item.icon}</span>
                        {(!isMobile && !isCollapsed) || isMobile ? (<span className="text-sm font-medium truncate">{item.name}</span>) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
