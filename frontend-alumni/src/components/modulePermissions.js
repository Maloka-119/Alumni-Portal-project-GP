import AlumniManagement from "../pages/admin/AlumniManagement";
import GraduateRequests from "../pages/admin/GraduateRequests";
import StaffManagement from "../pages/admin/StaffManagement";
import GroupsPage from "../pages/admin/GroupsPage";
import GroupDetail from "../pages/admin/GroupDetail";
import AdminPostsPage from "../pages/admin/AdminPostsPage";
import UsersPostsPage from "../pages/admin/UsersPostsPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import EmptyPage from "../pages/admin/EmptyPage";
import FAQManage from "../pages/admin/FAQManage";
import { Users, UserCheck, FileText, MessageCircle, Grid, File, Clipboard, Globe } from "lucide-react";

export const modulesConfig = [
    { id: 1, name: "Graduate management", path: "alumniManagement", component: AlumniManagement, permKey: "Graduate management", icon: <Users size={16} /> },
    { id: 2, name: "Others Requests management", path: "otherRequests", component: GraduateRequests, permKey: "Others Requests management", icon: <Clipboard size={16} /> },
    { id: 3, name: "Staff management", path: "staffManagement", component: StaffManagement, permKey: "Staff management", icon: <UserCheck size={16} /> },
    {
      id: 4,
      name: "Communities management",
      path: "communityManagement",
      component: GroupsPage,
      permKey: "Communities management",
      icon: <MessageCircle size={16} />,
      children: [
        {
          id: 5,
          name: "Community Post's management",
          path: "posts",
          component: GroupDetail,
          permKey: "Community Post's management",
          icon: <File size={16} />,
        },
        {
          id: 6,
          name: "Community Members management",
          path: "members",
          component: GroupDetail,
          permKey: "Community Members management",
          icon: <Users size={16} />,
        },
      ],
    },
    { id: 7, name: "Portal posts management", path: "portalPosts", component: AdminPostsPage, permKey: "Portal posts management", icon: <FileText size={16} /> },
    { id: 8, name: "Graduates posts management", path: "graduatesPosts", component: UsersPostsPage, permKey: "Graduates posts management", icon: <FileText size={16} /> },
    { id: 9, name: "Portal Reports", path: "reportsAnalysis", component: AdminDashboard, permKey: "Portal Reports", icon: <Grid size={16} /> },
    { id: 10, name: "Document Requests management", path: "documentManagement", component: () => <EmptyPage title="Document Requests" />, permKey: "Document Requests management", icon: <File size={16} /> },
    { id: 11, name: "Consultation management", path: "consultationRequests", component: () => <EmptyPage title="Consultations" />, permKey: "Consultation management", icon: <Clipboard size={16} /> },
    { id: 12, name: "FAQ management", path: "faqManage", component: FAQManage, permKey: "FAQ management", icon: <Globe size={16} /> },
];
