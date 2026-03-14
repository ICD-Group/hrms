<template>
	<BaseLayout :pageTitle="__('WFH & Mission')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-2 gap-2">
				<!-- Quick Tabs -->
				<div class="flex gap-1 overflow-x-auto no-scrollbar">
					<button v-for="t in tabs" :key="t.key" @click="activeTab = t.key"
						class="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
						:class="activeTab === t.key ? 'bg-icd-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ t.label }}
					</button>
				</div>

				<!-- Summary Cards -->
				<div v-if="employees.length > 0" class="grid grid-cols-4 gap-1.5">
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-indigo-700">{{ stats.wfhCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">WFH</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-green-700">{{ stats.officeCount }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Office</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-amber-700">{{ stats.pendingRequests }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Pending</div>
					</div>
					<div class="card-premium p-1.5 text-center">
						<div class="text-xs font-extrabold text-blue-700">{{ stats.totalEmployees }}</div>
						<div class="text-[9px] text-gray-500 mt-0.5">Total</div>
					</div>
				</div>

				<!-- Export -->
				<div v-if="employees.length > 0" class="flex items-center gap-1.5 justify-end">
					<button @click="doExportExcel" class="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded active:bg-green-100">
						<FeatherIcon name="download" class="w-2.5 h-2.5" /> XLSX
					</button>
					<button @click="doExportPDF" class="flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded active:bg-red-100">
						<FeatherIcon name="printer" class="w-2.5 h-2.5" /> PDF
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- WFH Employees Tab -->
				<div v-else-if="activeTab === 'wfh' && wfhEmployees.length > 0" class="flex flex-col gap-1.5">
					<div v-for="emp in wfhEmployees" :key="emp.name"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(emp)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="home" class="w-3.5 h-3.5 text-indigo-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ emp.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ (emp.department || '').replace(/ - I$/, '') }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-[10px] font-extrabold text-indigo-700">{{ emp.wfh_office_days }}d/w</span>
									<span class="text-[9px] text-gray-500">office req</span>
								</div>
							</div>
							<div class="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-50">
								<span class="text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded">{{ emp.office_days_actual }} office days this month</span>
								<span v-if="emp.office_days_actual < emp.wfh_office_days" class="ml-auto text-[9px] font-bold text-red-700 bg-red-50 px-1 py-0.5 rounded">Below target</span>
								<span v-else class="ml-auto text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded">On track</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Work Requests Tab -->
				<div v-else-if="activeTab === 'requests' && requests.length > 0" class="flex flex-col gap-1.5">
					<div v-for="req in requests" :key="req.name"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(req)">
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
									:class="reqTypeClass(req.request_type)">
									<FeatherIcon :name="reqTypeIcon(req.request_type)" class="w-3.5 h-3.5" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ req.employee_name }}</div>
									<div class="text-[10px] text-gray-500 truncate">{{ req.request_type }} | {{ req.from_datetime }}</div>
								</div>
								<span class="text-[9px] font-bold px-1 py-0.5 rounded" :class="reqStatusClass(req.workflow_state)">{{ req.workflow_state }}</span>
							</div>
							<div v-if="req.reason" class="mt-1 text-[10px] text-gray-600 line-clamp-2">{{ req.reason }}</div>
						</div>
					</div>
				</div>

				<!-- All Employees Tab -->
				<div v-else-if="activeTab === 'all' && employees.length > 0" class="flex flex-col gap-1.5">
					<div v-for="emp in employees" :key="emp.name"
						class="card-premium p-1.5 active:scale-[0.99] transition-transform cursor-pointer"
						@click="openDetail(emp)">
						<div class="flex items-center gap-2">
							<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
								:class="emp.is_wfh ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'">
								<FeatherIcon :name="emp.is_wfh ? 'home' : 'briefcase'" class="w-3 h-3" />
							</div>
							<div class="flex-1 min-w-0">
								<span class="text-[11px] font-bold text-gray-900 truncate">{{ emp.employee_name }}</span>
							</div>
							<span class="text-[9px] font-bold px-1 py-0.5 rounded"
								:class="emp.is_wfh ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 bg-gray-100'">
								{{ emp.is_wfh ? 'WFH' : 'Office' }}
							</span>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="home" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No data found') }}</span>
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
const API = "icd3s_attendance.icd3s_attendance.api.attendance"
const { exportExcel, exportPDF } = useReportExport()

const isLoading = ref(false)
const employees = ref([])
const requests = ref([])
const activeTab = ref("wfh")
const showModal = ref(false)
const selectedEntry = ref({})

const tabs = [
	{ key: "wfh", label: "WFH Employees" },
	{ key: "requests", label: "Work Requests" },
	{ key: "all", label: "All Employees" },
]

function openDetail(entry) {
	selectedEntry.value = { ...entry }
	showModal.value = true
}

const wfhEmployees = computed(() => employees.value.filter(e => e.is_wfh))

const stats = computed(() => {
	const list = employees.value
	return {
		wfhCount: list.filter(e => e.is_wfh).length,
		officeCount: list.filter(e => !e.is_wfh).length,
		pendingRequests: requests.value.filter(r => r.workflow_state === "Pending HR Approval" || r.workflow_state === "Pending CEO Approval").length,
		totalEmployees: list.length,
	}
})

function reqTypeClass(type) {
	if (type === "WFH") return "bg-indigo-50 text-indigo-600"
	if (type === "Mission") return "bg-blue-50 text-blue-600"
	return "bg-gray-100 text-gray-600"
}

function reqTypeIcon(type) {
	if (type === "WFH") return "home"
	if (type === "Mission") return "map-pin"
	return "file-text"
}

function reqStatusClass(status) {
	if (status === "Approved" || status === "CEO Approved") return "text-green-700 bg-green-50"
	if (status === "Rejected") return "text-red-700 bg-red-50"
	return "text-amber-700 bg-amber-50"
}

async function loadData() {
	isLoading.value = true
	try {
		const [empData, reqData] = await Promise.all([
			call(`${API}.get_employee_wfh_list`),
			call(`${API}.get_pending_work_requests`).catch(() => []),
		])
		employees.value = empData?.employees || []
		requests.value = reqData || []
	} catch (e) {
		console.error("WFH API error:", e)
		toast({ title: __("Failed to load WFH data"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		isLoading.value = false
	}
}

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1, align: "center" },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Mode", field: (r) => r.is_wfh ? "WFH" : "Office" },
	{ label: "Office Days/Week", field: "wfh_office_days", align: "center" },
	{ label: "Actual Office Days", field: "office_days_actual", align: "center" },
]

function getExportPayload() {
	return {
		title: "WFH & Mission Report",
		dateRange: "Current Status",
		department: "All Departments",
		summaryCards: [
			{ label: "WFH Employees", value: stats.value.wfhCount, color: "#4f46e5" },
			{ label: "Office Employees", value: stats.value.officeCount, color: "#059669" },
			{ label: "Pending Requests", value: stats.value.pendingRequests, color: "#d97706" },
			{ label: "Total", value: stats.value.totalEmployees, color: "#2563eb" },
		],
		columns: exportColumns,
		rows: employees.value,
	}
}

function doExportExcel() { if (employees.value.length) exportExcel(getExportPayload()) }
function doExportPDF() { if (employees.value.length) exportPDF(getExportPayload()) }

onMounted(loadData)
</script>
