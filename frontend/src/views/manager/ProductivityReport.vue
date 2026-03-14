<template>
	<BaseLayout :pageTitle="__('Productivity Matrix')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-2 gap-2">
				<!-- Period Toggle -->
				<div class="flex gap-1 overflow-x-auto no-scrollbar">
					<button v-for="p in datePresets" :key="p.key" @click="applyPreset(p, loadReport)"
						class="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
						:class="activePreset === p.key ? 'bg-icd-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ p.label }}
					</button>
				</div>

				<!-- Filters -->
				<div class="card-premium p-1.5">
					<div class="flex items-center gap-1.5 mb-1">
						<FeatherIcon name="filter" class="w-3 h-3 text-icd-600" />
						<span class="text-[10px] font-bold text-gray-700">{{ __('Filters') }}</span>
						<button @click="clearFilters(loadReport)" class="ml-auto text-[10px] font-semibold text-gray-500 active:text-gray-800">{{ __('Clear') }}</button>
						<button @click="loadReport" class="text-[10px] font-bold bg-icd-600 text-white px-2 py-0.5 rounded-md active:scale-95 transition-transform">{{ __('Search') }}</button>
					</div>
					<div class="grid grid-cols-2 gap-1">
						<input type="date" v-model="filters.from_date" class="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white" />
						<input type="date" v-model="filters.to_date" class="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white" />
					</div>
					<div class="grid grid-cols-2 gap-1 mt-1">
						<select v-model="filters.department" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Departments') }}</option>
							<option v-for="d in departmentList" :key="d" :value="d">{{ d.replace(/ - I$/, '') }}</option>
						</select>
						<select v-model="sortBy" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="score">{{ __('Score') }}</option>
							<option value="m1_attendance">{{ __('Attendance') }}</option>
							<option value="m2_punctuality">{{ __('Punctuality') }}</option>
							<option value="m3_hours">{{ __('Hours') }}</option>
							<option value="m4_penalties">{{ __('Penalties') }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="entries.length > 0" class="flex items-center gap-1.5">
					<div class="flex items-center gap-2 flex-1 flex-wrap">
						<span class="text-xs font-bold text-gray-800">{{ entries.length }}</span>
						<span class="text-[10px] text-gray-500">employees ranked</span>
					</div>
					<button @click="doExportExcel" class="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded active:bg-green-100">
						<FeatherIcon name="download" class="w-2.5 h-2.5" /> XLSX
					</button>
					<button @click="doExportPDF" class="flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded active:bg-red-100">
						<FeatherIcon name="printer" class="w-2.5 h-2.5" /> PDF
					</button>
				</div>

				<!-- Summary Cards -->
				<div v-if="entries.length > 0" class="grid grid-cols-4 gap-1.5">
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-icd-700 truncate">{{ stats.topName }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">#1 Top</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-emerald-700">{{ stats.teamAvg }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Team Avg</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-green-700">{{ stats.highPerformers }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">A Grade+</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-red-700">{{ stats.lowPerformers }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Below 60</div>
					</div>
				</div>

				<!-- Weights Legend -->
				<div v-if="weights.length > 0" class="flex gap-1 overflow-x-auto no-scrollbar">
					<div v-for="w in weights" :key="w.key" class="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-50 rounded-full whitespace-nowrap">
						<FeatherIcon :name="w.icon" class="w-2.5 h-2.5 text-gray-500" />
						<span class="text-[8px] font-bold text-gray-600">{{ w.label }} {{ w.weight }}%</span>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Calculating matrix...') }}</span>
				</div>

				<!-- Employee Cards -->
				<div v-else-if="sortedEntries.length > 0" class="flex flex-col gap-1.5">
					<div v-for="entry in sortedEntries" :key="entry.employee"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)">
						<div class="p-2">
							<!-- Top: Rank + Name + Score -->
							<div class="flex items-center gap-2">
								<!-- Rank -->
								<div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
									:class="rankClass(entry._displayRank || entry.rank)">
									<template v-if="(entry._displayRank || entry.rank) === 1">&#129351;</template>
									<template v-else-if="(entry._displayRank || entry.rank) === 2">&#129352;</template>
									<template v-else-if="(entry._displayRank || entry.rank) === 3">&#129353;</template>
									<template v-else>{{ entry._displayRank || entry.rank }}</template>
								</div>

								<!-- Employee Info -->
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ cleanDept(entry.department) }}</div>
								</div>

								<!-- Grade + Score -->
								<div class="flex items-center gap-1.5 flex-shrink-0">
									<div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="gradeBg(entry.grade)">
										<span class="text-xs font-extrabold" :class="gradeText(entry.grade)">{{ entry.grade }}</span>
									</div>
									<div class="text-right">
										<div class="text-sm font-extrabold" :class="scoreColor(entry.score)">{{ entry.score }}</div>
										<div class="text-[8px] text-gray-400">/100</div>
									</div>
								</div>
							</div>

							<!-- 7 Metric Chips -->
							<div class="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-50 overflow-x-auto no-scrollbar">
								<span v-for="w in weights" :key="w.key"
									class="text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
									:class="metricChipClass(entry[w.key])">
									{{ w.label.slice(0, 3) }} {{ Math.round(entry[w.key]) }}
								</span>
							</div>

							<!-- Score Bar -->
							<div class="mt-1.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
								<div class="h-full rounded-full transition-all duration-700"
									:class="scoreBarClass(entry.score)"
									:style="{ width: Math.min(entry.score, 100) + '%' }">
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="trending-up" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No productivity data found') }}</span>
				</div>

				<div class="h-4"></div>
			</div>

			<!-- Detail Modal -->
			<EmployeeDetailModal :show="showModal" :data="selectedEmployee" @close="showModal = false" />
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue"
import { FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import EmployeeDetailModal from "@/components/EmployeeDetailModal.vue"
import { useReportFilters } from "@/composables/useReportFilters"
import { useReportExport } from "@/composables/useReportExport"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

const { filters, activePreset, datePresets, departmentList, applyPreset, clearFilters, loadDepartments } = useReportFilters()
const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const entries = ref([])
const weights = ref([])
const sortBy = ref("score")
const showModal = ref(false)
const selectedEmployee = ref({})

const sortedEntries = computed(() => {
	const list = [...entries.value]
	const key = sortBy.value
	list.sort((a, b) => (b[key] || 0) - (a[key] || 0))
	// Re-rank by current sort
	list.forEach((e, i) => e._displayRank = i + 1)
	return list
})

const stats = computed(() => {
	const list = entries.value
	if (!list.length) return { topName: "None", teamAvg: 0, highPerformers: 0, lowPerformers: 0 }
	const avg = list.reduce((s, e) => s + (e.score || 0), 0) / list.length
	return {
		topName: list[0]?.employee_name?.split(" ")[0] || "None",
		teamAvg: avg.toFixed(1),
		highPerformers: list.filter(e => e.score >= 80).length,
		lowPerformers: list.filter(e => e.score < 60).length,
	}
})

function cleanDept(d) { return (d || "").replace(/ - I$/, "") }

function rankClass(rank) {
	if (rank === 1) return "text-yellow-500 bg-yellow-50"
	if (rank === 2) return "text-gray-400 bg-gray-50"
	if (rank === 3) return "text-amber-600 bg-amber-50"
	return "text-gray-600 bg-gray-100"
}

function gradeBg(g) {
	return { "A+": "bg-emerald-100", "A": "bg-emerald-50", "B": "bg-blue-50", "C": "bg-amber-50", "D": "bg-orange-50", "F": "bg-red-50" }[g] || "bg-gray-100"
}
function gradeText(g) {
	return { "A+": "text-emerald-700", "A": "text-emerald-600", "B": "text-blue-600", "C": "text-amber-600", "D": "text-orange-600", "F": "text-red-600" }[g] || "text-gray-600"
}
function scoreColor(s) { return s >= 80 ? "text-emerald-700" : s >= 60 ? "text-amber-700" : "text-red-700" }
function scoreBarClass(s) { return s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-red-500" }

function metricChipClass(val) {
	if (val >= 80) return "text-emerald-700 bg-emerald-50"
	if (val >= 60) return "text-amber-700 bg-amber-50"
	return "text-red-700 bg-red-50"
}

function openDetail(entry) {
	selectedEmployee.value = { ...entry, score: entry.score }
	showModal.value = true
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_productivity_matrix`, {
			from_date: filters.from_date,
			to_date: filters.to_date,
			department: filters.department || undefined,
		})
		entries.value = data?.employees || []
		weights.value = data?.weights || []
	} catch (e) {
		console.error("Productivity API error:", e)
		toast({ title: __("Failed to load productivity"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "Rank", field: "rank", align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => cleanDept(r.department) },
	{ label: "Score", field: "score", align: "center" },
	{ label: "Grade", field: "grade", align: "center" },
	{ label: "Attendance", field: "m1_attendance", align: "center" },
	{ label: "Punctuality", field: "m2_punctuality", align: "center" },
	{ label: "Hours", field: "m3_hours", align: "center" },
	{ label: "Penalties", field: "m4_penalties", align: "center" },
	{ label: "Leave Eff.", field: "m5_leave", align: "center" },
	{ label: "Consistency", field: "m6_streak", align: "center" },
	{ label: "Early", field: "m7_early", align: "center" },
	{ label: "Present", field: "present_days", align: "center" },
	{ label: "Absent", field: "absent_days", align: "center" },
	{ label: "Late", field: "late_days", align: "center" },
	{ label: "Avg Hours", field: "avg_hours", align: "center" },
]

function getExportPayload() {
	return {
		title: "GENIUS Productivity Matrix",
		dateRange: `${filters.from_date} to ${filters.to_date}`,
		department: filters.department || "All Departments",
		summaryCards: [
			{ label: "#1 Top Performer", value: stats.value.topName, color: "#7B2FAF" },
			{ label: "Team Average", value: stats.value.teamAvg, color: "#059669" },
			{ label: "A Grade+", value: stats.value.highPerformers, color: "#059669" },
			{ label: "Below 60", value: stats.value.lowPerformers, color: "#dc2626" },
		],
		columns: exportColumns,
		rows: entries.value,
	}
}

function doExportExcel() { if (entries.value.length) exportExcel(getExportPayload()) }
function doExportPDF() { if (entries.value.length) exportPDF(getExportPayload()) }

onMounted(() => {
	loadDepartments()
	loadReport()
})
</script>
