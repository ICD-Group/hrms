<template>
	<BaseLayout :pageTitle="__('Earnings & Deductions')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-2 gap-2">
				<!-- Month/Year Picker -->
				<div class="card-premium p-1.5">
					<div class="flex items-center gap-1.5 mb-1">
						<FeatherIcon name="dollar-sign" class="w-3 h-3 text-icd-600" />
						<span class="text-[10px] font-bold text-gray-700">{{ __('Period') }}</span>
						<button @click="loadReport" class="ml-auto text-[10px] font-bold bg-icd-600 text-white px-2 py-0.5 rounded-md active:scale-95 transition-transform">{{ __('Search') }}</button>
					</div>
					<div class="grid grid-cols-2 gap-1">
						<select v-model="month" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
						</select>
						<select v-model="year" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
						</select>
					</div>
					<div class="mt-1">
						<select v-model="department" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
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
						<div class="text-xs font-extrabold text-green-700">{{ stats.totalGross }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Gross</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-red-700">{{ stats.totalDeductions }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Deductions</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-icd-700">{{ stats.totalNet }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Net Pay</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-blue-700">{{ stats.totalOT }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">OT Hours</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Employee Cards -->
				<div v-else-if="entries.length > 0" class="flex flex-col gap-1.5">
					<div v-for="entry in filteredEntries" :key="entry.employee"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(entry)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ (entry.department || '').replace(/ - I$/, '') }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-sm font-extrabold text-green-700">{{ fmt(entry.net_salary) }}</span>
									<span class="text-[9px] text-gray-500">net</span>
								</div>
							</div>
							<div class="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-50 flex-wrap">
								<span class="text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded">Gross {{ fmt(entry.gross_earnings) }}</span>
								<span class="text-[9px] font-bold text-red-700 bg-red-50 px-1 py-0.5 rounded">-{{ fmt(entry.total_deductions) }}</span>
								<span v-if="entry.total_overtime_hours" class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">OT {{ entry.total_overtime_hours }}h</span>
								<span v-if="entry.penalty_deduction_days" class="ml-auto text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">Penalty -{{ entry.penalty_deduction_days }}d</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="credit-card" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No payroll data for this period') }}</span>
					<span class="text-xs text-gray-500 mt-1">{{ __('Monthly payroll must be generated first') }}</span>
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
const departmentList = ref([])
const department = ref("")

const now = dayjs()
const month = ref(now.month() + 1)
const year = ref(now.year())

const months = [
	{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
	{ value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
	{ value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
	{ value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]
const years = computed(() => { const c = dayjs().year(); return [c - 1, c, c + 1] })

const filteredEntries = computed(() => {
	if (!department.value) return entries.value
	return entries.value.filter(e => e.department === department.value)
})

const stats = computed(() => {
	const list = filteredEntries.value
	if (!list.length) return { totalGross: 0, totalDeductions: 0, totalNet: 0, totalOT: 0 }
	return {
		totalGross: fmt(list.reduce((s, e) => s + (parseFloat(e.gross_earnings) || 0), 0)),
		totalDeductions: fmt(list.reduce((s, e) => s + (parseFloat(e.total_deductions) || 0), 0)),
		totalNet: fmt(list.reduce((s, e) => s + (parseFloat(e.net_salary) || 0), 0)),
		totalOT: list.reduce((s, e) => s + (parseFloat(e.total_overtime_hours) || 0), 0).toFixed(1),
	}
})

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

function fmt(v) {
	const n = parseFloat(v) || 0
	return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	try {
		const data = await call(`${API}.get_payroll_summary`, {
			month: month.value,
			year: year.value,
			department: department.value || undefined,
		})
		entries.value = data?.employees || data || []
	} catch (e) {
		console.error("Earnings API error:", e)
		toast({ title: __("Failed to load earnings"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		entries.value = []
	} finally {
		isLoading.value = false
	}
}

async function loadDepartments() {
	try {
		const deps = await call(`${API}.manager_get_list`, {
			doctype: "Department", filters: { is_group: 0 }, fields: ["name"], limit_page_length: 0,
		})
		departmentList.value = (deps || []).map(d => d.name)
	} catch (e) { console.warn("Dept load failed:", e) }
}

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1, align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Gross", field: (r) => fmt(r.gross_earnings), align: "right" },
	{ label: "Deductions", field: (r) => fmt(r.total_deductions), align: "right" },
	{ label: "Net Pay", field: (r) => fmt(r.net_salary), align: "right" },
	{ label: "OT Hours", field: "total_overtime_hours", align: "center" },
	{ label: "Penalty Days", field: "penalty_deduction_days", align: "center" },
]

function getExportPayload() {
	const mLabel = months.find(m => m.value === month.value)?.label || ""
	return {
		title: "Earnings & Deductions Report",
		dateRange: `${mLabel} ${year.value}`,
		department: department.value || "All Departments",
		summaryCards: [
			{ label: "Total Gross", value: stats.value.totalGross, color: "#059669" },
			{ label: "Total Deductions", value: stats.value.totalDeductions, color: "#dc2626" },
			{ label: "Total Net Pay", value: stats.value.totalNet, color: "#7B2FAF" },
			{ label: "OT Hours", value: stats.value.totalOT, color: "#2563eb" },
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
