<template>
	<BaseLayout :pageTitle="__('Leave Analytics')" :showBack="true">
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
							<option value="">{{ __('All Depts') }}</option>
							<option v-for="d in departmentList" :key="d" :value="d">{{ d.replace(/ - I$/, '') }}</option>
						</select>
						<select v-model="leaveTypeFilter" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Types') }}</option>
							<option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ lt }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="entries.length > 0" class="flex items-center gap-1.5">
					<div class="flex items-center gap-2 flex-1 flex-wrap">
						<span class="text-xs font-bold text-gray-800">{{ filteredEntries.length }}</span>
						<span class="text-[10px] text-gray-500">leave records</span>
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
						<div class="text-xs font-extrabold text-purple-700">{{ stats.totalLeaves }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Total</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-green-700">{{ stats.approvedCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Approved</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-amber-700">{{ stats.pendingCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Pending</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-blue-700">{{ stats.totalDays }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Days Used</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Leave Cards -->
				<div v-else-if="filteredEntries.length > 0" class="flex flex-col gap-1.5">
					<div v-for="(entry, idx) in filteredEntries" :key="idx"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
									:class="statusClass(entry.status)">
									{{ statusIcon(entry.status) }}
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ (entry.department || '').replace(/ - I$/, '') }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-[10px] font-extrabold text-purple-700">{{ entry.total_leave_days }}d</span>
									<span class="text-[9px] text-gray-500">{{ entry.leave_type }}</span>
								</div>
							</div>
							<div class="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-50 flex-wrap">
								<span class="text-[9px] font-bold text-gray-600 bg-gray-100 px-1 py-0.5 rounded">{{ entry.from_date }} - {{ entry.to_date }}</span>
								<span class="ml-auto text-[9px] font-bold px-1 py-0.5 rounded" :class="leaveStatusClass(entry.status)">{{ entry.status }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="calendar" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No leave records found') }}</span>
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

const { filters, activePreset, datePresets, departmentList, applyPreset, clearFilters, loadDepartments } = useReportFilters()
const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const entries = ref([])
const leaveTypeFilter = ref("")
const showModal = ref(false)
const selectedEntry = ref({})

const leaveTypes = computed(() => {
	const types = new Set(entries.value.map(e => e.leave_type).filter(Boolean))
	return [...types].sort()
})

const filteredEntries = computed(() => {
	if (!leaveTypeFilter.value) return entries.value
	return entries.value.filter(e => e.leave_type === leaveTypeFilter.value)
})

const stats = computed(() => {
	const list = entries.value
	if (!list.length) return { totalLeaves: 0, approvedCount: 0, pendingCount: 0, totalDays: 0 }
	return {
		totalLeaves: list.length,
		approvedCount: list.filter(e => e.status === "Approved").length,
		pendingCount: list.filter(e => e.status === "Open").length,
		totalDays: list.reduce((s, e) => s + (parseFloat(e.total_leave_days) || 0), 0).toFixed(1),
	}
})

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

function statusClass(status) {
	if (status === "Approved") return "text-green-600 bg-green-50"
	if (status === "Open") return "text-amber-600 bg-amber-50"
	if (status === "Rejected") return "text-red-600 bg-red-50"
	return "text-gray-600 bg-gray-100"
}

function statusIcon(status) {
	if (status === "Approved") return "\u2713"
	if (status === "Open") return "?"
	if (status === "Rejected") return "\u2717"
	return "-"
}

function leaveStatusClass(status) {
	if (status === "Approved") return "text-green-700 bg-green-50"
	if (status === "Open") return "text-amber-700 bg-amber-50"
	if (status === "Rejected") return "text-red-700 bg-red-50"
	return "text-gray-600 bg-gray-100"
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_leave_report`, {
			from_date: filters.from_date,
			to_date: filters.to_date,
			department: filters.department || undefined,
		})
		entries.value = data?.leaves || data || []
	} catch (e) {
		console.error("Leave API error:", e)
		toast({ title: __("Failed to load leave data"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1, align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Leave Type", field: "leave_type" },
	{ label: "From", field: "from_date" },
	{ label: "To", field: "to_date" },
	{ label: "Days", field: "total_leave_days", align: "center" },
	{ label: "Status", field: "status" },
]

function getExportPayload() {
	return {
		title: "Leave Analytics Report",
		dateRange: `${filters.from_date} to ${filters.to_date}`,
		department: filters.department || "All Departments",
		summaryCards: [
			{ label: "Total Leaves", value: stats.value.totalLeaves, color: "#7c3aed" },
			{ label: "Approved", value: stats.value.approvedCount, color: "#059669" },
			{ label: "Pending", value: stats.value.pendingCount, color: "#d97706" },
			{ label: "Days Used", value: stats.value.totalDays, color: "#2563eb" },
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
