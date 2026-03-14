<template>
	<BaseLayout pageTitle="Employees" :showBack="true">
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
					<span class="text-[11px] font-bold text-gray-600 flex-shrink-0">{{ wfLabel }}</span>
				</div>

				<!-- Search -->
				<div class="relative">
					<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
					<input v-model="search" type="text" :placeholder="__('Search employee...')"
						class="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 outline-none" />
				</div>

				<!-- Sort/Filter Pills -->
				<div class="flex gap-2 overflow-x-auto no-scrollbar">
					<button v-for="s in sortOptions" :key="s.key" @click="activeSort = s.key"
						class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
						:class="activeSort === s.key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ s.label }}
					</button>
				</div>

				<!-- Department Filter (only when sorting by department) -->
				<div v-if="activeSort === 'department' && departments.length > 1" class="flex gap-1.5 flex-wrap">
					<button @click="deptFilter = ''"
						class="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
						:class="!deptFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'">All</button>
					<button v-for="d in departments" :key="d" @click="deptFilter = d"
						class="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
						:class="deptFilter === d ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'">{{ d }}</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!filteredEmployees.length" class="text-center py-16">
					<FeatherIcon name="users" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
					<div class="text-sm text-gray-700">{{ __('No employees found') }}</div>
				</div>

				<template v-else>
					<!-- Summary -->
					<div class="flex items-center justify-between px-1">
						<span class="text-xs text-gray-600">{{ filteredEmployees.length }} {{ __('employees') }}</span>
						<div class="flex items-center gap-2">
							<span v-if="pageTotals.penalties" class="text-[11px] font-bold text-red-600">{{ pageTotals.penalties }} pen</span>
							<span v-if="pageTotals.absences" class="text-[11px] font-bold text-orange-600">{{ pageTotals.absences }} abs</span>
							<span v-if="pageTotals.ot" class="text-[11px] font-bold text-green-600">{{ pageTotals.ot }}h OT</span>
						</div>
					</div>

					<!-- Grouped Employee List -->
					<div class="flex flex-col gap-2">
						<div v-for="group in groupedEmployees" :key="group.key" class="card-premium overflow-hidden">
							<!-- Group Header -->
							<div class="flex items-center justify-between px-3 py-2 bg-gray-100/60 border-b border-gray-100/60">
								<span class="text-xs font-black text-gray-600">{{ group.label }}</span>
								<span class="text-[11px] font-bold text-gray-600">{{ group.items.length }}</span>
							</div>
							<!-- Employee Rows -->
							<div v-for="(emp, idx) in group.items" :key="emp.employee"
								@click="openDetail(emp)"
								class="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer active:bg-gray-100 transition-colors"
								:class="idx < group.items.length - 1 && 'border-b border-gray-50'">
								<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" :class="avatarBg(emp.employee_name)">
									<img v-if="emp.image" :src="emp.image" class="w-full h-full rounded-full object-cover" />
									<span v-else class="text-xs font-bold text-white">{{ initials(emp.employee_name) }}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-semibold text-gray-800 truncate">{{ emp.employee_name }}</div>
									<div class="text-[11px] text-gray-600 truncate">{{ empSubline(emp) }}</div>
								</div>
								<div class="flex gap-1 flex-shrink-0 flex-wrap justify-end" style="max-width: 120px">
									<span v-if="emp.penalty_count" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">{{ emp.penalty_count }}P</span>
									<span v-if="emp.absence_days" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{{ emp.absence_days }}A</span>
									<span v-if="emp.ot_hours" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">{{ emp.ot_hours }}h</span>
									<span v-if="emp.loan_amount" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">Loan</span>
								</div>
								<div v-if="emp.has_review" class="flex flex-col items-end flex-shrink-0">
									<span class="text-xs font-black text-gray-800">{{ fmt(emp.net_pay) }}</span>
									<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full" :class="reviewBadge(emp.review_status)">{{ emp.review_status }}</span>
								</div>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
							</div>
						</div>
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
const employees = ref([])
const search = ref("")
const deptFilter = ref("")
const activeSort = ref("name")
const mpName = ref(null)
const mpStatus = ref(null)

const months = [
	{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
	{ value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
	{ value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
	{ value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

const sortOptions = [
	{ key: "name", label: "A-Z" },
	{ key: "department", label: "By Department" },
	{ key: "status", label: "By Status" },
	{ key: "penalties", label: "Most Penalties" },
	{ key: "ot", label: "Most OT" },
]

const STATUS_DOT = { "Draft": "bg-gray-300", "Generated": "bg-blue-400", "Pending HR Review": "bg-orange-400", "Pending CEO Approval": "bg-purple-400", "Approved": "bg-green-400", "Synced": "bg-indigo-400", "Rejected": "bg-red-400" }
const statusDotCls = computed(() => STATUS_DOT[mpStatus.value] || "bg-gray-300")
const wfLabel = computed(() => mpName.value ? (mpStatus.value || "Draft") : "")

const departments = computed(() => {
	const depts = new Set()
	employees.value.forEach(e => { if (e.department) depts.add(e.department) })
	return [...depts].sort()
})

const filteredEmployees = computed(() => {
	let list = employees.value
	if (deptFilter.value) list = list.filter(e => e.department === deptFilter.value)
	if (search.value.trim()) {
		const q = search.value.trim().toLowerCase()
		list = list.filter(e => e.employee_name?.toLowerCase().includes(q) || e.employee?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q))
	}
	return list
})

const pageTotals = computed(() => {
	let penalties = 0, absences = 0, ot = 0
	for (const e of filteredEmployees.value) {
		penalties += e.penalty_count || 0
		absences += e.absence_days || 0
		ot += e.ot_hours || 0
	}
	return { penalties, absences, ot: Math.round(ot * 10) / 10 }
})

const groupedEmployees = computed(() => {
	const list = filteredEmployees.value
	if (!list.length) return []

	if (activeSort.value === "name") {
		const byLetter = {}
		for (const emp of list) {
			const letter = (emp.employee_name || "?")[0].toUpperCase()
			if (!byLetter[letter]) byLetter[letter] = []
			byLetter[letter].push(emp)
		}
		return Object.entries(byLetter)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([letter, items]) => ({ key: letter, label: letter, items }))
	}

	if (activeSort.value === "department") {
		const byDept = {}
		for (const emp of list) {
			const dept = emp.department || "No Department"
			if (!byDept[dept]) byDept[dept] = []
			byDept[dept].push(emp)
		}
		return Object.entries(byDept)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dept, items]) => ({
				key: dept,
				label: dept,
				items: items.sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || "")),
			}))
	}

	if (activeSort.value === "status") {
		const byStatus = {}
		for (const emp of list) {
			const status = emp.has_review ? emp.review_status : "Live"
			if (!byStatus[status]) byStatus[status] = []
			byStatus[status].push(emp)
		}
		const statusOrder = ["Pending HR", "Pending CEO", "Draft", "Approved", "Synced", "Rejected", "Live"]
		return statusOrder
			.filter(s => byStatus[s]?.length > 0)
			.map(s => ({
				key: s,
				label: s,
				items: (byStatus[s] || []).sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || "")),
			}))
	}

	if (activeSort.value === "penalties") {
		const withPen = list.filter(e => e.penalty_count > 0).sort((a, b) => (b.penalty_count || 0) - (a.penalty_count || 0))
		const noPen = list.filter(e => !e.penalty_count).sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || ""))
		const groups = []
		if (withPen.length) groups.push({ key: "with", label: "With Penalties", items: withPen })
		if (noPen.length) groups.push({ key: "without", label: "No Penalties", items: noPen })
		return groups
	}

	// OT sort
	const withOT = list.filter(e => e.ot_hours > 0).sort((a, b) => (b.ot_hours || 0) - (a.ot_hours || 0))
	const noOT = list.filter(e => !e.ot_hours).sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || ""))
	const groups = []
	if (withOT.length) groups.push({ key: "with", label: "With Overtime", items: withOT })
	if (noOT.length) groups.push({ key: "without", label: "No Overtime", items: noOT })
	return groups
})

function empSubline(emp) {
	const parts = []
	if (emp.department) parts.push(emp.department)
	if (emp.commission_total) parts.push(fmt(emp.commission_total) + " comm")
	if (emp.meal_amount) parts.push(fmt(emp.meal_amount) + " meal")
	return parts.join(" · ") || emp.employee
}

async function loadData() {
	isLoading.value = true
	try {
		const data = await call(`${API}.get_payroll_overview`, {
			month: selectedMonth.value, year: selectedYear.value
		})
		mpName.value = data?.monthly_payroll?.name || null
		mpStatus.value = data?.monthly_payroll?.status || null
		employees.value = data?.employees || []
	} catch (e) { _errToast(e, "Failed to load employees") }
	isLoading.value = false
}

function openDetail(emp) {
	router.push({
		name: "PayrollEmployeeDetail",
		params: { employee: emp.employee },
		query: { month: selectedMonth.value, year: selectedYear.value }
	})
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}
function reviewBadge(status) {
	return {
		"Draft": "bg-gray-100 text-gray-600", "Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700", "Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700", "Synced": "bg-blue-100 text-blue-700",
	}[status] || "bg-gray-100 text-gray-600"
}
function initials(name) {
	if (!name) return "?"
	return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}
const AVATAR_BG = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500"]
function avatarBg(name) {
	let h = 0
	for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h + (name || "").charCodeAt(i)) | 0
	return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

watch(() => employee.data?.company, (c) => { if (c) loadData() }, { immediate: true })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
