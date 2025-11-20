import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Analysis.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Card = ({ children, className = "" }) => (
  <div className={`dashboard-card ${className}`}>{children}</div>
);

const CardContent = ({ children }) => (
  <div className="dashboard-card-content">{children}</div>
);

function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await API.get("/reports-stats");
        setData(response.data.data); // ⬅️ غير هنا من response.data إلى response.data.data
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ⬅️ أضف loading و error handling
  if (loading) return <p className="loading-text">{t("loadingDashboard")}</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">No data available</p>;

  const {
    totalGraduates,
    activeGraduates,
    inactiveGraduates,
    acceptedGraduates,
    pendingGraduates,
    rejectedGraduates,
    totalStaff,
    activeStaff,
    inactiveStaff,
    postsByGraduates,
    postsByStaff,
    graduatesByFaculty = [], // ⬅️ قيم افتراضية
    staffRoles = [], // ⬅️ قيم افتراضية
  } = data;

  const graduatesActivePercentage = totalGraduates > 0 ? Math.round((activeGraduates / totalGraduates) * 100) : 0;
  const staffActivePercentage = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

  const graduatesStatusData = {
    labels: [t("Accepted"), t("Pending"), t("Rejected")],
    datasets: [{ data: [acceptedGraduates, pendingGraduates, rejectedGraduates], backgroundColor: ["#16a34a", "#facc15", "#ef4444"] }],
  };

  const postsData = {
    labels: [t("GraduatesPosts"), t("StaffPosts")],
    datasets: [{ data: [postsByGraduates, postsByStaff], backgroundColor: ["#3b82f6", "#8b5cf6"] }],
  };

  const graduatesActivityData = {
    labels: [t("Active"), t("Inactive")],
    datasets: [{ data: [activeGraduates, inactiveGraduates], backgroundColor: ["#22c55e", "#cbd5e1"] }],
  };

  const staffActivityData = {
    labels: [t("Active"), t("Inactive")],
    datasets: [{ data: [activeStaff, inactiveStaff], backgroundColor: ["#10b981", "#cbd5e1"] }],
  };

  // ⬅️ تحقق من graduatesByFaculty قبل map
  const facultyChartData = {
    labels: graduatesByFaculty.map((f) => f.faculty || t("Unknown")),
    datasets: [{ 
      label: t("GraduatesByFaculty"), 
      data: graduatesByFaculty.map((f) => f.count), 
      backgroundColor: "rgba(37,99,235,0.6)", 
      borderRadius: 5 
    }],
  };

  // ⬅️ تحقق من staffRoles قبل map
  const rolesChartData = {
    labels: staffRoles.map((r) => r.Role ? r.Role["role-name"] : t("Unknown")),
    datasets: [{ 
      label: t("StaffByRole"), 
      data: staffRoles.map((r) => r.count), 
      backgroundColor: "rgba(236,72,153,0.6)", 
      borderRadius: 5 
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, padding: 8, boxWidth: 8, font: { size: 10 } } },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } },
  };

  return (
    <div className="dashboard-container">
      <h1 style={{ color: "#4f46e5" }}>{t("PortalReports")}</h1>

      <div className="dashboard-row">
        <Card>
          <CardContent>
            <h2 className="card-title">{t("ActiveGraduates")}</h2>
            <div className="chart-box">
              <Pie data={graduatesActivityData} options={pieOptions} />
            </div>
            <p className="card-number">{activeGraduates}</p>
            <p className="card-sub">{graduatesActivePercentage}% {t("ofTotal")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="card-title">{t("ActiveStaff")}</h2>
            <div className="chart-box">
              <Pie data={staffActivityData} options={pieOptions} />
            </div>
            <p className="card-number">{activeStaff}</p>
            <p className="card-sub">{staffActivePercentage}% {t("ofTotal")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-row">
        <Card>
          <CardContent>
            <h2 className="card-title">{t("GraduatesStatus")}</h2>
            <div className="chart-box">
              <Pie data={graduatesStatusData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="card-title">{t("PostsDistribution")}</h2>
            <div className="chart-box">
              <Pie data={postsData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-row">
        <Card>
          <CardContent>
            <h2 className="card-title">{t("GraduatesByFaculty")}</h2>
            <div className="bar-box">
              <Bar data={facultyChartData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="card-title">{t("StaffByRole")}</h2>
            <div className="bar-box">
              <Bar data={rolesChartData} options={barOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;

// import React, { useEffect, useState } from "react";
// import API from "../../services/api";
// import { Bar, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// // 🔹 Card Component محسّن
// const Card = ({ children, className = "" }) => (
//   <div className={`bg-white shadow-lg rounded-xl p-3 hover:shadow-xl transition-all duration-300 flex flex-col items-center border border-gray-100 w-[350px] ${className}`}>
//     {children}
//   </div>
// );

// const CardContent = ({ children }) => (
//   <div className="w-[300px] flex flex-col items-center">
//     {children}
//   </div>
// );

// function AdminDashboard() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         const response = await API.get("/reports-stats");
//         setData(response.data);
//       } catch (error) {
//         console.error("Error fetching dashboard data:", error);
//       }
//     };
//     fetchDashboardData();
//   }, []);

//   if (!data) return <p className="text-center mt-10 text-gray-600">Loading dashboard...</p>;

//   const {
//     totalGraduates,
//     activeGraduates,
//     inactiveGraduates,
//     acceptedGraduates,
//     pendingGraduates,
//     rejectedGraduates,
//     totalStaff,
//     activeStaff,
//     inactiveStaff,
//     postsByGraduates,
//     postsByStaff,
//     graduatesByFaculty,
//     staffRoles,
//   } = data;

//   const graduatesActivePercentage = totalGraduates > 0 ? Math.round((activeGraduates / totalGraduates) * 100) : 0;
//   const staffActivePercentage = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

//   // Pie Charts Data
//   const graduatesStatusData = {
//     labels: ["✅ Accepted", "🕓 Pending", "❌ Rejected"],
//     datasets: [{ data: [acceptedGraduates, pendingGraduates, rejectedGraduates], backgroundColor: ["#4CAF50", "#FFC107", "#F44336"] }],
//   };

//   const postsData = {
//     labels: ["Graduates Posts", "Staff Posts"],
//     datasets: [{ data: [postsByGraduates, postsByStaff], backgroundColor: ["#2196F3", "#9C27B0"] }],
//   };

//   const graduatesActivityData = {
//     labels: ["Active", "Inactive"],
//     datasets: [{ data: [activeGraduates, inactiveGraduates], backgroundColor: ["#00C853", "#B0BEC5"] }],
//   };

//   const staffActivityData = {
//     labels: ["Active", "Inactive"],
//     datasets: [{ data: [activeStaff, inactiveStaff], backgroundColor: ["#10B981", "#B0BEC5"] }],
//   };

//   // Bar Charts Data
//   const facultyChartData = {
//     labels: graduatesByFaculty.map((f) => f.faculty || "Unknown"),
//     datasets: [{ label: "Graduates by Faculty", data: graduatesByFaculty.map((f) => f.count), backgroundColor: "rgba(54, 162, 235, 0.6)", borderRadius: 5 }],
//   };

//   const rolesChartData = {
//     labels: staffRoles.map((r) => r.Role["role-name"]),
//     datasets: [{ label: "Staff by Role", data: staffRoles.map((r) => r.count), backgroundColor: "rgba(255, 99, 132, 0.6)", borderRadius: 5 }],
//   };

//   const pieOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "bottom", labels: { usePointStyle: true, padding: 6, boxWidth: 6, font: { size: 8 } } },
//       tooltip: { enabled: true, bodyFont: { size: 8 } },
//     },
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: { legend: { display: false } },
//     maintainAspectRatio: false,
//     scales: {
//       x: { ticks: { font: { size: 8 } } },
//       y: { ticks: { font: { size: 8 } } },
//     },
//   };

//   return (
//     <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">📊 Admin Dashboard</h1>

//       {/* 🔹 الصف الأول: Active Graduates و Active Staff */}
//       <div className="flex flex-wrap justify-center gap-4 mb-4">
//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Active Graduates</h2>
//             <div className="w-32 h-32 mb-2">
//               <Pie data={graduatesActivityData} options={pieOptions} />
//             </div>
//             <p className="text-lg font-bold text-purple-600 text-center">{activeGraduates}</p>
//             <p className="text-xs font-medium text-gray-600 text-center mb-1">{graduatesActivePercentage}% of total</p>
//             <p className="text-xs text-gray-500 text-center">Currently active</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Active Staff</h2>
//             <div className="w-32 h-32 mb-2">
//               <Pie data={staffActivityData} options={pieOptions} />
//             </div>
//             <p className="text-lg font-bold text-green-600 text-center">{activeStaff}</p>
//             <p className="text-xs font-medium text-gray-600 text-center mb-1">{staffActivePercentage}% of total</p>
//             <p className="text-xs text-gray-500 text-center">Currently active</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* 🔹 الصف الثاني: Graduates Status و Posts Distribution */}
//       <div className="flex flex-wrap justify-center gap-4 mb-4">
//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Graduates Status</h2>
//             <div className="w-32 h-32 mb-2">
//               <Pie data={graduatesStatusData} options={pieOptions} />
//             </div>
//             <p className="text-xs font-medium text-gray-600 text-center mb-1">Status Distribution</p>
//             <p className="text-xs text-gray-500 text-center">✅ {acceptedGraduates} | 🕓 {pendingGraduates} | ❌ {rejectedGraduates}</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Posts Distribution</h2>
//             <div className="w-32 h-32 mb-2">
//               <Pie data={postsData} options={pieOptions} />
//             </div>
//             <p className="text-xs font-medium text-gray-600 text-center mb-1">Content Activity</p>
//             <p className="text-xs text-gray-500 text-center">Graduates: {postsByGraduates} | Staff: {postsByStaff}</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* 🔹 الصف الثالث: Graduates by Faculty و Staff by Role */}
//       <div className="flex flex-wrap justify-center gap-4">
//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Graduates by Faculty</h2>
//             <div className="w-full h-36">
//               <Bar data={facultyChartData} options={barOptions} />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent>
//             <h2 className="text-sm font-bold mb-2 text-gray-700 text-center">Staff by Role</h2>
//             <div className="w-full h-36">
//               <Bar data={rolesChartData} options={barOptions} />
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;
