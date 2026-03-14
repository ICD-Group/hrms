const routes = [
	{
		name: "TravelRequestListView",
		path: "/travel-requests",
		component: () => import("@/views/travel/List.vue"),
	},
	{
		name: "TravelRequestFormView",
		path: "/travel-requests/new",
		component: () => import("@/views/travel/Form.vue"),
	},
	{
		name: "TravelRequestDetailView",
		path: "/travel-requests/:id",
		props: true,
		component: () => import("@/views/travel/Form.vue"),
	},
]

export default routes
