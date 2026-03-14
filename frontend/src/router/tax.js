const routes = [
	{
		name: "TaxDeclarationListView",
		path: "/tax-declarations",
		component: () => import("@/views/tax/List.vue"),
	},
	{
		name: "TaxDeclarationFormView",
		path: "/tax-declarations/new",
		component: () => import("@/views/tax/Form.vue"),
	},
	{
		name: "TaxDeclarationDetailView",
		path: "/tax-declarations/:id",
		props: true,
		component: () => import("@/views/tax/Form.vue"),
	},
]

export default routes
