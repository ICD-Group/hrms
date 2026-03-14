const routes = [
	{
		name: "LoanApplicationListView",
		path: "/loan-applications",
		component: () => import("@/views/loan/List.vue"),
	},
	{
		name: "LoanApplicationFormView",
		path: "/loan-applications/new",
		component: () => import("@/views/loan/Form.vue"),
	},
	{
		name: "LoanApplicationDetailView",
		path: "/loan-applications/:id",
		props: true,
		component: () => import("@/views/loan/Form.vue"),
	},
]

export default routes
