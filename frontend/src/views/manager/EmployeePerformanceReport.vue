<template>
	<BaseLayout :pageTitle="__('Employee Performance')" :showBack="true">
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
					<!-- Employee Search -->
					<div class="mt-1 relative">
						<div class="relative">
							<input type="text" v-model="employeeSearch" :placeholder="__('Search employee...')"
								class="w-full text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white pr-6" />
							<FeatherIcon v-if="employeeSearch" name="x" class="w-3 h-3 text-gray-500 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
								@click="employeeSearch = ''; filters.employee = ''" />
						</div>
						<div v-if="employeeSuggestions.length > 0 && employeeSearch && !filters.employee" class="absolute left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-28 overflow-y-auto z-10">
							<button v-for="emp in employeeSuggestions" :key="emp.name" @click="selectEmployee(emp, loadReport)"
								class="w-full text-left px-2 py-1 text-[11px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0">
								<span class="font-bold">{{ emp.employee_name }}</span>
								<span class="text-gray-500 ml-1 text-[9px]">{{ (emp.department || '').replace(/ - I$/, '') }}</span>
							</button>
						</div>
						<div v-if="filters.employee" class="mt-0.5 flex items-center gap-1">
							<span class="text-[10px] font-bold text-icd-700 bg-icd-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
								{{ employeeSearch }}
								<FeatherIcon name="x" class="w-2.5 h-2.5 cursor-pointer" @click="filters.employee = ''; employeeSearch = ''" />
							</span>
						</div>
					</div>
					<div class="mt-1">
						<select v-model="filters.department" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Departments') }}</option>
							<option v-for="d in departmentList" :key="d" :value="d">{{ d.replace(/ - I$/, '') }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="entries.length > 0" class="flex items-center gap-1.5">
					<div class="flex items-center gap-2 flex-1 flex-wrap">
						<span class="text-xs font-bold text-gray-800">{{ entries.length }}</span>
						<span class="text-[10px] text-gray-500">employees</span>
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
						<div class="text-xs font-extrabold text-emerald-700">{{ stats.avgAttendance }}%</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Avg Attend</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-blue-700">{{ stats.avgHours }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Avg Hours</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-amber-700">{{ stats.avgLateCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Avg Late</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-rose-700">{{ stats.topPerformer }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">#1 Best</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Employee Performance Cards -->
				<div v-else-if="entries.length > 0" class="flex flex-col gap-1.5">
					<div v-for="entry in entries" :key="entry.employee"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
									<span class="text-[11px] font-extrabold text-rose-600">{{ scoreGrade(entry.score) }}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ (entry.department || '').replace(/ - I$/, '') }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-sm font-extrabold" :class="scoreColor(entry.score)">{{ entry.score || 0 }}</span>
									<span class="text-[9px] text-gray-500">score</span>
								</div>
							</div>

							<!-- Metrics Grid -->
							<div class="grid grid-cols-4 gap-1 mt-1.5 pt-1 border-t border-gray-50">
								<div class="text-center">
									<div class="text-[10px] font-extrabold text-emerald-700">{{ entry.present_days || 0 }}</div>
									<div class="text-[8px] text-gray-500">Present</div>
								</div>
								<div class="text-center">
									<div class="text-[10px] font-extrabold text-red-700">{{ entry.absent_days || 0 }}</div>
									<div class="text-[8px] text-gray-500">Absent</div>
								</div>
								<div class="text-center">
									<div class="text-[10px] font-extrabold text-amber-700">{{ entry.late_days || 0 }}</div>
									<div class="text-[8px] text-gray-500">Late</div>
								</div>
								<div class="text-center">
									<div class="text-[10px] font-extrabold text-blue-700">{{ entry.avg_hours || 0 }}h</div>
									<div class="text-[8px] text-gray-500">Avg Hrs</div>
								</div>
							</div>

							<!-- Score Bar -->
							<div class="mt-1.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
								<div class="h-full rounded-full transition-all duration-500"
									:class="scoreBarColor(entry.score)"
									:style="{ width: Math.min((entry.score || 0), 100) + '%' }">
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="user-check" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No performance data found') }}</span>
				</div>

				<div class="h-4"></div>
			</div>
		</template>
		<EmployeeDetailModal :show="showModal" :data="selectedEntry" @close="showModal = false" />
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

const { filters, activePreset, datePresets, departmentList, employeeSearch, employeeSuggestions, applyPreset, clearFilters, selectEmployee, loadDepartments } = useReportFilters()
const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const entries = ref([])
const showModal = ref(false)
const selectedEntry = ref({})

const stats = computed(() => {
	const list = entries.value
	if (!list.length) return { avgAttendance: 0, avgHours: 0, avgLateCount: 0, topPerformer: "None" }
	const avgAtt = list.reduce((s, e) => s + (e.attendance_rate || 0), 0) / list.length
	const avgH = list.reduce((s, e) => s + (parseFloat(e.avg_hours) || 0), 0) / list.length
	const avgL = list.reduce((s, e) => s + (e.late_days || 0), 0) / list.length
	const sorted = [...list].sort((a, b) => (b.score || 0) - (a.score || 0))
	return {
		avgAttendance: avgAtt.toFixed(1),
		avgHours: avgH.toFixed(1),
		avgLateCount: avgL.toFixed(1),
		topPerformer: sorted[0]?.employee_name?.split(" ")[0] || "None",
	}
})

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

function scoreGrade(score) {
	if (score >= 90) return "A+"
	if (score >= 80) return "A"
	if (score >= 70) return "B"
	if (score >= 60) return "C"
	return "D"
}

function scoreColor(score) {
	if (score >= 80) return "text-emerald-700"
	if (score >= 60) return "text-amber-700"
	return "text-red-700"
}

function scoreBarColor(score) {
	if (score >= 80) return "bg-emerald-500"
	if (score >= 60) return "bg-amber-500"
	return "bg-red-500"
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_employee_performance_report`, {
			from_date: filters.from_date,
			to_date: filters.to_date,
			employee: filters.employee || undefined,
			department: filters.department || undefined,
		})
		entries.value = (data?.employees || data || []).sort((a, b) => (b.score || 0) - (a.score || 0))
	} catch (e) {
		console.error("Performance API error:", e)
		toast({ title: __("Failed to load performance data"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1, align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Score", field: "score", align: "center" },
	{ label: "Grade", field: (r) => scoreGrade(r.score) },
	{ label: "Present", field: "present_days", align: "center" },
	{ label: "Absent", field: "absent_days", align: "center" },
	{ label: "Late", field: "late_days", align: "center" },
	{ label: "Avg Hours", field: "avg_hours", align: "center" },
	{ label: "Attendance %", field: "attendance_rate", align: "center" },
]

function getExportPayload() {
	return {
		title: "Employee Performance Report",
		dateRange: `${filters.from_date} to ${filters.to_date}`,
		department: filters.department || "All Departments",
		summaryCards: [
			{ label: "Avg Attendance", value: stats.value.avgAttendance + "%", color: "#059669" },
			{ label: "Avg Hours", value: stats.value.avgHours, color: "#2563eb" },
			{ label: "Avg Late Days", value: stats.value.avgLateCount, color: "#d97706" },
			{ label: "#1 Performer", value: stats.value.topPerformer, color: "#e11d48" },
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
