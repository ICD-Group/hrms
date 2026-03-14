// Manager DETAIL routes (outside TabbedView - no bottom tabs)
// Tab routes (Dashboard, Employees, Approvals, Reports, Settings)
// are in index.js inside TabbedView children
const managerRoutes = [
	{
		path: "/manager/attendance",
		name: "ManagerAttendance",
		component: () => import("@/views/manager/AttendanceOverview.vue"),
	},
	{
		path: "/manager/mark-attendance",
		name: "ManagerMarkAttendance",
		component: () => import("@/views/manager/MarkAttendance.vue"),
	},
	{
		path: "/manager/monthly-attendance",
		name: "ManagerMonthlyAttendance",
		component: () => import("@/views/manager/MonthlyAttendance.vue"),
	},
	{
		path: "/manager/leave-balance",
		name: "ManagerLeaveBalance",
		component: () => import("@/views/manager/LeaveBalance.vue"),
	},
	{
		path: "/manager/leave-allocation",
		name: "ManagerLeaveAllocation",
		component: () => import("@/views/manager/LeaveAllocation.vue"),
	},
	{
		path: "/manager/shift-assignment",
		name: "ManagerShiftAssignment",
		component: () => import("@/views/manager/ShiftAssignment.vue"),
	},
	{
		path: "/manager/late-excuses",
		name: "ManagerLateExcuses",
		component: () => import("@/views/manager/LateExcuses.vue"),
	},
{
		path: "/manager/salary/approvals",
		name: "PayrollApprovals",
		component: () => import("@/views/manager/PayrollApprovals.vue"),
	},
	{
		path: "/manager/salary/structures",
		name: "SalaryStructures",
		component: () => import("@/views/manager/SalaryStructures.vue"),
	},
	{
		path: "/manager/salary/additional",
		name: "AdditionalSalary",
		component: () => import("@/views/manager/AdditionalSalary.vue"),
	},
	{
		path: "/manager/salary/loans",
		name: "LoanManagement",
		component: () => import("@/views/manager/LoanManagement.vue"),
	},
	{
		path: "/manager/salary/employees",
		name: "PayrollEmployees",
		component: () => import("@/views/manager/PayrollEmployees.vue"),
	},
	{
		path: "/manager/salary/earnings",
		name: "PayrollEarnings",
		component: () => import("@/views/manager/PayrollEarnings.vue"),
	},
	{
		path: "/manager/salary/deductions",
		name: "PayrollDeductions",
		component: () => import("@/views/manager/PayrollDeductions.vue"),
	},
	{
		path: "/manager/salary/actions",
		name: "PayrollActions",
		component: () => import("@/views/manager/PayrollActions.vue"),
	},
	{
		path: "/manager/salary/employee/:employee",
		name: "PayrollEmployeeDetail",
		component: () => import("@/views/manager/PayrollEmployeeDetail.vue"),
	},
	{
		path: "/manager/meal-approvals",
		name: "MealApprovals",
		component: () => import("@/views/manager/MealApprovals.vue"),
	},
	{
		path: "/manager/meal-orders",
		name: "MealOrders",
		component: () => import("@/views/manager/MealOrders.vue"),
	},
	{
		path: "/manager/permission-approvals",
		name: "PermissionApprovals",
		component: () => import("@/views/manager/PermissionApprovals.vue"),
	},
	{
		path: "/manager/attendance-report",
		name: "ManagerAttendanceReport",
		component: () => import("@/views/manager/AttendanceReport.vue"),
	},
	{
		path: "/manager/late-penalty-report",
		name: "LatePenaltyReport",
		component: () => import("@/views/manager/LatePenaltyReport.vue"),
	},
	{
		path: "/manager/earnings-report",
		name: "EarningsReport",
		component: () => import("@/views/manager/EarningsReport.vue"),
	},
	{
		path: "/manager/leave-report",
		name: "LeaveReport",
		component: () => import("@/views/manager/LeaveReport.vue"),
	},
	{
		path: "/manager/productivity-report",
		name: "ProductivityReport",
		component: () => import("@/views/manager/ProductivityReport.vue"),
	},
	{
		path: "/manager/wfh-report",
		name: "WFHReport",
		component: () => import("@/views/manager/WFHReport.vue"),
	},
	{
		path: "/manager/employee-performance",
		name: "EmployeePerformanceReport",
		component: () => import("@/views/manager/EmployeePerformanceReport.vue"),
	},
	{
		path: "/manager/leaderboard-report",
		name: "LeaderboardReport",
		component: () => import("@/views/manager/LeaderboardReport.vue"),
	},
	{
		path: "/manager/sales-performance",
		name: "ManagerSalesPerformance",
		component: () => import("@/views/manager/SalesPerformance.vue"),
	},
]

export default managerRoutes
