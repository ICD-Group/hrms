<template>
	<ion-tab-bar
		slot="bottom"
		class="w-full py-2 pb-2 standalone:pb-safe-bottom glass-tabbar"
		role="navigation"
		:aria-label="__('Main navigation')"
	>
		<ion-tab-button
			v-for="item in tabItems"
			:key="item.route"
			:tab="item.route"
			:href="item.route"
			@click.prevent="router.push(item.route)"
			:aria-label="item.title"
			:aria-current="isActiveTab(item.route) ? 'page' : undefined"
			:class="[
				'text-xs space-y-1 !hover:border-gray-300 !hover:text-gray-700 transition-all duration-200 active:scale-90 tab-btn-premium',
				isActiveTab(item.route)
					? 'border-icd-600 text-icd-600 dark:text-icd-400 font-semibold tab-active'
					: 'text-gray-600 dark:text-gray-400 font-normal',
			]"
			style="--background: transparent;"
		>
			<div class="relative">
				<!-- Feather icon for manager tabs -->
				<FeatherIcon
					v-if="item.featherIcon"
					:name="item.featherIcon"
					class="h-7 w-7 transition-transform duration-200"
					:class="isActiveTab(item.route) ? 'scale-110' : ''"
				/>
				<!-- Custom SVG icon for employee tabs -->
				<component
					v-else
					:is="item.icon"
					class="h-7 w-7 transition-transform duration-200"
					:class="isActiveTab(item.route) ? 'scale-110' : ''"
				/>
				<span v-if="isActiveTab(item.route)" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-icd-600 rounded-full"></span>
			</div>
			<div class="transition-all duration-200" :class="isActiveTab(item.route) ? 'text-[12px]' : 'text-[11px]'">{{ item.title }}</div>
		</ion-tab-button>
	</ion-tab-bar>
</template>

<script setup>
import { computed, inject } from "vue"
import { useRoute, useRouter } from "vue-router"
import { IonTabBar, IonTabButton } from "@ionic/vue"
import { FeatherIcon } from "frappe-ui"
import { useManagerMode } from "@/composables/managerMode"

import HomeIcon from "@/components/icons/HomeIcon.vue"
import LeaveIcon from "@/components/icons/LeaveIcon.vue"
import ExpenseIcon from "@/components/icons/ExpenseIcon.vue"
import SalaryIcon from "@/components/icons/SalaryIcon.vue"
import AttendanceIcon from "@/components/icons/AttendanceIcon.vue"
import GeniusIcon from "@/components/icons/GeniusIcon.vue"

const __ = inject("$translate")
const route = useRoute()
const router = useRouter()
const { isManagerMode } = useManagerMode()

// Employee tabs (6)
const employeeTabItems = [
	{ icon: HomeIcon, title: __("Home"), route: "/home" },
	{ icon: AttendanceIcon, title: __("Attendance"), route: "/dashboard/attendance" },
	{ icon: LeaveIcon, title: __("Leaves"), route: "/dashboard/leaves" },
	{ icon: ExpenseIcon, title: __("Expenses"), route: "/dashboard/expense-claims" },
	{ featherIcon: "credit-card", title: __("Salary"), route: "/genius/salary" },
	{ icon: GeniusIcon, title: __("GENIUS"), route: "/genius" },
]

// Manager tabs (6) - use featherIcon string instead of component
const managerTabItems = [
	{ featherIcon: "layout", title: __("Dashboard"), route: "/manager/dashboard" },
	{ featherIcon: "users", title: __("Team"), route: "/manager/employees" },
	{ featherIcon: "command", title: __("Command"), route: "/manager/command" },
	{ featherIcon: "dollar-sign", title: __("Salary"), route: "/manager/salary" },
	{ featherIcon: "bar-chart-2", title: __("Reports"), route: "/manager/reports" },
	{ featherIcon: "sliders", title: __("Admin"), route: "/manager/settings" },
]

// Reactive: switch tabs based on manager mode
const tabItems = computed(() => {
	return isManagerMode.value ? managerTabItems : employeeTabItems
})

// Active tab detection (supports nested routes like /manager/salary/earnings)
function isActiveTab(tabRoute) {
	if (tabRoute === "/genius/salary" && route.path === "/dashboard/salary-slips") return true
	// Exact match
	if (route.path === tabRoute) return true
	// Nested route match
	if (route.path.startsWith(tabRoute + "/")) {
		// Don't let GENIUS tab (/genius) steal highlight from Salary tab (/genius/salary)
		if (tabRoute === "/genius" && route.path.startsWith("/genius/salary")) return false
		return true
	}
	return false
}
</script>

<style scoped>
.tab-btn-premium {
	position: relative;
}
.tab-active::before {
	content: '';
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 24px;
	height: 2px;
	background: #4D067B;
	border-radius: 0 0 2px 2px;
	animation: tab-indicator-slide 0.25s ease-out;
}
@keyframes tab-indicator-slide {
	from { width: 0; opacity: 0; }
	to { width: 24px; opacity: 1; }
}
</style>
