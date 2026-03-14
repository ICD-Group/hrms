import { createRouter, createWebHistory } from "@ionic/vue-router"

import TabbedView from "@/views/TabbedView.vue"
import attendanceRoutes from "./attendance"
import leaveRoutes from "./leaves"
import claimRoutes from "./claims"
import employeeAdvanceRoutes from "./advances"
import salarySlipRoutes from "./salary_slips"
import geniusRoutes from "./genius"
import managerRoutes from "./manager"
import trainingRoutes from "./training"
import appraisalRoutes from "./appraisal"
import travelRoutes from "./travel"
import grievanceRoutes from "./grievance"
import loanRoutes from "./loan"
import taxRoutes from "./tax"
import benefitsRoutes from "./benefits"
import documentCenterRoutes from "./document_center"
import disciplinaryRoutes from "./disciplinary"

const routes = [
	{
		path: "/",
		redirect: "/home",
	},
	{
		path: "/",
		component: TabbedView,
		children: [
			{
				path: "",
				redirect: "/home",
			},
			// ============================
			// EMPLOYEE TAB ROUTES
			// ============================
			{
				path: "/home",
				name: "Home",
				component: () => import("@/views/Home.vue"),
			},
			{
				path: "/dashboard/attendance",
				name: "AttendanceDashboard",
				component: () => import("@/views/attendance/Dashboard.vue"),
			},
			{
				path: "/dashboard/leaves",
				name: "LeavesDashboard",
				component: () => import("@/views/leave/Dashboard.vue"),
			},
			{
				path: "/dashboard/expense-claims",
				name: "ExpenseClaimsDashboard",
				component: () => import("@/views/expense_claim/Dashboard.vue"),
			},
			{
				path: "/dashboard/salary-slips",
				name: "SalarySlipsDashboard",
				component: () => import("@/views/salary_slip/Dashboard.vue"),
			},
			...geniusRoutes,
			// ============================
			// MANAGER TAB ROUTES
			// ============================
			{
				path: "/manager",
				redirect: "/manager/dashboard",
			},
			{
				path: "/manager/dashboard",
				name: "ManagerDashboard",
				component: () => import("@/views/manager/Dashboard.vue"),
			},
			{
				path: "/manager/employees",
				name: "ManagerEmployees",
				component: () => import("@/views/manager/Employees.vue"),
			},
			{
				path: "/manager/approvals",
				name: "ManagerApprovals",
				component: () => import("@/views/manager/Approvals.vue"),
			},
			{
				path: "/manager/command",
				name: "ManagerCommand",
				component: () => import("@/views/manager/CommandCenter.vue"),
			},
			{
				path: "/manager/reports",
				name: "ManagerReports",
				component: () => import("@/views/manager/Reports.vue"),
			},
			{
				path: "/manager/settings",
				name: "ManagerSettings",
				component: () => import("@/views/manager/Settings.vue"),
			},
			{
				path: "/manager/salary",
				name: "ManagerSalary",
				component: () => import("@/views/manager/PayrollHub.vue"),
			},
			{
				path: "/my-requests",
				name: "MyRequestsList",
				component: () => import("@/views/MyRequestsList.vue"),
			},
			// ============================
			// ALL FEATURE LIST/DETAIL/FORM ROUTES
			// (inside TabbedView = bottom tabs always visible)
			// ============================
			...attendanceRoutes,
			...leaveRoutes,
			...claimRoutes,
			...employeeAdvanceRoutes,
			...salarySlipRoutes,
			...managerRoutes,
			...trainingRoutes,
			...appraisalRoutes,
			...travelRoutes,
			...grievanceRoutes,
			...loanRoutes,
			...taxRoutes,
			...benefitsRoutes,
			...documentCenterRoutes,
			...disciplinaryRoutes,
			// ============================
			// UTILITY PAGES (inside TabbedView for bottom tabs)
			// ============================
			{
				path: "/profile",
				name: "Profile",
				component: () => import("@/views/Profile.vue"),
			},
			{
				path: "/settings",
				name: "Settings",
				component: () => import("@/views/AppSettings.vue"),
			},
		],
	},
	{
		path: "/login",
		name: "Login",
		component: () => import("@/views/Login.vue"),
	},
	{
		path: "/invalid-employee",
		name: "InvalidEmployee",
		component: () => import("@/views/InvalidEmployee.vue"),
	},
]

const router = createRouter({
	history: createWebHistory("/hrms"),
	routes,
})

export default router
