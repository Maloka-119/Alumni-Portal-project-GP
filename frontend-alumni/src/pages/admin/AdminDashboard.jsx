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
import { getPermission } from '../../components/usePermission';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Card = ({ children, className = "" }) => (
  <div className={`dashboard-card ${className}`}>{children}</div>
);

const CardContent = ({ children }) => (
  <div className="dashboard-card-content">{children}</div>
);

function AdminDashboard({ currentUser }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const perm = currentUser?.userType === "admin"
  ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
  : getPermission("Graduates Feedback", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await API.get("/reports-stats");
        setData(response.data.data); 
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(t("errorFetchingDashboard"));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <p className="loading-text">{t("loadingDashboard")}</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">{t("No data available")}</p>;

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
    graduatesByFaculty = [], 
    staffRoles = [], 
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

  
  const facultyChartData = {
    labels: graduatesByFaculty.map((f) => f.faculty || t("Unknown")),
    datasets: [{ 
      label: t("GraduatesByFaculty"), 
      data: graduatesByFaculty.map((f) => f.count), 
      backgroundColor: "rgba(37,99,235,0.6)", 
      borderRadius: 5 
    }],
  };

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
  
  if (!perm.canView) return <p>{t("noPermission")}</p>;

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
