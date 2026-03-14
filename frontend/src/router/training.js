const routes = [
	{
		name: "TrainingEventListView",
		path: "/training-events",
		component: () => import("@/views/training/List.vue"),
	},
	{
		name: "TrainingEventDetailView",
		path: "/training-events/:id",
		props: true,
		component: () => import("@/views/training/Detail.vue"),
	},
]

export default routes
