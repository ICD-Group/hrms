const routes = [
	{
		name: "AppraisalListView",
		path: "/appraisals",
		component: () => import("@/views/appraisal/List.vue"),
	},
	{
		name: "AppraisalDetailView",
		path: "/appraisals/:id",
		props: true,
		component: () => import("@/views/appraisal/Detail.vue"),
	},
	{
		name: "GoalListView",
		path: "/goals",
		component: () => import("@/views/appraisal/GoalList.vue"),
	},
]

export default routes
