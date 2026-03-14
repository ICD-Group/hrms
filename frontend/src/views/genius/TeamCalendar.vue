<template>
	<BaseLayout :pageTitle="__('Team Attendance')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-4">

				<!-- No Access -->
				<template v-if="!isManager">
					<div class="text-center py-16">
						<div class="text-4xl mb-3">🔒</div>
						<div class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ __("Manager access required") }}</div>
						<div class="text-xs text-gray-600 dark:text-gray-500 mt-1">{{ __("Team attendance is available for managers only") }}</div>
					</div>
				</template>

				<template v-else>
					<!-- Month Navigator -->
					<div class="flex items-center justify-between bg-white dark:bg-white/10 rounded-xl p-3 shadow-sm dark:shadow-none">
						<button @click="prevMonth" class="p-2 rounded-lg active:bg-gray-100 dark:active:bg-white/10">
							<FeatherIcon name="chevron-left" class="w-5 text-gray-600 dark:text-gray-400" />
						</button>
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ monthLabel }}</div>
						<button @click="nextMonth" class="p-2 rounded-lg active:bg-gray-100 dark:active:bg-white/10">
							<FeatherIcon name="chevron-right" class="w-5 text-gray-600 dark:text-gray-400" />
						</button>
					</div>

					<!-- Team Stats -->
					<div v-if="teamData.data" class="grid grid-cols-3 gap-2">
						<div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center">
							<div class="text-lg font-bold text-green-700 dark:text-green-300">{{ teamData.data.summary?.present_rate || 0 }}%</div>
							<div class="text-xs text-green-600 dark:text-green-300">{{ __("Present") }}</div>
						</div>
						<div class="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 text-center">
							<div class="text-lg font-bold text-amber-700 dark:text-amber-300">{{ teamData.data.summary?.late_rate || 0 }}%</div>
							<div class="text-xs text-amber-600 dark:text-amber-300">{{ __("Late") }}</div>
						</div>
						<div class="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 text-center">
							<div class="text-lg font-bold text-red-600 dark:text-red-300">{{ teamData.data.summary?.absent_rate || 0 }}%</div>
							<div class="text-xs text-red-500 dark:text-red-300">{{ __("Absent") }}</div>
						</div>
					</div>

					<!-- Team Members -->
					<div v-if="teamData.data?.employees" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
						<div class="p-3 border-b border-gray-100 dark:border-white/10">
							<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Team Members") }}</div>
						</div>
						<div
							v-for="emp in teamData.data.employees"
							:key="emp.employee"
							class="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-white/10 last:border-0"
						>
							<div class="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400">
								{{ getInitials(emp.employee_name) }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ emp.employee_name }}</div>
								<div class="flex gap-1 mt-1">
									<span
										v-for="(day, idx) in emp.days?.slice(-7)"
										:key="idx"
										class="w-5 h-5 rounded-sm text-xs flex items-center justify-center font-medium"
										:class="getDayClass(day.status)"
										:title="day.date"
									>
										{{ getDayLabel(day.status) }}
									</span>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold" :class="getAttendanceColor(emp.attendance_rate)">
									{{ emp.attendance_rate || 0 }}%
								</div>
								<div class="text-xs text-gray-600 dark:text-gray-500">{{ __("rate") }}</div>
							</div>
						</div>
					</div>

					<!-- Department Comparison -->
					<div v-if="deptData.data?.departments?.length > 0">
						<div class="section-title mb-3">{{ __("Departments") }}</div>
						<div class="flex flex-col gap-2">
							<div
								v-for="dept in deptData.data.departments"
								:key="dept.department"
								class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none"
							>
								<div class="flex items-center justify-between mb-2">
									<div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ dept.department }}</div>
									<div class="text-sm font-bold" :class="getAttendanceColor(dept.attendance_rate)">
										{{ dept.attendance_rate || 0 }}%
									</div>
								</div>
								<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all duration-500"
										:class="getBarColor(dept.attendance_rate)"
										:style="{ width: (dept.attendance_rate || 0) + '%' }"
									></div>
								</div>
								<div class="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-500">
									<span>{{ dept.total_employees }} {{ __("employees") }}</span>
									<span>{{ dept.present_today || 0 }} {{ __("present today") }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Loading -->
					<div v-if="teamData.loading" class="text-center py-10">
						<div class="text-gray-600 dark:text-gray-500">{{ __("Loading team data...") }}</div>
					</div>
				</template>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { createResource, FeatherIcon } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { hasManagerRole } from "@/composables/managerMode"

const user = inject("$user")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const isManager = computed(() => {
	const roles = user?.data?.roles
	return hasManagerRole(roles)
})

const currentMonth = ref(dayjs())

const monthLabel = computed(() => currentMonth.value.format("MMMM YYYY"))

function prevMonth() {
	currentMonth.value = currentMonth.value.subtract(1, "month")
}

function nextMonth() {
	if (currentMonth.value.isBefore(dayjs(), "month")) {
		currentMonth.value = currentMonth.value.add(1, "month")
	}
}

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const teamData = createResource({
	url: `${API_BASE}.manager.get_team_attendance_overview`,
	makeParams() {
		return {
			from_date: currentMonth.value.startOf("month").format("YYYY-MM-DD"),
			to_date: currentMonth.value.endOf("month").format("YYYY-MM-DD"),
		}
	},
})

const deptData = createResource({
	url: `${API_BASE}.manager.get_department_comparison`,
	makeParams() {
		return {
			from_date: currentMonth.value.startOf("month").format("YYYY-MM-DD"),
			to_date: currentMonth.value.endOf("month").format("YYYY-MM-DD"),
		}
	},
})

// Only fetch data when user is a manager
watch(isManager, (val) => {
	if (val) {
		teamData.reload()
		deptData.reload()
	}
}, { immediate: true })

watch(currentMonth, () => {
	if (isManager.value) {
		teamData.reload()
		deptData.reload()
	}
})

function getInitials(name) {
	if (!name) return "?"
	return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}

function getDayClass(status) {
	const map = {
		"Present": "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300",
		"Absent": "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-300",
		"Late": "bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300",
		"Half Day": "bg-icd-100 dark:bg-icd-800/40 text-icd-600 dark:text-icd-300",
		"On Leave": "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300",
		"Holiday": "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-500",
		"Weekend": "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-500",
	}
	return map[status] || "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-500"
}

function getDayLabel(status) {
	const map = {
		"Present": "P",
		"Absent": "A",
		"Late": "L",
		"Half Day": "H",
		"On Leave": "V",
		"Holiday": "-",
		"Weekend": "-",
	}
	return map[status] || "-"
}

function getAttendanceColor(rate) {
	if (rate >= 90) return "text-green-600 dark:text-green-300"
	if (rate >= 75) return "text-amber-600 dark:text-amber-300"
	return "text-red-600 dark:text-red-300"
}

function getBarColor(rate) {
	if (rate >= 90) return "bg-green-500"
	if (rate >= 75) return "bg-amber-500"
	return "bg-red-500"
}
</script>
