const disciplinaryRoutes = [
	{
		path: "/genius/disciplinary",
		name: "DisciplinaryList",
		component: () => import("@/views/disciplinary/List.vue"),
	},
	{
		path: "/genius/disciplinary/:id",
		name: "DisciplinaryDetail",
		component: () => import("@/views/disciplinary/Detail.vue"),
	},
	{
		path: "/genius/disciplinary/:id/defense",
		name: "DisciplinaryDefense",
		component: () => import("@/views/disciplinary/DefenseForm.vue"),
	},
	{
		path: "/genius/disciplinary/:id/appeal",
		name: "DisciplinaryAppeal",
		component: () => import("@/views/disciplinary/AppealForm.vue"),
	},
	{
		path: "/manager/disciplinary",
		name: "ManagerDisciplinary",
		component: () => import("@/views/manager/DisciplinaryActions.vue"),
	},
	{
		path: "/manager/disciplinary/create",
		name: "ManagerDisciplinaryCreate",
		component: () => import("@/views/manager/DisciplinaryCreate.vue"),
	},
	{
		path: "/manager/disciplinary/:id/edit",
		name: "ManagerDisciplinaryEdit",
		component: () => import("@/views/manager/DisciplinaryCreate.vue"),
	},
	{
		path: "/manager/disciplinary/:id",
		name: "ManagerDisciplinaryDetail",
		component: () => import("@/views/manager/DisciplinaryDetail.vue"),
	},
]

export default disciplinaryRoutes
