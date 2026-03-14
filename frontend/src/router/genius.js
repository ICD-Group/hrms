const geniusRoutes = [
	{
		path: "genius",
		name: "GeniusDashboard",
		component: () => import("@/views/genius/Dashboard.vue"),
	},
	{
		path: "genius/inbox",
		name: "GeniusInbox",
		component: () => import("@/views/genius/GeniusInbox.vue"),
	},
	{
		path: "genius/insights",
		name: "GeniusInsights",
		component: () => import("@/views/genius/Insights.vue"),
	},
	{
		path: "genius/leaderboard",
		name: "GeniusLeaderboard",
		component: () => import("@/views/genius/Leaderboard.vue"),
	},
	{
		path: "genius/badges",
		name: "GeniusBadges",
		component: () => import("@/views/genius/Badges.vue"),
	},
	{
		path: "genius/analytics",
		name: "GeniusAnalytics",
		component: () => import("@/views/genius/Analytics.vue"),
	},
	{
		path: "genius/rewards",
		name: "GeniusRewards",
		component: () => import("@/views/genius/Rewards.vue"),
	},
	{
		path: "genius/team",
		name: "GeniusTeamCalendar",
		component: () => import("@/views/genius/TeamCalendar.vue"),
	},
	{
		path: "genius/challenges",
		name: "GeniusChallenges",
		component: () => import("@/views/genius/Challenges.vue"),
	},
	{
		path: "genius/achievements",
		name: "GeniusAchievements",
		component: () => import("@/views/genius/Achievements.vue"),
	},
	{
		path: "genius/compliance",
		name: "GeniusCompliance",
		component: () => import("@/views/genius/Compliance.vue"),
	},
	{
		path: "genius/profile",
		name: "GeniusProfile",
		component: () => import("@/views/genius/GeniusProfile.vue"),
	},
	{
		path: "genius/salary",
		name: "GeniusSalary",
		component: () => import("@/views/genius/SalaryDetails.vue"),
	},
	{
		path: "genius/salary/slip/:name",
		name: "GeniusSalarySlip",
		component: () => import("@/views/genius/SalarySlipView.vue"),
	},
	{
		path: "genius/leaves",
		name: "GeniusLeaves",
		component: () => import("@/views/genius/LeaveManagement.vue"),
	},
	{
		path: "genius/settings",
		name: "GeniusSettings",
		component: () => import("@/views/genius/GeniusSettings.vue"),
	},
	{
		path: "genius/work-request",
		name: "GeniusWorkRequest",
		component: () => import("@/views/genius/WorkRequestForm.vue"),
	},
	{
		path: "genius/meal-claim",
		name: "MealClaimFormView",
		component: () => import("@/views/genius/MealClaimForm.vue"),
	},
	{
		path: "genius/my-meals",
		name: "MyMealRequests",
		component: () => import("@/views/genius/MyMealRequests.vue"),
	},
	{
		path: "genius/attendance-correction",
		name: "GeniusAttendanceCorrection",
		component: () => import("@/views/genius/AttendanceCorrection.vue"),
	},
	{
		path: "genius/permission",
		name: "GeniusPermission",
		component: () => import("@/views/genius/PermissionForm.vue"),
	},
	{
		path: "genius/my-permissions",
		name: "MyPermissions",
		redirect: { name: "GeniusPermission" },
	},
	{
		path: "genius/my-history",
		name: "GeniusMyHistory",
		component: () => import("@/views/genius/MyHistory.vue"),
	},
	{
		path: "genius/sales-score",
		name: "GeniusSalesScore",
		component: () => import("@/views/genius/SalesScore.vue"),
	},
	{
		path: "genius/sales-leaderboard",
		name: "GeniusSalesLeaderboard",
		component: () => import("@/views/genius/SalesLeaderboard.vue"),
	},
]

export default geniusRoutes
