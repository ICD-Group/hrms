<template>
	<BaseLayout pageTitle="Earnings" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Period Selector -->
				<div class="flex items-center gap-2">
					<select v-model="selectedMonth" @change="loadData"
						class="flex-1 bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
					</select>
					<select v-model="selectedYear" @change="loadData"
						style="width:80px" class="bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
					</select>
					<span class="w-2 h-2 rounded-full flex-shrink-0" :class="statusDotCls"></span>
					<span class="text-xs font-bold text-gray-700 flex-shrink-0">{{ wfLabel }}</span>
				</div>

				<!-- Arrange Pills -->
				<div class="flex gap-2 overflow-x-auto no-scrollbar">
					<button v-for="s in sortOptions" :key="s.key" @click="activeSort = s.key"
						class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
						:class="activeSort === s.key ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ s.label }}
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!earningItems.length" class="text-center py-16">
					<FeatherIcon name="trending-up" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
					<div class="text-sm text-gray-700">{{ __('No earnings this month') }}</div>
				</div>

				<template v-else>
					<!-- Summary -->
					<div class="flex items-center justify-between px-1">
						<span class="text-sm text-gray-700">{{ earningItems.length }} {{ __('items') }}</span>
						<span class="text-sm font-bold text-green-700">{{ fmt(totalAmount) }} EGP</span>
					</div>

					<!-- Grouped Items -->
					<div class="flex flex-col gap-2">
						<div v-for="group in groupedItems" :key="group.key" class="card-premium overflow-hidden">
							<!-- Group Header -->
							<div class="flex items-center justify-between px-3 py-2 bg-gray-100/60 border-b border-gray-100/60">
								<span class="text-xs font-black text-gray-700">{{ group.label }}</span>
								<span class="text-xs font-bold text-gray-700">{{ group.items.length }}</span>
							</div>
							<!-- Items -->
							<div v-for="(item, idx) in group.items" :key="item.doc_name"
								@click="goToEmployee(item)"
								class="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer active:bg-gray-100 transition-colors"
								:class="idx < group.items.length - 1 && 'border-b border-gray-50'">
								<div class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" :class="iconBg(item.type)">
									<FeatherIcon :name="iconName(item.type)" class="w-3.5 h-3.5" :class="iconColor(item.type)" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-800 truncate">{{ itemPrimary(item) }}</div>
									<div class="text-xs text-gray-700 truncate">{{ itemSecondary(item) }}</div>
								</div>
								<span class="text-sm font-black text-green-600 flex-shrink-0">{{ item.amount_label }}</span>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
							</div>
							<!-- Group Total (for By Employee) -->
							<div v-if="activeSort === 'employee'"
								class="flex items-center justify-between px-3 py-2 bg-green-50/40 border-t border-green-100/30">
								<span class="text-xs text-gray-700">{{ __('Total') }}</span>
								<span class="text-sm font-black text-green-700">{{ fmt(groupTotal(group)) }} EGP</span>
							</div>
						</div>
					</div>

					<!-- Bulk Actions -->
					<div v-if="showBulkBar" class="flex gap-2 mt-1 mb-4">
						<button v-if="canHRApprove" @click="bulkAction('hr_approve')" :disabled="bulkProcessing"
							class="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
							{{ bulkProcessing === 'hr_approve' ? '...' : __('HR Approve All') }}
						</button>
						<button v-if="canCEOApprove" @click="bulkAction('ceo_approve')" :disabled="bulkProcessing"
							class="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
							{{ bulkProcessing === 'ceo_approve' ? '...' : __('CEO Approve All') }}
						</button>
						<button v-if="canSync" @click="bulkAction('sync')" :disabled="bulkProcessing"
							class="flex-1 bg-purple-600 text-white rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
							{{ bulkProcessing === 'sync' ? '...' : __('Sync All') }}
						</button>
					</div>
				</template>
			</div>

			</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")
const route = useRoute()
const router = useRouter()

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}
const API = "icd3s_attendance.icd3s_attendance.api.modules.monthly_payroll"

const now = new Date()
const selectedMonth = ref(Number(route.query.month) || now.getMonth() + 1)
const selectedYear = ref(Number(route.query.year) || now.getFullYear())
const isLoading = ref(false)
const bulkProcessing = ref(false)
const activeSort = ref("date")

const feedItems = ref([])
const mpName = ref(null)
const mpStatus = ref(null)

const months = [
	{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
	{ value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
	{ value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
	{ value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EARNING_TYPES = ["overtime", "commission", "meal"]

const sortOptions = [
	{ key: "date", label: "By Date" },
	{ key: "employee", label: "By Employee" },
	{ key: "type", label: "By Type" },
]

// Status
const STATUS_DOT = { "Draft": "bg-gray-300", "Generated": "bg-blue-400", "Pending HR Review": "bg-orange-400", "Pending CEO Approval": "bg-purple-400", "Approved": "bg-green-400", "Synced": "bg-indigo-400", "Rejected": "bg-red-400" }
const statusDotCls = computed(() => STATUS_DOT[mpStatus.value] || "bg-gray-300")
const wfLabel = computed(() => mpName.value ? (mpStatus.value || "Draft") : "")

// Filtered earning items
const earningItems = computed(() => feedItems.value.filter(f => EARNING_TYPES.includes(f.type)))
const totalAmount = computed(() => earningItems.value.reduce((s, i) => s + (i.amount || 0), 0))

// Grouped items based on active sort
const groupedItems = computed(() => {
	const items = earningItems.value
	if (!items.length) return []

	if (activeSort.value === "date") {
		const byDate = {}
		for (const item of items) {
			if (!byDate[item.date]) byDate[item.date] = []
			byDate[item.date].push(item)
		}
		return Object.entries(byDate)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dt, list]) => {
				const d = new Date(dt + "T00:00:00")
				return { key: dt, label: `${d.getDate()} ${WEEKDAYS[d.getDay()]}`, items: list }
			})
	}

	if (activeSort.value === "employee") {
		const byEmp = {}
		for (const item of items) {
			if (!byEmp[item.employee]) byEmp[item.employee] = { name: item.employee_name, dept: item.department, items: [] }
			byEmp[item.employee].items.push(item)
		}
		return Object.entries(byEmp)
			.sort(([, a], [, b]) => a.name.localeCompare(b.name))
			.map(([id, data]) => ({
				key: id,
				label: data.name,
				items: data.items.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
			}))
	}

	// By type
	const byType = {}
	for (const item of items) {
		if (!byType[item.type]) byType[item.type] = []
		byType[item.type].push(item)
	}
	const typeLabels = { overtime: "Overtime", commission: "Commission", meal: "Meals" }
	return EARNING_TYPES
		.filter(t => byType[t]?.length > 0)
		.map(t => ({
			key: t,
			label: typeLabels[t] || t,
			items: (byType[t] || []).sort((a, b) => (a.date || "").localeCompare(b.date || "")),
		}))
})

// Dynamic item text based on grouping
function itemPrimary(item) {
	if (activeSort.value === "employee") return item.description
	return item.employee_name
}
function itemSecondary(item) {
	const dayStr = formatDay(item.date)
	if (activeSort.value === "date") return item.description
	if (activeSort.value === "employee") return dayStr
	return `${dayStr} · ${item.description}`
}

function groupTotal(group) {
	return group.items.reduce((s, i) => s + (i.amount || 0), 0)
}

// Navigate to employee detail
function goToEmployee(item) {
	if (!item?.employee) return
	router.push({
		name: "PayrollEmployeeDetail",
		params: { employee: item.employee },
		query: { month: selectedMonth.value, year: selectedYear.value }
	})
}

// Bulk actions
const canHRApprove = computed(() => ["Generated", "Pending HR Review", "Rejected"].includes(mpStatus.value))
const canCEOApprove = computed(() => mpStatus.value === "Pending CEO Approval")
const canSync = computed(() => mpStatus.value === "Approved")
const showBulkBar = computed(() => earningItems.value.length > 0 && mpName.value && (canHRApprove.value || canCEOApprove.value || canSync.value))

async function loadData() {
	isLoading.value = true
	try {
		const [overviewData, feedData] = await Promise.all([
			call(`${API}.get_payroll_overview`, { month: selectedMonth.value, year: selectedYear.value }),
			call(`${API}.get_live_feed`, { month: selectedMonth.value, year: selectedYear.value }),
		])
		mpName.value = overviewData?.monthly_payroll?.name || null
		mpStatus.value = overviewData?.monthly_payroll?.status || null
		feedItems.value = feedData?.feed || []
	} catch (e) { _errToast(e, "Failed to load earnings") }
	isLoading.value = false
}

async function bulkAction(action) {
	if (!mpName.value) return
	bulkProcessing.value = action
	try {
		const methods = { hr_approve: "bulk_hr_approve", ceo_approve: "bulk_ceo_approve", sync: "sync_to_salary" }
		await call(`${API}.${methods[action]}`, { monthly_payroll_name: mpName.value })
		await loadData()
	} catch (e) { _errToast(e, "Action failed") }
	bulkProcessing.value = false
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}
function formatDay(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	return `${dt.getDate()} ${WEEKDAYS[dt.getDay()]}`
}
function formatDateFull(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}
function iconName(type) { return { overtime: "clock", commission: "dollar-sign", meal: "coffee" }[type] || "plus-circle" }
function iconBg(type) { return { overtime: "bg-green-100", commission: "bg-blue-100", meal: "bg-emerald-100" }[type] || "bg-gray-100" }
function iconColor(type) { return { overtime: "text-green-600", commission: "text-blue-600", meal: "text-emerald-600" }[type] || "text-gray-700" }
function statusBadge(status) {
	const s = (status || "").toLowerCase()
	if (s.includes("approved") || s === "accepted") return "bg-green-100 text-green-700"
	if (s.includes("pending")) return "bg-orange-100 text-orange-700"
	if (s.includes("reject") || s === "denied") return "bg-red-100 text-red-700"
	return "bg-gray-100 text-gray-600"
}

watch(() => employee.data?.company, (c) => { if (c) loadData() }, { immediate: true })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
