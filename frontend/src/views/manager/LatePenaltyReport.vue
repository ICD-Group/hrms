<template>
	<BaseLayout :pageTitle="__('Late & Penalty Report')" :showBack="true">
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
					<div class="grid grid-cols-2 gap-1 mt-1">
						<select v-model="filters.department" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Depts') }}</option>
							<option v-for="d in departmentList" :key="d" :value="d">{{ d.replace(/ - I$/, '') }}</option>
						</select>
						<select v-model="penaltyFilter" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Levels') }}</option>
							<option value="Warning">{{ __('Warning') }}</option>
							<option value="Minor">{{ __('Minor') }}</option>
							<option value="Major">{{ __('Major') }}</option>
							<option value="Accumulated">{{ __('Accumulated') }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="entries.length > 0" class="flex items-center gap-1.5">
					<div class="flex items-center gap-2 flex-1 flex-wrap">
						<span class="text-xs font-bold text-gray-800">{{ entries.length }}</span>
						<span class="text-[10px] text-gray-500">penalties</span>
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
						<div class="text-xs font-extrabold text-amber-700">{{ stats.totalPenalties }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Total</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-red-700">{{ stats.totalDeductionDays }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Ded. Days</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-green-700">{{ stats.excusedCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Excused</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-orange-700">{{ stats.pendingCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Pending</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Penalty Cards -->
				<div v-else-if="entries.length > 0" class="flex flex-col gap-1.5">
					<div v-for="(entry, idx) in filteredEntries" :key="idx"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
									:class="levelClass(entry.penalty_level)">
									{{ levelIcon(entry.penalty_level) }}
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ (entry.department || '').replace(/ - I$/, '') }} | {{ entry.attendance_date }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-[10px] font-extrabold" :class="levelTextClass(entry.penalty_level)">{{ entry.penalty_level }}</span>
									<span v-if="entry.late_minutes" class="text-[9px] text-gray-500">{{ entry.late_minutes }}m late</span>
								</div>
							</div>
							<div class="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-50 flex-wrap">
								<span class="text-[9px] font-bold px-1 py-0.5 rounded"
									:class="entry.penalty_type === 'Late' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'">
									{{ entry.penalty_type }}
								</span>
								<span v-if="entry.deduction_days > 0" class="text-[9px] font-bold text-red-700 bg-red-50 px-1 py-0.5 rounded">
									-{{ entry.deduction_days }}d
								</span>
								<span v-if="entry.excuse_status" class="ml-auto text-[9px] font-bold px-1 py-0.5 rounded"
									:class="excuseClass(entry.excuse_status)">
									{{ entry.excuse_status }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="check-circle" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No penalties found') }}</span>
				</div>

				<div class="h-4"></div>
			</div>

			<EmployeeDetailModal :show="showModal" :data="selectedEntry" @close="showModal = false" />
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

const { filters, activePreset, datePresets, departmentList, employeeSearch, employeeSuggestions, applyPreset, clearFilters, selectEmployee, loadDepartments } = useReportFilters()
const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const entries = ref([])
const penaltyFilter = ref("")
const showModal = ref(false)
const selectedEntry = ref({})

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

const filteredEntries = computed(() => {
	if (!penaltyFilter.value) return entries.value
	return entries.value.filter(e => e.penalty_level === penaltyFilter.value)
})

const stats = computed(() => {
	const list = entries.value
	if (!list.length) return { totalPenalties: 0, totalDeductionDays: 0, excusedCount: 0, pendingCount: 0 }
	return {
		totalPenalties: list.length,
		totalDeductionDays: list.reduce((s, e) => s + (parseFloat(e.deduction_days) || 0), 0).toFixed(1),
		excusedCount: list.filter(e => e.excuse_status === "Approved").length,
		pendingCount: list.filter(e => e.excuse_status === "Pending").length,
	}
})

function levelClass(level) {
	if (level === "Warning") return "text-yellow-600 bg-yellow-50"
	if (level === "Minor") return "text-orange-600 bg-orange-50"
	if (level === "Major") return "text-red-600 bg-red-50"
	if (level === "Accumulated") return "text-purple-600 bg-purple-50"
	return "text-gray-600 bg-gray-100"
}

function levelTextClass(level) {
	if (level === "Warning") return "text-yellow-600"
	if (level === "Minor") return "text-orange-600"
	if (level === "Major") return "text-red-600"
	if (level === "Accumulated") return "text-purple-600"
	return "text-gray-600"
}

function levelIcon(level) {
	if (level === "Warning") return "!"
	if (level === "Minor") return "M"
	if (level === "Major") return "X"
	if (level === "Accumulated") return "A"
	return "?"
}

function excuseClass(status) {
	if (status === "Approved") return "text-green-700 bg-green-50"
	if (status === "Pending") return "text-amber-700 bg-amber-50"
	if (status === "Rejected") return "text-red-700 bg-red-50"
	return "text-gray-600 bg-gray-100"
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_late_penalty_report`, {
			from_date: filters.from_date,
			to_date: filters.to_date,
			employee: filters.employee || undefined,
			department: filters.department || undefined,
		})
		entries.value = data?.penalties || data || []
	} catch (e) {
		console.error("Late penalty API error:", e)
		toast({ title: __("Failed to load penalties"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1, align: "center" },
	{ label: "Date", field: "attendance_date" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Type", field: "penalty_type" },
	{ label: "Level", field: "penalty_level" },
	{ label: "Late Min", field: "late_minutes", align: "center" },
	{ label: "Ded. Days", field: "deduction_days", align: "center" },
	{ label: "Excuse", field: "excuse_status" },
]

function getExportPayload() {
	return {
		title: "Late & Penalty Report",
		dateRange: `${filters.from_date} to ${filters.to_date}`,
		department: filters.department || "All Departments",
		summaryCards: [
			{ label: "Total Penalties", value: stats.value.totalPenalties, color: "#d97706" },
			{ label: "Deduction Days", value: stats.value.totalDeductionDays, color: "#dc2626" },
			{ label: "Excused", value: stats.value.excusedCount, color: "#059669" },
			{ label: "Pending", value: stats.value.pendingCount, color: "#ea580c" },
		],
		columns: exportColumns,
		rows: filteredEntries.value,
	}
}

function doExportExcel() { if (entries.value.length) exportExcel(getExportPayload()) }
function doExportPDF() { if (entries.value.length) exportPDF(getExportPayload()) }

onMounted(() => {
	loadDepartments()
	loadReport()
})
</script>
