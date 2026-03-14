<template>
	<BaseLayout :pageTitle="__('Salary')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-3">

				<!-- Month Selector -->
				<div class="flex items-center justify-between card-premium p-2.5">
					<button @click="prevMonth" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-left" class="w-4 text-gray-700" />
					</button>
					<div class="flex items-center gap-2">
						<div class="text-sm font-bold text-gray-900">
							{{ monthNames[selectedMonth - 1] }} {{ selectedYear }}
						</div>
						<span v-if="mpData" class="text-xs font-bold px-2 py-0.5 rounded-full" :class="statusBadgeCls">
							{{ mpData.status }}
						</span>
						<span v-else class="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
							Live
						</span>
					</div>
					<button @click="nextMonth" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-right" class="w-4 text-gray-700" />
					</button>
				</div>

				<div v-if="isLoading" class="flex items-center justify-center py-16">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<template v-else>

					<!-- Quick Summary (single compact row) -->
					<div v-if="runTotals.count > 0" class="flex items-center gap-3 px-1">
						<span class="text-xs text-gray-700"><b class="text-gray-800">{{ runTotals.count }}</b> emp</span>
						<span class="text-xs text-gray-700"><b class="text-green-700">{{ fmt(runTotals.ot_amount) }}</b> OT</span>
						<span class="text-xs text-gray-700"><b class="text-red-700">{{ runTotals.penalties }}</b> pen</span>
						<span class="text-xs text-gray-700"><b class="text-orange-700">{{ runTotals.absences || 0 }}</b> abs</span>
						<span class="text-xs text-gray-700"><b class="text-blue-700">{{ fmt(runTotals.commission) }}</b> comm</span>
					</div>

					<!-- Manage Navigation -->
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button v-for="(item, idx) in navMenu" :key="item.path"
							@click="goTo(item.path)"
							class="flex flex-row items-center p-2.5 justify-between active:bg-white/30 transition-colors"
							:class="idx !== navMenu.length - 1 && 'border-b border-white/40'">
							<div class="flex flex-row items-center gap-2.5 grow">
								<div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="item.bg">
									<FeatherIcon :name="item.icon" class="h-[22px] w-[22px]" :class="item.ic" />
								</div>
								<div class="text-left">
									<div class="text-base font-medium text-gray-800">{{ item.label }}</div>
									<div v-if="item.sub" class="text-xs text-gray-500">{{ item.sub }}</div>
								</div>
							</div>
							<FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-600" />
						</button>
					</div>

					<!-- Live Activity Feed - COLLAPSED -->
					<div>
						<button @click="showFeed = !showFeed"
							class="w-full flex items-center gap-2.5 p-2.5 glass-section rounded-xl active:scale-[0.99] transition-transform">
							<div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
								<FeatherIcon name="activity" class="h-[22px] w-[22px] text-orange-600" />
							</div>
							<div class="flex-1 text-left">
								<div class="text-base font-medium text-gray-800">{{ __('Live Activity') }}</div>
								<div class="text-xs text-gray-500">{{ __('Penalties, overtime, commissions') }}</div>
							</div>
							<span class="text-sm font-black text-orange-600">{{ feedSummary.total_entries || 0 }}</span>
							<FeatherIcon :name="showFeed ? 'chevron-up' : 'chevron-down'" class="w-4 h-4 text-gray-600" />
						</button>

						<div v-if="showFeed" class="mt-2">
							<!-- Filter Tabs -->
							<div class="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
								<button v-for="f in feedFilters" :key="f.key" @click="feedFilter = f.key"
									class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
									:class="feedFilter === f.key ? f.activeCls : 'bg-gray-100 text-gray-700 active:bg-gray-200'">
									{{ f.label }}
									<span v-if="f.count > 0" class="ml-1">{{ f.count }}</span>
								</button>
							</div>

							<div v-if="!filteredFeed.length" class="card-premium rounded-xl p-6 text-center">
								<FeatherIcon name="inbox" class="w-7 h-7 text-gray-700 mx-auto mb-1" />
								<div class="text-xs text-gray-600">{{ __('No activity this month') }}</div>
							</div>

							<div v-else class="flex flex-col gap-1.5">
								<div v-for="item in displayedFeed" :key="item.doc_name + item.type + item.date"
									@click="goToFeedItem(item)"
									class="card-premium rounded-xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform">
									<div class="p-2.5 flex items-center gap-2.5">
										<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
											:class="feedIconCls(item.type)">
											<FeatherIcon :name="feedIcon(item.type)" class="w-3.5 h-3.5" :class="feedIconColor(item.type)" />
										</div>
										<div class="flex-1 min-w-0">
											<div class="text-xs font-bold text-gray-900 truncate">{{ item.employee_name }}</div>
											<div class="text-xs text-gray-600 truncate">{{ item.description }}</div>
										</div>
										<div class="text-xs font-black flex-shrink-0" :class="amtCls(item.type)">{{ item.amount_label }}</div>
										<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
									</div>

									<!-- Inline Excuse Actions -->
									<div v-if="item.type === 'penalty' && item.status === 'Pending HR'"
										class="flex items-center gap-2 px-2.5 py-2 bg-orange-50 border-t border-orange-100"
										@click.stop>
										<FeatherIcon name="alert-circle" class="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
										<span class="text-xs font-bold text-orange-700 flex-1">{{ __('Excuse pending') }}</span>
										<button @click.stop="approveExcuse(item)" :disabled="isProcessing === item.doc_name"
											class="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-bold active:bg-green-700 disabled:opacity-50 flex items-center gap-1">
											<FeatherIcon name="check" class="w-3 h-3" />
											{{ isProcessing === item.doc_name ? '...' : __('Approve') }}
										</button>
										<button @click.stop="rejectExcuseStart(item)" :disabled="isProcessing === item.doc_name"
											class="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold active:bg-red-200 disabled:opacity-50">
											<FeatherIcon name="x" class="w-3 h-3" />
										</button>
									</div>

									<!-- Status Badge -->
									<div v-else-if="item.type === 'penalty' && item.status && item.status !== 'No Excuse'"
										class="px-2.5 py-1.5 border-t border-gray-100">
										<span class="text-xs font-bold px-2 py-0.5 rounded-full"
											:class="excuseBadgeCls(item.status)">
											{{ excuseLabel(item.status) }}
										</span>
									</div>

									<!-- Meal Status -->
									<div v-else-if="item.type === 'meal' && item.status"
										class="px-2.5 py-1.5 border-t border-gray-100">
										<span class="text-xs font-bold px-2 py-0.5 rounded-full"
											:class="mealBadgeCls(item.status)">
											{{ item.status }}
										</span>
									</div>
								</div>

								<!-- Show More -->
								<button v-if="filteredFeed.length > maxFeedItems" @click.stop="maxFeedItems += 20"
									class="py-2.5 text-center text-xs font-bold text-blue-600 active:text-blue-800 card-premium rounded-xl">
									{{ __('Show More') }} ({{ filteredFeed.length - maxFeedItems }} {{ __('remaining') }})
								</button>
							</div>
						</div>
					</div>

					<!-- Employees Section - COLLAPSED -->
					<div>
						<button @click="showEmployees = !showEmployees"
							class="w-full flex items-center gap-2.5 p-2.5 glass-section rounded-xl active:scale-[0.99] transition-transform">
							<div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
								<FeatherIcon name="users" class="h-[22px] w-[22px] text-blue-600" />
							</div>
							<div class="flex-1 text-left">
								<div class="text-base font-medium text-gray-800">{{ __('Employees') }}</div>
								<div class="text-xs text-gray-500">{{ __('Per-employee salary details') }}</div>
							</div>
							<span class="text-sm font-black text-blue-600">{{ employees.length }}</span>
							<FeatherIcon :name="showEmployees ? 'chevron-up' : 'chevron-down'" class="w-4 h-4 text-gray-600" />
						</button>

						<div v-if="showEmployees" class="flex flex-col gap-1.5 mt-2">
							<div v-for="emp in employees" :key="emp.employee"
								@click="goToEmployee(emp)"
								class="card-premium rounded-xl p-2.5 flex items-center gap-2.5 active:scale-[0.99] transition-transform cursor-pointer">
								<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
									:class="empAvatarCls(emp)">
									<img v-if="emp.image" :src="emp.image" class="w-full h-full object-cover" />
									<span v-else class="text-white">{{ (emp.employee_name || '?')[0] }}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ emp.employee_name }}</div>
									<div class="text-xs text-gray-700 truncate">{{ emp.department }}</div>
								</div>
								<div class="flex gap-1 flex-shrink-0">
									<span v-if="emp.penalty_count" class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{{ emp.penalty_count }}P</span>
									<span v-if="emp.ot_hours" class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{{ emp.ot_hours }}h</span>
									<span v-if="emp.absence_days" class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{{ emp.absence_days }}A</span>
								</div>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
							</div>
						</div>
					</div>

				</template>
			</div>

			<!-- Reject Excuse Bottom Sheet -->
			<Teleport to="body">
				<Transition name="sheet">
					<div v-if="showExcuseReject" class="fixed inset-0 z-[100] flex items-end justify-center">
						<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showExcuseReject = false"></div>
						<div class="relative w-full max-w-md rounded-t-3xl bg-white p-5 z-10 shadow-2xl pb-safe">
							<div class="flex justify-center mb-3">
								<div class="w-10 h-1.5 rounded-full bg-gray-300/50"></div>
							</div>
							<div class="text-base font-bold text-red-600 mb-1">{{ __('Reject Excuse') }}</div>
							<div class="text-sm text-gray-700 mb-3">{{ excuseRejectItem?.employee_name }} - {{ excuseRejectItem?.description }}</div>
							<textarea v-model="excuseRejectReason" :placeholder="__('Rejection reason')"
								class="w-full border border-gray-200 rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"></textarea>
							<div class="flex gap-2 mt-3">
								<button @click="showExcuseReject = false"
									class="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold active:bg-gray-200">
									{{ __('Cancel') }}
								</button>
								<button @click="doRejectExcuse" :disabled="isProcessing"
									class="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50 active:bg-red-700">
									{{ __('Reject') }}
								</button>
							</div>
						</div>
					</div>
				</Transition>
			</Teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")
const router = useRouter()
const API = "icd3s_attendance.icd3s_attendance.api.modules.monthly_payroll"
const ATT_API = "icd3s_attendance.icd3s_attendance.api.attendance"

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const isLoading = ref(false)
const isProcessing = ref(false)

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const mpData = ref(null)
const runTotals = ref({ penalties: 0, ot_amount: 0, commission: 0, count: 0, loan_amount: 0, meal_amount: 0, absences: 0 })
const feed = ref([])
const feedSummary = ref({ total_entries: 0 })
const employees = ref([])

const feedFilter = ref("all")
const maxFeedItems = ref(15)
const showFeed = ref(false)
const showEmployees = ref(false)
const showExcuseReject = ref(false)
const excuseRejectItem = ref(null)
const excuseRejectReason = ref("")

function prevMonth() {
	if (selectedMonth.value === 1) { selectedMonth.value = 12; selectedYear.value-- }
	else selectedMonth.value--
	loadAll()
}
function nextMonth() {
	if (selectedMonth.value === 12) { selectedMonth.value = 1; selectedYear.value++ }
	else selectedMonth.value++
	loadAll()
}

const STATUS_BADGE = {
	"Draft": "bg-gray-100 text-gray-700", "Generated": "bg-blue-100 text-blue-700",
	"Pending HR Review": "bg-orange-100 text-orange-700", "Pending CEO Approval": "bg-purple-100 text-purple-700",
	"Approved": "bg-green-100 text-green-700", "Synced": "bg-indigo-100 text-indigo-700", "Rejected": "bg-red-100 text-red-700",
}
const statusBadgeCls = computed(() => STATUS_BADGE[mpData.value?.status] || "bg-gray-100 text-gray-700")

const feedFilters = computed(() => [
	{ key: "all", label: "All", count: feedSummary.value.total_entries || 0, activeCls: "bg-gray-900 text-white" },
	{ key: "penalty", label: "Penalties", count: feedSummary.value.penalties || 0, activeCls: "bg-red-600 text-white" },
	{ key: "overtime", label: "Overtime", count: feedSummary.value.overtimes || 0, activeCls: "bg-green-600 text-white" },
	{ key: "absence", label: "Absences", count: feedSummary.value.absences || 0, activeCls: "bg-orange-600 text-white" },
	{ key: "loan", label: "Loans", count: feedSummary.value.loan_count || 0, activeCls: "bg-teal-600 text-white" },
	{ key: "commission", label: "Commission", count: feedSummary.value.commissions || 0, activeCls: "bg-blue-600 text-white" },
	{ key: "meal", label: "Meals", count: feedSummary.value.meals || 0, activeCls: "bg-emerald-600 text-white" },
])

const filteredFeed = computed(() => {
	if (feedFilter.value === "all") return feed.value
	return feed.value.filter(i => i.type === feedFilter.value)
})
const displayedFeed = computed(() => filteredFeed.value.slice(0, maxFeedItems.value))

const navMenu = computed(() => {
	const items = []
	if (mpData.value) {
		items.push({ icon: "check-square", label: "Finalize Payroll", sub: mpData.value.status, path: "/manager/salary/actions", bg: "bg-indigo-50", ic: "text-indigo-600" })
	}
	const rt = runTotals.value
	const fs = feedSummary.value
	const earningsCount = (fs.overtimes || 0) + (fs.commissions || 0) + (fs.meals || 0)
	const deductionsCount = (fs.penalties || 0) + (fs.absences || 0) + (fs.loan_count || 0)
	items.push(
		{ icon: "trending-up", label: "Earnings", sub: earningsCount ? `${earningsCount} items · ${fmtShort(rt.ot_amount)} EGP` : "OT, Commission, Meals", path: "/manager/salary/earnings", bg: "bg-green-50", ic: "text-green-600" },
		{ icon: "trending-down", label: "Deductions", sub: deductionsCount ? `${deductionsCount} items · ${rt.penalties} pen, ${rt.absences || 0} abs` : "Absence, Late, Loans", path: "/manager/salary/deductions", bg: "bg-red-50", ic: "text-red-600" },
		{ icon: "users", label: "Employees", sub: `${rt.count || 0} employees`, path: "/manager/salary/employees", bg: "bg-blue-50", ic: "text-blue-600" },
		{ icon: "check-circle", label: "Approvals", sub: "HR & CEO review", path: "/manager/salary/approvals", bg: "bg-purple-50", ic: "text-purple-600" },
		{ icon: "layers", label: "Structures", sub: "Salary structures", path: "/manager/salary/structures", bg: "bg-cyan-50", ic: "text-cyan-600" },
		{ icon: "plus-circle", label: "Additional", sub: "Bonus & adjustments", path: "/manager/salary/additional", bg: "bg-amber-50", ic: "text-amber-600" },
		{ icon: "credit-card", label: "Loans", sub: rt.loan_amount ? `${fmtShort(rt.loan_amount)} EGP active` : "Active loans", path: "/manager/salary/loans", bg: "bg-teal-50", ic: "text-teal-600" },
		{ icon: "coffee", label: "Meals", sub: "Approve requests", path: "/manager/meal-approvals", bg: "bg-emerald-50", ic: "text-emerald-600" },
	)
	return items
})

async function loadAll() {
	isLoading.value = true
	try {
		const [overviewRes, feedRes] = await Promise.all([
			call(`${API}.get_payroll_overview`, { month: selectedMonth.value, year: selectedYear.value }),
			call(`${API}.get_live_feed`, { month: selectedMonth.value, year: selectedYear.value }),
		])
		mpData.value = overviewRes?.monthly_payroll || null
		employees.value = overviewRes?.employees || []
		runTotals.value = overviewRes?.running_totals || { penalties: 0, ot_amount: 0, commission: 0, count: 0, loan_amount: 0, meal_amount: 0, absences: 0 }
		feed.value = feedRes?.feed || []
		feedSummary.value = feedRes?.summary || { total_entries: 0 }
	} catch (e) { console.error("[PayrollHub]", e); toast({ title: __("Failed to load payroll data"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" }) }
	isLoading.value = false
}

async function approveExcuse(item) {
	isProcessing.value = item.doc_name
	try {
		await call(`${ATT_API}.approve_late_excuse`, { penalty_name: item.doc_name })
		toast({ title: __("Excuse approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadAll()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	isProcessing.value = false
}

function rejectExcuseStart(item) {
	excuseRejectItem.value = item
	excuseRejectReason.value = ""
	showExcuseReject.value = true
}

async function doRejectExcuse() {
	if (!excuseRejectItem.value) return
	isProcessing.value = excuseRejectItem.value.doc_name
	showExcuseReject.value = false
	try {
		await call(`${ATT_API}.reject_late_excuse`, {
			penalty_name: excuseRejectItem.value.doc_name,
			rejection_reason: excuseRejectReason.value.trim() || "Rejected by HR",
		})
		toast({ title: __("Excuse rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadAll()
	} catch (e) {
		toast({ title: e.message || __("Failed"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	isProcessing.value = false
	excuseRejectItem.value = null
}

function goTo(path) {
	router.push({ path, query: { month: selectedMonth.value, year: selectedYear.value } })
}
function goToEmployee(emp) {
	router.push({ path: `/manager/salary/employee/${emp.employee}`, query: { month: selectedMonth.value, year: selectedYear.value } })
}
function goToFeedItem(item) {
	if (item.employee) goToEmployee({ employee: item.employee })
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}
function fmtShort(n) {
	if (!n) return "0"
	if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
	return Math.round(n).toString()
}

function feedIcon(type) {
	return { penalty: "alert-triangle", overtime: "clock", commission: "dollar-sign", meal: "coffee", correction: "edit-3", absence: "user-x", loan: "credit-card" }[type] || "activity"
}
function feedIconCls(type) {
	return { penalty: "bg-red-100", overtime: "bg-green-100", commission: "bg-blue-100", meal: "bg-emerald-100", correction: "bg-amber-100", absence: "bg-orange-100", loan: "bg-teal-100" }[type] || "bg-gray-100"
}
function feedIconColor(type) {
	return { penalty: "text-red-600", overtime: "text-green-600", commission: "text-blue-600", meal: "text-emerald-600", correction: "text-amber-600", absence: "text-orange-600", loan: "text-teal-600" }[type] || "text-gray-600"
}
function amtCls(type) {
	return { penalty: "text-red-600", overtime: "text-green-600", commission: "text-blue-600", meal: "text-emerald-600", absence: "text-orange-600", loan: "text-teal-600" }[type] || "text-gray-900"
}

const AVATAR_COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", "bg-cyan-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500"]
function empAvatarCls(emp) {
	const name = emp.employee_name || ""
	let hash = 0
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function excuseBadgeCls(status) {
	return { "Pending CEO": "bg-purple-100 text-purple-700", "Approved": "bg-green-100 text-green-700", "Rejected": "bg-red-100 text-red-700" }[status] || "bg-gray-100 text-gray-700"
}
function excuseLabel(status) {
	return { "Pending CEO": "Pending CEO", "Approved": "Excused", "Rejected": "Rejected" }[status] || status
}
function mealBadgeCls(status) {
	return { "Approved": "bg-green-100 text-green-700", "Pending HR": "bg-orange-100 text-orange-700", "Delivered": "bg-emerald-100 text-emerald-700" }[status] || "bg-gray-100 text-gray-700"
}

watch(() => employee.data?.company, (c) => { if (c) loadAll() }, { immediate: true })
</script>

<style scoped>
.pb-safe { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
