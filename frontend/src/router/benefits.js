const routes = [
	{
		name: "BenefitApplicationListView",
		path: "/benefit-applications",
		component: () => import("@/views/benefits/List.vue"),
	},
	{
		name: "BenefitApplicationFormView",
		path: "/benefit-applications/new",
		component: () => import("@/views/benefits/Form.vue"),
	},
	{
		name: "BenefitApplicationDetailView",
		path: "/benefit-applications/:id",
		props: true,
		component: () => import("@/views/benefits/Form.vue"),
	},
]

export default routes
