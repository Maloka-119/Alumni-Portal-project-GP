// import AlumniManagement from "../pages/admin/AlumniManagement";
// import GraduateRequests from "../pages/admin/GraduateRequests";
// import StaffManagement from "../pages/admin/StaffManagement";
// import GroupsPage from "../pages/admin/GroupsPage";
// import GroupDetail from "../pages/admin/GroupDetail";
// import AdminPostsPage from "../pages/admin/AdminPostsPage";
// import UsersPostsPage from "../pages/admin/UsersPostsPage";
// import AdminDashboard from "../pages/admin/AdminDashboard";
// import EmptyPage from "../pages/admin/EmptyPage";
// import FAQManage from "../pages/admin/FAQManage";
// import FeedbackView from "../pages/admin/FeedbackView";
// import RolesManagement from "../pages/admin/RolesManagement";
// import { Users, UserCheck, FileText, MessageCircle, Grid, File, Clipboard, Globe, Layers, FileMinus, UserPlus ,BarChart, FilePlus2 ,MessageSquare ,Shield} from "lucide-react";

// export const modulesConfig = [
//   { id: 1, nameKey: "graduateManagement", path: "alumniManagement", component: AlumniManagement, permKey: "Graduate management", icon: <Users size={16} /> },
//   { id: 2, nameKey: "othersRequests", path: "otherRequests", component: GraduateRequests, permKey: "Others Requests management", icon: <Clipboard size={16} /> },
//   { id: 3, nameKey: "staffManagement", path: "staffManagement", component: StaffManagement, permKey: "Staff management", icon: <UserCheck size={16} /> },
//   {
//     id: 4,
//     nameKey: "communitiesManagement",
//     path: "communityManagement",
//     component: GroupsPage,
//     permKey: "Communities management",
//     icon: <Layers size={16} />,
//     children: [
//       {
//         id: 5,
//         nameKey: "communityPostsManagement",
//         path: "posts",
//         component: GroupDetail,
//         permKey: "Community Post's management",
//         icon: <FileMinus size={16} />,
//       },
//       {
//         id: 6,
//         nameKey: "communityMembersManagement",
//         path: "members",
//         component: GroupDetail,
//         permKey: "Community Members management",
//         icon: <UserPlus size={16} />,
//       },
//     ],
//   },
//   { id: 7, nameKey: "portalPostsManagement", path: "portalPosts", component: AdminPostsPage, permKey: "Portal posts management", icon: <FilePlus2 size={16} /> },
//   { id: 8, nameKey: "graduatesPostsManagement", path: "graduatesPosts", component: UsersPostsPage, permKey: "Graduates posts management", icon: <Grid size={16} /> },
//   { id: 9, nameKey: "portalReports", path: "reportsAnalysis", component: AdminDashboard, permKey: "Portal Reports", icon: <BarChart size={16} /> },
//   { id: 10, nameKey: "documentRequestsManagement", path: "documentManagement", component: () => <EmptyPage title="Document Requests" />, permKey: "Document Requests management", icon: <FileText size={16} /> },
//   { id: 11, nameKey: "consultationManagement", path: "consultationRequests", component: () => <EmptyPage title="Consultations" />, permKey: "Consultation management", icon: <MessageCircle size={16} /> },
//   { id: 12, nameKey: "faqManagement", path: "faqManage", component: FAQManage, permKey: "FAQ management", icon: <Globe size={16} /> },
//   { id: 13, nameKey: "GraduatedFeedback", path: "GraduatedFeedback", component: FeedbackView, permKey: "Graduates Feedback", icon: <MessageSquare size={16} /> },
//   { id: 14, nameKey: "rolesManagement", path: "rolesmanagement", component: RolesManagement, permKey: "Roles and Permissions Management", icon: <Shield size={16} /> },
// ];

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
import FeedbackView from "../pages/admin/FeedbackView";
import RolesManagement from "../pages/admin/RolesManagement";
import UniversityServicesAdmin from '../pages/admin/UniversityServicesAdmin.jsx'
import { Users, UserCheck, FileText, MessageCircle, Grid, File, Clipboard, Globe, Layers, FileMinus, UserPlus ,BarChart, FilePlus2 ,MessageSquare ,Shield} from "lucide-react";

export const modulesConfig = [
  { id: 1, nameKey: "graduateManagement", path: "alumniManagement", component: AlumniManagement, permKey: "Graduate management", icon: <Users size={16} /> },
  { id: 2, nameKey: "othersRequests", path: "otherRequests", component: GraduateRequests, permKey: "Others Requests management", icon: <Clipboard size={16} /> },
  { id: 3, nameKey: "staffManagement", path: "staffManagement", component: StaffManagement, permKey: "Staff management", icon: <UserCheck size={16} /> },
  {
    id: 4,
    nameKey: "communitiesManagement",
    path: "communityManagement",
    component: GroupsPage,
    permKey: "Communities management",
    icon: <Layers size={16} />,
    children: [
      {
        id: 5,
        nameKey: "communityPostsManagement",
        path: "posts",
        component: GroupDetail,
        permKey: "Community Post's management",
        icon: <FileMinus size={16} />,
      },
      {
        id: 6,
        nameKey: "communityMembersManagement",
        path: "members",
        component: GroupDetail,
        permKey: "Community Members management",
        icon: <UserPlus size={16} />,
      },
    ],
  },
  { id: 7, nameKey: "portalPostsManagement", path: "portalPosts", component: AdminPostsPage, permKey: "Portal posts management", icon: <FilePlus2 size={16} /> },
  { id: 8, nameKey: "graduatesPostsManagement", path: "graduatesPosts", component: UsersPostsPage, permKey: "Graduates posts management", icon: <Grid size={16} /> },
  { id: 9, nameKey: "portalReports", path: "reportsAnalysis", component: AdminDashboard, permKey: "Portal Reports", icon: <BarChart size={16} /> },
  { id: 10, nameKey: "documentRequestsManagement", path: "documentManagement", component: () => <EmptyPage title="Document Requests" />, permKey: "Document Requests management", icon: <FileText size={16} /> },
  { 
    id: 11, 
    nameKey: "servicesManagement", // الاسم في الباك يفضل زي ما هو
    path: "universityServices", // المسار الجديد في الفرونت
    component: UniversityServicesAdmin, // الصفحة الجديدة
    permKey: "Services management", // صلاحية التحكم
    icon: <Clipboard size={16} /> // أيقونة مناسبة
  },
  
  { id: 12, nameKey: "faqManagement", path: "faqManage", component: FAQManage, permKey: "FAQ management", icon: <Globe size={16} /> },
  { id: 13, nameKey: "GraduatedFeedback", path: "GraduatedFeedback", component: FeedbackView, permKey: "Graduates Feedback", icon: <MessageSquare size={16} /> },
  { id: 14, nameKey: "rolesManagement", path: "rolesmanagement", component: RolesManagement, permKey: "Roles and Permissions Management", icon: <Shield size={16} /> },
];
