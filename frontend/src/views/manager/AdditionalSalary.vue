<template>
	<BaseLayout pageTitle="Additional Salary" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Period Selector -->
				<div class="flex items-center gap-2">
					<select v-model="selectedMonth" @change="loadEntries"
						class="flex-1 bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
					</select>
					<select v-model="selectedYear" @change="loadEntries"
						style="width:80px" class="bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
					</select>
					<button @click="showCreateForm = true"
						class="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center active:bg-green-700 flex-shrink-0">
						<FeatherIcon name="plus" class="w-4 h-4 text-white" />
					</button>
				</div>

				<!-- Type Filter Pills -->
				<div class="flex gap-2 overflow-x-auto no-scrollbar">
					<button v-for="t in typeTabs" :key="t.key" @click="activeType = t.key"
						class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1"
						:class="activeType === t.key ? tabColor(t.key) : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ t.label }}
						<span v-if="t.count > 0"
							class="text-xs font-black px-1 min-w-[16px] text-center rounded-full"
							:class="activeType === t.key ? 'bg-white/25' : 'bg-gray-200/80'">{{ t.count }}</span>
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!filteredEntries.length" class="text-center py-16">
					<FeatherIcon name="plus-circle" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
					<div class="text-sm text-gray-700">{{ __('No additional salary entries') }}</div>
					<button @click="showCreateForm = true"
						class="mt-3 text-sm font-bold text-green-600 active:opacity-70">
						{{ __('+ Create New') }}
					</button>
				</div>

				<template v-else>
					<!-- Summary -->
					<div class="flex items-center justify-between px-1">
						<span class="text-sm text-gray-700">{{ filteredEntries.length }} {{ __('entries') }}</span>
						<div class="flex items-center gap-3">
							<span v-if="earningTotal" class="text-xs font-bold text-green-600">+{{ fmt(earningTotal) }}</span>
							<span v-if="deductionTotal" class="text-xs font-bold text-red-600">-{{ fmt(deductionTotal) }}</span>
						</div>
					</div>

					<!-- Grouped Entries -->
					<div class="flex flex-col gap-2">
						<div v-for="group in groupedEntries" :key="group.key" class="card-premium overflow-hidden">
							<!-- Group Header -->
							<div class="flex items-center justify-between px-3 py-2 bg-gray-100/60 border-b border-gray-100/60">
								<span class="text-xs font-black text-gray-700">{{ group.label }}</span>
								<span class="text-xs font-bold text-gray-700">{{ group.items.length }}</span>
							</div>
							<!-- Items -->
							<div v-for="(entry, idx) in group.items" :key="entry.name"
								class="flex items-center gap-2.5 px-3 py-2.5"
								:class="idx < group.items.length - 1 && 'border-b border-gray-50'">
								<div class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
									:class="entry.type === 'Earning' ? 'bg-green-100' : 'bg-red-100'">
									<FeatherIcon :name="entry.type === 'Earning' ? 'trending-up' : 'trending-down'"
										class="w-3.5 h-3.5"
										:class="entry.type === 'Earning' ? 'text-green-600' : 'text-red-600'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-800 truncate">{{ entry.employee_name }}</div>
									<div class="text-xs text-gray-700 truncate">{{ entry.salary_component }}</div>
								</div>
								<span class="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
									:class="entry.docstatus === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
									{{ entry.docstatus === 1 ? __('Active') : __('Draft') }}
								</span>
								<span class="text-sm font-black flex-shrink-0"
									:class="entry.type === 'Earning' ? 'text-green-600' : 'text-red-600'">
									{{ entry.type === 'Earning' ? '+' : '-' }}{{ fmt(entry.amount) }}
								</span>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
							</div>
						</div>
					</div>
				</template>
			</div>

			<!-- Create Form Bottom Sheet -->
			<Teleport to="body">
				<div v-if="showCreateForm" class="fixed inset-0 z-[100] flex items-end justify-center">
					<div class="absolute inset-0 bg-black/30" @click="showCreateForm = false"></div>
					<div class="relative w-full max-w-lg rounded-t-2xl bg-white z-10 shadow-2xl">
						<div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2"></div>
						<div class="px-5 pb-6">
							<div class="text-base font-bold text-gray-900 mb-4">{{ __('Create Additional Salary') }}</div>

							<!-- Employee -->
							<div class="mb-3">
								<label class="text-sm font-semibold text-gray-700 mb-1.5 block">{{ __('Employee') }}</label>
								<select v-model="form.employee"
									class="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800">
									<option value="">{{ __('Select employee...') }}</option>
									<option v-for="emp in employeeList" :key="emp.name" :value="emp.name">
										{{ emp.employee_name }}
									</option>
								</select>
							</div>

							<!-- Component -->
							<div class="mb-3">
								<label class="text-sm font-semibold text-gray-700 mb-1.5 block">{{ __('Salary Component') }}</label>
								<select v-model="form.salary_component"
									class="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800">
									<option value="">{{ __('Select component...') }}</option>
									<option v-for="c in componentList" :key="c.name" :value="c.name">
										{{ c.name }} ({{ c.type }})
									</option>
								</select>
							</div>

							<!-- Amount -->
							<div class="mb-3">
								<label class="text-sm font-semibold text-gray-700 mb-1.5 block">{{ __('Amount') }}</label>
								<input v-model="form.amount" type="number" step="0.01" min="0"
									class="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800"
									:placeholder="__('Enter amount')" />
							</div>

							<!-- Reason -->
							<div class="mb-4">
								<label class="text-sm font-semibold text-gray-700 mb-1.5 block">{{ __('Reason') }}</label>
								<textarea v-model="form.reason" rows="2"
									class="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 resize-none"
									:placeholder="__('Optional reason...')"></textarea>
							</div>

							<div class="flex gap-2">
								<button @click="showCreateForm = false"
									class="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold active:bg-gray-200">
									{{ __('Cancel') }}
								</button>
								<button @click="createEntry"
									:disabled="createProcessing || !form.employee || !form.salary_component || !form.amount"
									class="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-bold active:bg-green-700 disabled:opacity-50">
									{{ createProcessing ? __('Creating...') : __('Create') }}
								</button>
							</div>
						</div>
					</div>
				</div>
			</Teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from "vue"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const isLoading = ref(false)
const activeType = ref("all")
const showCreateForm = ref(false)
const createProcessing = ref(false)

const entries = ref([])
const employeeList = ref([])
const componentList = ref([])

const form = ref({ employee: "", salary_component: "", amount: "", reason: "" })

const months = [
	{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
	{ value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
	{ value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
	{ value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

const earningCount = computed(() => entries.value.filter(e => e.type === "Earning").length)
const deductionCount = computed(() => entries.value.filter(e => e.type === "Deduction").length)
const earningTotal = computed(() => entries.value.filter(e => e.type === "Earning").reduce((s, e) => s + (parseFloat(e.amount) || 0), 0))
const deductionTotal = computed(() => entries.value.filter(e => e.type === "Deduction").reduce((s, e) => s + (parseFloat(e.amount) || 0), 0))

const typeTabs = computed(() => [
	{ key: "all", label: "All", count: entries.value.length },
	{ key: "earning", label: "Earnings", count: earningCount.value },
	{ key: "deduction", label: "Deductions", count: deductionCount.value },
])

function tabColor(key) {
	return { all: "bg-gray-800 text-white", earning: "bg-green-700 text-white", deduction: "bg-red-700 text-white" }[key] || "bg-gray-800 text-white"
}

const filteredEntries = computed(() => {
	if (activeType.value === "all") return entries.value
	if (activeType.value === "earning") return entries.value.filter(e => e.type === "Earning")
	return entries.value.filter(e => e.type === "Deduction")
})

// Group by salary component
const groupedEntries = computed(() => {
	const items = filteredEntries.value
	if (!items.length) return []

	const byComp = {}
	for (const entry of items) {
		const comp = entry.salary_component || "Other"
		if (!byComp[comp]) byComp[comp] = []
		byComp[comp].push(entry)
	}
	return Object.entries(byComp)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([comp, list]) => ({
			key: comp,
			label: comp,
			items: list.sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || "")),
		}))
})

async function loadEntries() {
	isLoading.value = true
	const monthStr = String(selectedMonth.value).padStart(2, "0")
	const startDate = `${selectedYear.value}-${monthStr}-01`
	const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
	const endDate = `${selectedYear.value}-${monthStr}-${String(lastDay).padStart(2, "0")}`
	try {
		const data = await call("frappe.client.get_list", {
			doctype: "Additional Salary",
			fields: ["name", "employee", "employee_name", "salary_component", "amount",
					 "payroll_date", "type", "docstatus"],
			filters: {
				payroll_date: ["between", [startDate, endDate]],
				docstatus: ["<", 2],
			},
			order_by: "employee_name asc",
			limit_page_length: 200,
		})
		entries.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load salary entries")
	}
	isLoading.value = false
}

async function loadFormData() {
	try {
		const [emps, comps] = await Promise.all([
			call("frappe.client.get_list", {
				doctype: "Employee", fields: ["name", "employee_name"],
				filters: { status: "Active" }, order_by: "employee_name asc", limit_page_length: 200,
			}),
			call("frappe.client.get_list", {
				doctype: "Salary Component", fields: ["name", "type"],
				order_by: "name asc", limit_page_length: 100,
			}),
		])
		employeeList.value = emps || []
		componentList.value = comps || []
	} catch (e) {
		_errToast(e, "Failed to load form data")
	}
}

async function createEntry() {
	createProcessing.value = true
	const monthStr = String(selectedMonth.value).padStart(2, "0")
	try {
		await call("frappe.client.insert", {
			doc: {
				doctype: "Additional Salary",
				employee: form.value.employee,
				salary_component: form.value.salary_component,
				amount: parseFloat(form.value.amount),
				payroll_date: `${selectedYear.value}-${monthStr}-01`,
				company: employee.data?.company || "ICD",
				overwrite_salary_structure_amount: 1,
			}
		})
		toast({ title: __("Created"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		showCreateForm.value = false
		form.value = { employee: "", salary_component: "", amount: "", reason: "" }
		loadEntries()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	createProcessing.value = false
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function formatDateFull(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

onMounted(() => loadFormData())
watch(() => employee.data?.company, (c) => { if (c) loadEntries() }, { immediate: true })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
