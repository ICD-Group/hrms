<template>
	<BaseLayout :pageTitle="__('Leaderboard & Points')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-3 gap-3">
				<!-- Period Toggle -->
				<div class="flex gap-2 overflow-x-auto no-scrollbar">
					<button v-for="p in periodOptions" :key="p.value" @click="setPeriod(p.value)"
						class="px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all"
						:class="period === p.value ? 'bg-icd-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ p.label }}
					</button>
				</div>

				<!-- Month/Year Picker -->
				<div class="card-premium p-2.5">
					<div class="flex items-center gap-2 mb-2">
						<FeatherIcon name="calendar" class="w-4 h-4 text-icd-600" />
						<span class="text-sm font-bold text-gray-700">{{ __('Period') }}</span>
						<button @click="loadReport" class="ml-auto text-sm font-bold bg-icd-600 text-white px-3 py-1 rounded-md active:scale-95 transition-transform">
							{{ __('Search') }}
						</button>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<select v-model="month" class="w-full text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700">
							<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
						</select>
						<select v-model="year" class="w-full text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700">
							<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="entries.length > 0" class="flex items-center gap-2">
					<div class="flex items-center gap-2 flex-1 flex-wrap">
						<span class="text-sm font-bold text-gray-800">{{ entries.length }}</span>
						<span class="text-sm text-gray-500">{{ __('ranked') }}</span>
					</div>
					<button @click="doExportExcel" class="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded active:bg-green-100">
						<FeatherIcon name="download" class="w-3 h-3" /> XLSX
					</button>
					<button @click="doExportPDF" class="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded active:bg-red-100">
						<FeatherIcon name="printer" class="w-3 h-3" /> PDF
					</button>
				</div>

				<!-- Summary Stat Cards -->
				<div v-if="entries.length > 0" class="grid grid-cols-4 gap-2">
					<div class="card-premium p-2 text-center">
						<div class="text-sm font-extrabold text-icd-700 truncate">{{ summaryStats.topPerformer }}</div>
						<div class="text-xs text-gray-500 mt-0.5">#1 Top</div>
					</div>
					<div class="card-premium p-2 text-center">
						<div class="text-sm font-extrabold text-icd-700">{{ summaryStats.avgPoints }}</div>
						<div class="text-xs text-gray-500 mt-0.5">Avg Pts</div>
					</div>
					<div class="card-premium p-2 text-center">
						<div class="text-sm font-extrabold text-icd-700">{{ summaryStats.bestStreak }}</div>
						<div class="text-xs text-gray-500 mt-0.5">Best Streak</div>
					</div>
					<div class="card-premium p-2 text-center">
						<div class="text-sm font-extrabold text-icd-700">{{ summaryStats.activeCount }}</div>
						<div class="text-xs text-gray-500 mt-0.5">Active</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Ranked List -->
				<div v-else-if="entries.length > 0" class="flex flex-col gap-2">
					<div
						v-for="(entry, idx) in entries"
						:key="entry.employee"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)"
					>
						<div class="p-2.5">
							<!-- Top Row: Rank + Name + Points -->
							<div class="flex items-center gap-2.5">
								<!-- Rank Medal -->
								<div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
									:class="rankClass(entry.rank)">
									<template v-if="entry.rank === 1">&#129351;</template>
									<template v-else-if="entry.rank === 2">&#129352;</template>
									<template v-else-if="entry.rank === 3">&#129353;</template>
									<template v-else>{{ entry.rank }}</template>
								</div>

								<!-- Employee Info -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-xs text-gray-500 truncate">{{ (entry.department || '').replace(/ - I$/, '') }}</div>
								</div>

								<!-- Points -->
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-base font-extrabold text-icd-700">{{ entry.total_points }}</span>
									<span class="text-xs text-gray-500">pts</span>
								</div>
							</div>

							<!-- Breakdown Chips -->
							<div class="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-50 flex-wrap">
								<span v-if="entry.on_time_days" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">&#10003; {{ entry.on_time_days }}d</span>
								<span v-if="entry.early_days" class="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">&#9650; {{ entry.early_days }}d</span>
								<span v-if="entry.late_days" class="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">&#9888; {{ entry.late_days }}d</span>
								<span v-if="entry.absent_days" class="text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">&#10007; {{ entry.absent_days }}d</span>

								<!-- Streaks -->
								<span class="ml-auto text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">&#128293; {{ entry.current_streak || 0 }}</span>
								<span class="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">Best {{ entry.longest_streak || 0 }}</span>
							</div>

							<!-- Points Bar -->
							<div class="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
								<div class="h-full bg-icd-500 rounded-full transition-all duration-500"
									:style="{ width: barWidth(entry.total_points) + '%' }">
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty state -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="award" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No leaderboard data found') }}</span>
				</div>

				<div class="h-4"></div>
			</div>
		</template>
		<EmployeeDetailModal :show="showModal" :data="selectedEntry" @close="showModal = false" />
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from "vue"
import { FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import EmployeeDetailModal from "@/components/EmployeeDetailModal.vue"
import { useReportExport } from "@/composables/useReportExport"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const entries = ref([])
const showModal = ref(false)
const selectedEntry = ref({})

const period = ref("Monthly")
const now = dayjs()
const month = ref(now.month() + 1)
const year = ref(now.year())

const periodOptions = [
	{ value: "Monthly", label: "Monthly" },
	{ value: "Quarterly", label: "Quarterly" },
	{ value: "Yearly", label: "Yearly" },
]

const months = [
	{ value: 1, label: "January" },
	{ value: 2, label: "February" },
	{ value: 3, label: "March" },
	{ value: 4, label: "April" },
	{ value: 5, label: "May" },
	{ value: 6, label: "June" },
	{ value: 7, label: "July" },
	{ value: 8, label: "August" },
	{ value: 9, label: "September" },
	{ value: 10, label: "October" },
	{ value: 11, label: "November" },
	{ value: 12, label: "December" },
]

const years = computed(() => {
	const cur = dayjs().year()
	return [cur - 1, cur, cur + 1]
})

const maxPoints = computed(() => {
	if (!entries.value.length) return 1
	return Math.max(...entries.value.map(e => e.total_points || 0), 1)
})

const summaryStats = computed(() => {
	const list = entries.value
	if (!list.length) return { topPerformer: "None", avgPoints: 0, bestStreak: 0, activeCount: 0 }
	const total = list.reduce((s, e) => s + (e.total_points || 0), 0)
	return {
		topPerformer: list[0]?.employee_name || "None",
		avgPoints: Math.round(total / list.length),
		bestStreak: Math.max(...list.map(e => e.longest_streak || 0)),
		activeCount: list.filter(e => (e.total_points || 0) > 0).length,
	}
})

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

function setPeriod(val) {
	period.value = val
	loadReport()
}

function barWidth(points) {
	return Math.round(((points || 0) / maxPoints.value) * 100)
}

function rankClass(rank) {
	if (rank === 1) return "text-yellow-500 bg-yellow-50"
	if (rank === 2) return "text-gray-400 bg-gray-50"
	if (rank === 3) return "text-amber-600 bg-amber-50"
	return "text-gray-600 bg-gray-100"
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_leaderboard`, {
			period: period.value,
			month: month.value,
			year: year.value,
			limit: 50,
		})
		entries.value = data || []
	} catch (e) {
		console.error("Leaderboard API error:", e)
		toast({ title: __("Failed to load leaderboard"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "Rank", field: "rank", align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Dept", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Points", field: "total_points", align: "center" },
	{ label: "On-Time Days", field: "on_time_days", align: "center" },
	{ label: "Early Days", field: "early_days", align: "center" },
	{ label: "Late Days", field: "late_days", align: "center" },
	{ label: "Absent Days", field: "absent_days", align: "center" },
	{ label: "Current Streak", field: "current_streak", align: "center" },
	{ label: "Longest Streak", field: "longest_streak", align: "center" },
]

function getExportPayload() {
	const periodLabel = `${period.value} - ${months.find(m => m.value === month.value)?.label || ""} ${year.value}`
	return {
		title: "Leaderboard & Points",
		dateRange: periodLabel,
		department: "All Departments",
		summaryCards: [
			{ label: "#1 Top Performer", value: summaryStats.value.topPerformer, color: "#7B2FAF" },
			{ label: "Team Avg Points", value: summaryStats.value.avgPoints, color: "#7B2FAF" },
			{ label: "Best Streak", value: summaryStats.value.bestStreak, color: "#ea580c" },
			{ label: "Active Participants", value: summaryStats.value.activeCount, color: "#059669" },
		],
		columns: exportColumns,
		rows: entries.value,
	}
}

function doExportExcel() {
	if (!entries.value.length) return
	exportExcel(getExportPayload())
}

function doExportPDF() {
	if (!entries.value.length) return
	exportPDF(getExportPayload())
}

onMounted(() => {
	loadReport()
})
</script>
