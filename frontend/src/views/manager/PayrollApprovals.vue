<template>
	<BaseLayout pageTitle="Payroll Approvals" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Period Selector -->
				<div class="flex items-center gap-2">
					<select v-model="selectedMonth" @change="loadReviews"
						class="flex-1 bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
					</select>
					<select v-model="selectedYear" @change="loadReviews"
						style="width:80px" class="bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-xl px-2.5 py-2 outline-none">
						<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
					</select>
				</div>

				<!-- Search -->
				<div class="relative">
					<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
					<input v-model="search" type="text" :placeholder="__('Search employee...')"
						class="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 outline-none" />
				</div>

				<!-- Status Filter Pills -->
				<div class="flex gap-2 overflow-x-auto no-scrollbar">
					<button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
						class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1"
						:class="activeTab === tab.key ? tabActiveClass(tab.key) : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ tab.label }}
						<span v-if="tab.count > 0"
							class="text-[11px] font-black px-1 min-w-[16px] text-center rounded-full"
							:class="activeTab === tab.key ? 'bg-white/25' : 'bg-gray-200/80'">{{ tab.count }}</span>
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!filteredReviews.length" class="text-center py-16">
					<FeatherIcon name="inbox" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
					<div class="text-sm text-gray-700">{{ activeTab === 'all' ? __('No reviews this month') : __('No reviews in this status') }}</div>
				</div>

				<template v-else>
					<!-- Summary -->
					<div class="flex items-center justify-between px-1">
						<span class="text-xs text-gray-600">{{ filteredReviews.length }} {{ __('reviews') }}</span>
						<div class="flex items-center gap-2">
							<span class="text-[11px] font-bold text-green-600">{{ fmt(totalEarnings) }} earn</span>
							<span class="text-[11px] font-bold text-red-600">{{ fmt(totalDeductions) }} ded</span>
							<span class="text-[11px] font-black text-gray-800">{{ fmt(totalNet) }} net</span>
						</div>
					</div>

					<!-- Grouped Reviews -->
					<div class="flex flex-col gap-2">
						<div v-for="group in groupedReviews" :key="group.key" class="card-premium overflow-hidden">
							<!-- Group Header -->
							<div class="flex items-center justify-between px-3 py-2 bg-gray-100/60 border-b border-gray-100/60">
								<span class="text-xs font-black text-gray-600">{{ group.label }}</span>
								<div class="flex items-center gap-2">
									<span class="text-[11px] font-bold text-gray-800">{{ fmt(group.net) }} net</span>
									<span class="text-[11px] font-bold text-gray-600">{{ group.items.length }}</span>
								</div>
							</div>
							<!-- Review Rows -->
							<div v-for="(rev, idx) in group.items" :key="rev.name"
								class="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
								:class="idx < group.items.length - 1 && 'border-b border-gray-50'">
								<!-- Avatar -->
								<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
									:class="avatarBg(rev.employee_name)">
									<span class="text-xs font-bold text-white">{{ initials(rev.employee_name) }}</span>
								</div>
								<!-- Info -->
								<div class="flex-1 min-w-0 cursor-pointer" @click="viewDetail(rev)">
									<div class="text-xs font-semibold text-gray-800 truncate">{{ rev.employee_name }}</div>
									<div class="text-[11px] text-gray-600 truncate">
										<span class="text-green-600 font-bold">{{ fmt(rev.total_earnings) }}</span>
										<span class="mx-0.5">-</span>
										<span class="text-red-600 font-bold">{{ fmt(rev.total_deductions) }}</span>
										<span class="mx-0.5">=</span>
										<span class="text-gray-800 font-black">{{ fmt(rev.net_adjustment) }}</span>
									</div>
								</div>
								<!-- Status Badge -->
								<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
									:class="statusBadge(rev.status)">{{ shortStatus(rev.status) }}</span>
								<!-- Action Buttons (inline, compact) -->
								<div v-if="rev.status === 'Pending HR' || rev.status === 'Pending CEO'"
									class="flex gap-1 flex-shrink-0">
									<button @click.stop="approveReview(rev)" :disabled="rev._processing"
										class="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center active:bg-green-600 disabled:opacity-50 transition-colors">
										<FeatherIcon name="check" class="w-3.5 h-3.5" />
									</button>
									<button @click.stop="rejectReview(rev)" :disabled="rev._processing"
										class="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center active:bg-red-600 disabled:opacity-50 transition-colors">
										<FeatherIcon name="x" class="w-3.5 h-3.5" />
									</button>
								</div>
								<!-- Chevron for non-actionable -->
								<FeatherIcon v-else name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0 cursor-pointer"
									@click="viewDetail(rev)" />
							</div>
						</div>
					</div>

					<!-- Bulk Actions (NOT floating, at bottom of content) -->
					<div v-if="bulkAvailable" class="flex gap-2 mt-1 mb-4">
						<button @click="bulkApprove" :disabled="bulkProcessing"
							class="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
							{{ bulkProcessing === 'approve' ? '...' : __('Approve All') }} ({{ pendingCount }})
						</button>
						<button @click="bulkReject" :disabled="bulkProcessing"
							class="px-4 bg-red-100 text-red-700 rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
							{{ bulkProcessing === 'reject' ? '...' : __('Reject All') }}
						</button>
					</div>
				</template>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")
const router = useRouter()
const route = useRoute()

const API_REVIEW = "icd3s_attendance.icd3s_attendance.api.modules.payroll_review"
const API_MP = "icd3s_attendance.icd3s_attendance.api.modules.monthly_payroll"

const now = new Date()
const selectedMonth = ref(parseInt(route.query.month) || now.getMonth() + 1)
const selectedYear = ref(parseInt(route.query.year) || now.getFullYear())
const isLoading = ref(false)
const activeTab = ref("pending_hr")
const bulkProcessing = ref(false)
const search = ref("")

const reviews = ref([])

const months = [
	{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
	{ value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
	{ value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
	{ value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

// Counts per status
const pendingHrCount = computed(() => reviews.value.filter(r => r.status === "Pending HR").length)
const pendingCeoCount = computed(() => reviews.value.filter(r => r.status === "Pending CEO").length)
const approvedCount = computed(() => reviews.value.filter(r => r.status === "Approved" || r.status === "Synced").length)
const rejectedCount = computed(() => reviews.value.filter(r => r.status === "Rejected" || r.status === "Draft").length)

const tabs = computed(() => [
	{ key: "pending_hr", label: "Pending HR", count: pendingHrCount.value },
	{ key: "pending_ceo", label: "Pending CEO", count: pendingCeoCount.value },
	{ key: "approved", label: "Approved", count: approvedCount.value },
	{ key: "rejected", label: "Rejected", count: rejectedCount.value },
	{ key: "all", label: "All", count: reviews.value.length },
])

function tabActiveClass(key) {
	return {
		pending_hr: "bg-orange-600 text-white",
		pending_ceo: "bg-purple-600 text-white",
		approved: "bg-green-700 text-white",
		rejected: "bg-red-700 text-white",
		all: "bg-gray-800 text-white",
	}[key] || "bg-gray-800 text-white"
}

// Filtered by tab + search
const filteredReviews = computed(() => {
	let list = reviews.value
	if (activeTab.value === "pending_hr") list = list.filter(r => r.status === "Pending HR")
	else if (activeTab.value === "pending_ceo") list = list.filter(r => r.status === "Pending CEO")
	else if (activeTab.value === "approved") list = list.filter(r => r.status === "Approved" || r.status === "Synced")
	else if (activeTab.value === "rejected") list = list.filter(r => r.status === "Rejected" || r.status === "Draft")

	if (search.value.trim()) {
		const q = search.value.trim().toLowerCase()
		list = list.filter(r => r.employee_name?.toLowerCase().includes(q) || r.employee?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q))
	}
	return list
})

// Group by department
const groupedReviews = computed(() => {
	const items = filteredReviews.value
	if (!items.length) return []

	const byDept = {}
	for (const rev of items) {
		const dept = rev.department || "No Department"
		if (!byDept[dept]) byDept[dept] = []
		byDept[dept].push(rev)
	}
	return Object.entries(byDept)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([dept, list]) => ({
			key: dept,
			label: dept,
			items: list.sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || "")),
			net: list.reduce((s, r) => s + (parseFloat(r.net_adjustment) || 0), 0),
		}))
})

const pendingCount = computed(() => filteredReviews.value.length)
const totalEarnings = computed(() => filteredReviews.value.reduce((s, r) => s + (parseFloat(r.total_earnings) || 0), 0))
const totalDeductions = computed(() => filteredReviews.value.reduce((s, r) => s + (parseFloat(r.total_deductions) || 0), 0))
const totalNet = computed(() => filteredReviews.value.reduce((s, r) => s + (parseFloat(r.net_adjustment) || 0), 0))

const bulkAvailable = computed(() => {
	return filteredReviews.value.length > 0 && (activeTab.value === "pending_hr" || activeTab.value === "pending_ceo")
})

async function loadReviews() {
	isLoading.value = true
	try {
		const data = await call(`${API_REVIEW}.get_payroll_reviews`, {
			month: selectedMonth.value, year: selectedYear.value
		})
		reviews.value = (data?.reviews || []).map(r => ({ ...r, _processing: null }))
	} catch (e) {
		console.error("[PayrollApprovals]", e)
	}
	isLoading.value = false
}

async function approveReview(rev) {
	rev._processing = "approve"
	try {
		if (rev.status === "Pending HR") {
			await call(`${API_REVIEW}.hr_approve_review`, { review_name: rev.name })
		} else if (rev.status === "Pending CEO") {
			await call(`${API_REVIEW}.ceo_approve_review`, { review_name: rev.name })
		}
		toast({ title: __("Approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		loadReviews()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		rev._processing = null
	}
}

async function rejectReview(rev) {
	rev._processing = "reject"
	try {
		await call(`${API_REVIEW}.reject_review`, { review_name: rev.name })
		toast({ title: __("Rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		loadReviews()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		rev._processing = null
	}
}

function viewDetail(rev) {
	router.push({
		name: "PayrollEmployeeDetail",
		params: { employee: rev.employee },
		query: { month: selectedMonth.value, year: selectedYear.value }
	})
}

async function bulkApprove() {
	bulkProcessing.value = "approve"
	try {
		const mpName = await getMPName()
		if (!mpName) {
			toast({ title: __("No Monthly Payroll found"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-orange-500" })
			bulkProcessing.value = false
			return
		}
		if (activeTab.value === "pending_hr") {
			await call(`${API_MP}.bulk_hr_approve`, { monthly_payroll_name: mpName })
		} else {
			await call(`${API_MP}.bulk_ceo_approve`, { monthly_payroll_name: mpName })
		}
		toast({ title: __("All approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		loadReviews()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	bulkProcessing.value = false
}

async function bulkReject() {
	bulkProcessing.value = "reject"
	try {
		const mpName = await getMPName()
		if (!mpName) {
			toast({ title: __("No Monthly Payroll found"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-orange-500" })
			bulkProcessing.value = false
			return
		}
		await call(`${API_MP}.bulk_reject`, { monthly_payroll_name: mpName })
		toast({ title: __("All rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		loadReviews()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	bulkProcessing.value = false
}

async function getMPName() {
	try {
		const result = await call("frappe.client.get_value", {
			doctype: "ICD3S Monthly Payroll",
			fieldname: "name",
			filters: { month: String(selectedMonth.value).padStart(2, "0"), year: String(selectedYear.value) },
		})
		return result?.name || null
	} catch { return null }
}

function shortStatus(status) {
	return { "Pending HR": "HR", "Pending CEO": "CEO", "Approved": "OK", "Synced": "Synced", "Draft": "Draft", "Rejected": "Rej" }[status] || status
}

function statusBadge(status) {
	return {
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Synced": "bg-indigo-100 text-indigo-700",
		"Draft": "bg-gray-100 text-gray-600",
		"Rejected": "bg-red-100 text-red-700",
	}[status] || "bg-gray-100 text-gray-600"
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
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

watch(() => employee.data?.company, (c) => { if (c) loadReviews() }, { immediate: true })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
