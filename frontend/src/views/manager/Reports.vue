<template>
	<BaseLayout :pageTitle="__('HR Reports')">
		<template #body>
			<div class="flex flex-col p-3 gap-3">
				<!-- Quick KPI Strip -->
				<div class="grid grid-cols-4 gap-2">
					<div class="card-premium p-2.5 text-center">
						<div class="text-lg font-bold text-gray-800">{{ kpi.totalEmployees }}</div>
						<div class="text-sm text-gray-600 font-medium">{{ __("Employees") }}</div>
					</div>
					<div class="card-premium p-2.5 text-center">
						<div class="text-lg font-bold text-green-700">{{ kpi.presentToday }}</div>
						<div class="text-sm text-gray-600 font-medium">{{ __("Present") }}</div>
					</div>
					<div class="card-premium p-2.5 text-center">
						<div class="text-lg font-bold text-amber-600">{{ kpi.lateToday }}</div>
						<div class="text-sm text-gray-600 font-medium">{{ __("Late") }}</div>
					</div>
					<div class="card-premium p-2.5 text-center">
						<div class="text-lg font-bold text-orange-600">{{ kpi.onLeave }}</div>
						<div class="text-sm text-gray-600 font-medium">{{ __("On Leave") }}</div>
					</div>
				</div>

				<!-- ATTENDANCE & PRODUCTIVITY -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Attendance & Productivity") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/attendance-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors border-b border-white/40">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="file-text" class="h-[22px] w-[22px] text-emerald-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Attendance Detail") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
						<button @click="router.push('/manager/productivity-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="trending-up" class="h-[22px] w-[22px] text-blue-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Productivity Report") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- LATE & PENALTIES -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Late & Penalties") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/late-penalty-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors w-full">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="clock" class="h-[22px] w-[22px] text-amber-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Late & Penalty Report") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- EARNINGS & PAYROLL -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Earnings & Payroll") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/earnings-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors w-full">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="credit-card" class="h-[22px] w-[22px] text-green-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Earnings & Deductions") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- LEAVE & TIME OFF -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Leave & Time Off") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/leave-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors w-full">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="calendar" class="h-[22px] w-[22px] text-purple-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Leave Analytics") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- REMOTE WORK -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Remote Work") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/wfh-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors w-full">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="monitor" class="h-[22px] w-[22px] text-indigo-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("WFH & Mission") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- EMPLOYEE INSIGHTS -->
				<div class="flex flex-col gap-2 w-full">
					<div class="text-lg font-medium text-gray-900">{{ __("Employee Insights") }}</div>
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button @click="router.push('/manager/employee-performance')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors border-b border-white/40">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="user-check" class="h-[22px] w-[22px] text-rose-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Employee Performance") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
						<button @click="router.push('/manager/leaderboard-report')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors border-b border-white/40">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="award" class="h-[22px] w-[22px] text-yellow-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Leaderboard & Points") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
						<button @click="router.push('/manager/sales-performance')"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg bg-icd-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="trending-up" class="h-[22px] w-[22px] text-icd-600" />
								</div>
								<div class="text-base font-medium text-gray-800">{{ __("Sales Performance") }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

const kpi = reactive({ totalEmployees: 0, presentToday: 0, lateToday: 0, onLeave: 0 })

async function loadKPI() {
	if (!employee.data?.company) return
	try {
		const data = await call(`${API}.get_manager_dashboard_summary`)
		if (data) {
			kpi.totalEmployees = data.total_employees || 0
			kpi.presentToday = data.present_today || 0
			kpi.lateToday = data.late_today || 0
			kpi.onLeave = data.on_leave_today || 0
		}
	} catch (e) {
		console.warn("KPI load failed:", e)
	}
}

watch(() => employee.data?.company, (c) => { if (c) loadKPI() }, { immediate: true })
</script>
