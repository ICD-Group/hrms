<template>
	<BaseLayout :pageTitle="__('Loan Management')" :showBack="true">
		<template #body>
			<div class="flex flex-col mt-1 mb-2 gap-2.5">
				<!-- Search -->
				<div class="flex items-center gap-2 card-premium p-3 mx-3">
					<FeatherIcon name="search" class="w-4 h-4 text-gray-600 flex-shrink-0" />
					<input v-model="searchQuery" :placeholder="__('Search employee or loan...')"
						class="flex-1 bg-transparent text-sm border-0 outline-none text-gray-800 placeholder:text-gray-700" />
				</div>

				<!-- Status Tabs -->
				<div class="flex gap-2 px-3 overflow-x-auto no-scrollbar">
					<button v-for="t in statusTabs" :key="t.key"
						@click="activeTab = t.key"
						class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
						:class="activeTab === t.key
							? 'bg-icd-600 text-white'
							: 'bg-white/60 text-gray-600 active:bg-gray-100'">
						{{ t.label }}
						<span v-if="t.count > 0" class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
							:class="activeTab === t.key ? 'bg-white/20' : 'bg-gray-200'">
							{{ t.count }}
						</span>
					</button>
				</div>

				<!-- Summary Cards -->
				<div v-if="!isLoading && loans.length > 0" class="grid grid-cols-3 gap-2 px-3">
					<div class="glass-section rounded-xl p-2.5 text-center">
						<div class="text-lg font-black text-icd-700">{{ fmt(summaryTotals.total_sanctioned) }}</div>
						<div class="text-xs font-semibold text-gray-600">{{ __("Sanctioned") }}</div>
					</div>
					<div class="glass-section rounded-xl p-2.5 text-center">
						<div class="text-lg font-black text-green-700">{{ fmt(summaryTotals.total_repaid) }}</div>
						<div class="text-xs font-semibold text-gray-600">{{ __("Repaid") }}</div>
					</div>
					<div class="glass-section rounded-xl p-2.5 text-center">
						<div class="text-lg font-black text-red-700">{{ fmt(summaryTotals.total_remaining) }}</div>
						<div class="text-xs font-semibold text-gray-600">{{ __("Remaining") }}</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Loan Cards -->
				<div v-else-if="filteredLoans.length > 0" class="flex flex-col gap-2 px-3">
					<div v-for="loan in filteredLoans" :key="loan.name"
						class="card-premium p-4">
						<!-- Header -->
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2 min-w-0">
								<div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
									:class="loanStatusBg(loan.status)">
									<FeatherIcon :name="loanStatusIcon(loan.status)"
										class="w-4 h-4"
										:class="loanStatusColor(loan.status)" />
								</div>
								<div class="min-w-0">
									<div class="text-sm font-bold text-gray-800 truncate">{{ loan.applicant_name }}</div>
									<div class="text-xs text-gray-600">{{ loan.loan_type }} · {{ loan.name }}</div>
								</div>
							</div>
							<div class="flex items-center gap-1.5 flex-shrink-0">
								<span v-if="leftEmployeeIds.has(loan.applicant)"
									class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 text-white">Left</span>
								<span class="text-xs font-bold px-2 py-0.5 rounded-full"
									:class="loanStatusBadge(loan.status)">
									{{ loan.status }}
								</span>
							</div>
						</div>

						<!-- Amounts -->
						<div class="bg-gray-100 rounded-lg p-2.5">
							<div class="grid grid-cols-3 gap-2">
								<div class="text-center">
									<div class="text-xs font-black text-gray-800">{{ fmt(loan.loan_amount) }}</div>
									<div class="text-xs text-gray-600">{{ __("Sanctioned") }}</div>
								</div>
								<div class="text-center">
									<div class="text-xs font-black text-green-600">{{ fmt(loan.total_amount_paid || 0) }}</div>
									<div class="text-xs text-gray-600">{{ __("Repaid") }}</div>
								</div>
								<div class="text-center">
									<div class="text-xs font-black text-red-600">{{ fmt((loan.loan_amount || 0) - (loan.total_amount_paid || 0)) }}</div>
									<div class="text-xs text-gray-600">{{ __("Balance") }}</div>
								</div>
							</div>

							<!-- Progress Bar -->
							<div class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
								<div class="h-full bg-green-500 rounded-full transition-all"
									:style="{ width: loanProgress(loan) + '%' }"></div>
							</div>
							<div class="flex justify-between mt-1">
								<span class="text-xs text-gray-600">{{ loanProgress(loan) }}% {{ __("repaid") }}</span>
								<span class="text-xs text-gray-600">{{ loan.repayment_periods || '—' }} {{ __("installments") }}</span>
							</div>
						</div>

						<!-- Dates -->
						<div class="flex items-center justify-between mt-2 text-xs text-gray-600">
							<span>{{ __("Start") }}: {{ loan.posting_date || loan.repayment_start_date || '—' }}</span>
							<span v-if="loan.monthly_repayment_amount">{{ __("Monthly") }}: {{ fmt(loan.monthly_repayment_amount) }}</span>
						</div>

						<!-- Loan Application Approve/Reject (for pending applications) -->
						<div v-if="loan._is_application && loan.status === 'Open'" class="flex gap-2 mt-3">
							<button @click="approveLoanApp(loan)"
								:disabled="isProcessing"
								class="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-bold active:bg-green-700 disabled:opacity-50">
								{{ __("Approve") }}
							</button>
							<button @click="rejectLoanApp(loan)"
								:disabled="isProcessing"
								class="flex-1 bg-red-50 text-red-600 border border-red-200/50 rounded-xl py-2.5 text-xs font-bold active:bg-red-100 disabled:opacity-50">
								{{ __("Reject") }}
							</button>
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else class="flex flex-col items-center justify-center py-16 px-3">
					<div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
						<FeatherIcon name="credit-card" class="w-7 h-7 text-gray-700" />
					</div>
					<div class="text-sm font-bold text-gray-600">{{ __("No loans found") }}</div>
				</div>

				<div class="h-4"></div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
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

const isLoading = ref(false)
const isProcessing = ref(false)
const searchQuery = ref("")
const activeTab = ref("all")

const loans = ref([])
const loanApplications = ref([])
const leftEmployeeIds = ref(new Set())

const allItems = computed(() => {
	const apps = loanApplications.value.map(a => ({
		...a,
		_is_application: true,
		loan_amount: a.loan_amount,
		total_amount_paid: 0,
		loan_type: a.loan_type,
		applicant_name: a.applicant_name,
	}))
	return [...loans.value, ...apps]
})

const currentLoans = computed(() => allItems.value.filter(l => !leftEmployeeIds.value.has(l.applicant)))
const leftLoans = computed(() => allItems.value.filter(l => leftEmployeeIds.value.has(l.applicant)))

const activeCount = computed(() => currentLoans.value.filter(l => ["Disbursed", "Partially Paid"].includes(l.status)).length)
const pendingCount = computed(() => currentLoans.value.filter(a => a._is_application && a.status === "Open").length)
const closedCount = computed(() => currentLoans.value.filter(l => ["Closed", "Repaid"].includes(l.status)).length)

const statusTabs = computed(() => [
	{ key: "all", label: __("All"), count: currentLoans.value.length },
	{ key: "active", label: __("Active"), count: activeCount.value },
	{ key: "pending", label: __("Pending"), count: pendingCount.value },
	{ key: "closed", label: __("Closed"), count: closedCount.value },
	...(leftLoans.value.length > 0 ? [{ key: "left", label: __("Left"), count: leftLoans.value.length }] : []),
])

const summaryTotals = computed(() => {
	const src = activeTab.value === "left" ? leftLoans.value : currentLoans.value
	let total_sanctioned = 0, total_repaid = 0
	for (const l of src) {
		if (l._is_application) continue
		total_sanctioned += l.loan_amount || 0
		total_repaid += l.total_amount_paid || 0
	}
	return { total_sanctioned, total_repaid, total_remaining: total_sanctioned - total_repaid }
})

const filteredLoans = computed(() => {
	let list
	if (activeTab.value === "left") {
		list = leftLoans.value
	} else if (activeTab.value === "active") {
		list = currentLoans.value.filter(l => ["Disbursed", "Partially Paid"].includes(l.status))
	} else if (activeTab.value === "pending") {
		list = currentLoans.value.filter(a => a._is_application && a.status === "Open")
	} else if (activeTab.value === "closed") {
		list = currentLoans.value.filter(l => ["Closed", "Repaid"].includes(l.status))
	} else {
		list = currentLoans.value
	}
	if (searchQuery.value) {
		const q = searchQuery.value.toLowerCase()
		list = list.filter(l =>
			(l.applicant_name || "").toLowerCase().includes(q) ||
			(l.loan_type || "").toLowerCase().includes(q) ||
			(l.name || "").toLowerCase().includes(q)
		)
	}
	return list
})

async function loadLoans() {
	isLoading.value = true
	try {
		const [loanData, appData, leftEmps] = await Promise.all([
			call("frappe.client.get_list", {
				doctype: "Loan",
				fields: ["name", "applicant", "applicant_name", "loan_type", "loan_amount",
						 "total_amount_paid", "status", "posting_date", "repayment_start_date",
						 "repayment_periods", "monthly_repayment_amount", "rate_of_interest"],
				filters: { docstatus: 1 },
				order_by: "posting_date desc",
				limit_page_length: 200,
			}),
			call("frappe.client.get_list", {
				doctype: "Loan Application",
				fields: ["name", "applicant", "applicant_name", "loan_type", "loan_amount",
						 "status", "posting_date", "repayment_periods"],
				filters: { docstatus: ["<", 2] },
				order_by: "posting_date desc",
				limit_page_length: 100,
			}),
			call("frappe.client.get_list", {
				doctype: "Employee",
				fields: ["name"],
				filters: { status: "Left" },
				limit_page_length: 500,
			}),
		])
		loans.value = loanData || []
		loanApplications.value = appData || []
		leftEmployeeIds.value = new Set((leftEmps || []).map(e => e.name))
	} catch (e) {
		_errToast(e, "Failed to load loans")
	}
	isLoading.value = false
}

async function approveLoanApp(app) {
	isProcessing.value = true
	try {
		await call("frappe.client.set_value", {
			doctype: "Loan Application",
			name: app.name,
			fieldname: "status",
			value: "Approved",
		})
		toast({ title: __("Loan application approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		loadLoans()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	isProcessing.value = false
}

async function rejectLoanApp(app) {
	isProcessing.value = true
	try {
		await call("frappe.client.set_value", {
			doctype: "Loan Application",
			name: app.name,
			fieldname: "status",
			value: "Rejected",
		})
		toast({ title: __("Loan application rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-orange-500" })
		loadLoans()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	isProcessing.value = false
}

function loanProgress(loan) {
	if (!loan.loan_amount || loan.loan_amount === 0) return 0
	return Math.min(100, Math.round(((loan.total_amount_paid || 0) / loan.loan_amount) * 100))
}

function loanStatusBg(status) {
	const map = { "Disbursed": "bg-blue-100", "Partially Paid": "bg-orange-100", "Open": "bg-yellow-100", "Approved": "bg-green-100", "Closed": "bg-gray-100", "Repaid": "bg-green-100", "Rejected": "bg-red-100" }
	return map[status] || "bg-gray-100"
}
function loanStatusIcon(status) {
	const map = { "Disbursed": "credit-card", "Partially Paid": "clock", "Open": "file-text", "Approved": "check-circle", "Closed": "lock", "Repaid": "check", "Rejected": "x-circle" }
	return map[status] || "credit-card"
}
function loanStatusColor(status) {
	const map = { "Disbursed": "text-blue-600", "Partially Paid": "text-orange-600", "Open": "text-yellow-600", "Approved": "text-green-600", "Closed": "text-gray-700", "Repaid": "text-green-600", "Rejected": "text-red-600" }
	return map[status] || "text-gray-700"
}
function loanStatusBadge(status) {
	const map = { "Disbursed": "bg-blue-100 text-blue-700", "Partially Paid": "bg-orange-100 text-orange-700", "Open": "bg-yellow-100 text-yellow-700", "Approved": "bg-green-100 text-green-700", "Closed": "bg-gray-100 text-gray-700", "Repaid": "bg-green-100 text-green-700", "Rejected": "bg-red-100 text-red-700" }
	return map[status] || "bg-gray-100 text-gray-700"
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

watch(() => employee.data?.company, (c) => { if (c) loadLoans() }, { immediate: true })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
