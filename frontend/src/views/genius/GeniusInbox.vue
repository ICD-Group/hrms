<template>
	<BaseLayout :pageTitle="__('Notifications')">
		<template #body>
			<div class="flex flex-col gap-0 mt-1 mb-7">

				<!-- FILTER CHIPS -->
				<div class="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar">
					<button v-for="f in filters" :key="f.key"
						@click="activeFilter = f.key"
						class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
						:class="activeFilter === f.key
							? 'bg-icd-600 text-white shadow-sm'
							: 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400'"
					>
						<span>{{ f.label }}</span>
						<span v-if="f.key !== 'all' && getFilterCount(f) > 0"
							class="min-w-[16px] h-4 flex items-center justify-center rounded-full text-[11px] font-black"
							:class="activeFilter === f.key ? 'bg-white/25 text-white' : 'bg-gray-300/60 dark:bg-white/15 text-gray-700 dark:text-gray-300'"
						>{{ getFilterCount(f) }}</span>
					</button>
				</div>

				<!-- UNREAD HEADER -->
				<div v-if="unreadNotificationsCount.data > 0" class="flex items-center justify-between px-4 pb-2 pt-1">
					<div class="inline-flex items-center gap-1.5 bg-icd-50 dark:bg-icd-800/30 text-icd-700 dark:text-icd-300 px-2.5 py-1 rounded-full">
						<div class="w-1.5 h-1.5 rounded-full bg-icd-500 animate-pulse"></div>
						<span class="text-[11px] font-bold">{{ unreadNotificationsCount.data }} {{ __("unread") }}</span>
					</div>
					<button @click="markAllRead.submit" class="text-[11px] font-bold text-icd-600 dark:text-icd-300 active:opacity-60">
						{{ __("Mark all read") }}
					</button>
				</div>

				<!-- TIME-GROUPED NOTIFICATIONS -->
				<template v-if="visibleGroups.length">
					<div v-for="group in visibleGroups" :key="group.key" class="mb-1">
						<div class="px-4 py-2">
							<span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">{{ group.label }}</span>
						</div>
						<div class="flex flex-col gap-1.5 px-4">
							<div v-for="item in group.items" :key="item.name"
								class="card-premium p-0 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
								@click="openNotification(item)"
							>
								<div class="flex items-start gap-3 p-3.5" :class="!item.read ? 'border-l-[3px] border-l-icd-500' : ''">
									<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
										:class="getIconBg(item.reference_document_type)">
										<component
											v-if="getCustomIcon(item.reference_document_type)"
											:is="getCustomIcon(item.reference_document_type)"
											class="w-5 h-5"
											:class="getIconColor(item.reference_document_type)"
										/>
										<FeatherIcon
											v-else
											:name="getFeatherIcon(item.reference_document_type)"
											class="w-5 h-5"
											:class="getIconColor(item.reference_document_type)"
										/>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center justify-between gap-2">
											<div class="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
												{{ parseNotifName(item) }}
											</div>
											<span v-if="getDocStatus(item)"
												class="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
												:class="statusClass(getDocStatus(item))">
												{{ getDocStatus(item) }}
											</span>
										</div>
										<div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">{{ parseNotifSummary(item) }}</div>
										<div class="flex items-center gap-2 mt-1.5">
											<span class="text-[11px] text-gray-600 dark:text-gray-500">{{ dayjs(item.creation).fromNow() }}</span>
											<span v-if="item.reference_document_type"
												class="text-[11px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
												:class="getTypeChipClass(item.reference_document_type)">
												{{ getTypeLabel(item.reference_document_type) }}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</template>

				<!-- Empty State -->
				<div v-else-if="!notifications.loading" class="flex flex-col items-center justify-center py-20">
					<div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
						<FeatherIcon name="bell-off" class="w-6 h-6 text-gray-700" />
					</div>
					<div class="text-sm font-semibold text-gray-700 dark:text-gray-400">
						{{ activeFilter !== 'all' ? __('No {0} notifications', [activeFilterLabel]) : __('No notifications') }}
					</div>
					<div class="text-xs text-gray-600 dark:text-gray-500 mt-1">{{ __("You're all caught up") }}</div>
				</div>

				<!-- Loading -->
				<div v-if="notifications.loading" class="flex items-center justify-center py-12">
					<LoadingIndicator class="w-6 h-6 text-gray-600" />
				</div>

				<!-- Load More -->
				<div v-if="notifications.data?.length && notifications.hasNextPage" class="flex justify-center pt-2 pb-4 px-4">
					<button @click="loadMoreNotifs" class="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-white/8 text-sm font-semibold text-gray-600 dark:text-gray-400 active:bg-gray-200 transition-colors">
						{{ __("Load more") }}
					</button>
				</div>

			</div>

			<!-- DOC DETAIL SHEET -->
			<teleport to="#modals">
				<div v-if="docDetail" class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40" @click.self="docDetail = null">
					<div class="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl p-5 pb-safe-bottom animate-slide-up">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getIconBg(docDetail.type)">
									<component v-if="getCustomIcon(docDetail.type)" :is="getCustomIcon(docDetail.type)" class="w-4 h-4" :class="getIconColor(docDetail.type)" />
									<FeatherIcon v-else :name="getFeatherIcon(docDetail.type)" class="w-4 h-4" :class="getIconColor(docDetail.type)" />
								</div>
								<div>
									<div class="text-sm font-bold text-gray-900 dark:text-white">{{ getTypeLabel(docDetail.type) }}</div>
									<div class="text-[11px] text-gray-700">{{ docDetail.docName }}</div>
								</div>
							</div>
							<span v-if="docDetail.status" class="text-[11px] font-bold px-2.5 py-1 rounded-full" :class="statusClass(docDetail.status)">{{ docDetail.status }}</span>
						</div>
						<div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 mb-4">
							<div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ docDetail.message }}</div>
							<div class="text-xs text-gray-600 mt-2">{{ docDetail.time }}</div>
						</div>
						<div class="flex gap-2">
							<button @click="docDetail = null" class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 active:bg-gray-200">{{ __("Close") }}</button>
							<button @click="goToMyRequests" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-icd-600 text-white active:bg-icd-700 transition-colors">{{ __("My Requests") }}</button>
						</div>
					</div>
				</div>
			</teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { computed, inject, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { unreadNotificationsCount, notifications } from "@/data/notifications"

import LeaveIcon from "@/components/icons/LeaveIcon.vue"
import ExpenseIcon from "@/components/icons/ExpenseIcon.vue"
import SalaryIcon from "@/components/icons/SalaryIcon.vue"
import AttendanceIcon from "@/components/icons/AttendanceIcon.vue"
import HomeIcon from "@/components/icons/HomeIcon.vue"
import ShiftIcon from "@/components/icons/ShiftIcon.vue"
import EmployeeAdvanceIcon from "@/components/icons/EmployeeAdvanceIcon.vue"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()

// ==================== ICON MAPS ====================

const CUSTOM_ICON_MAP = {
	"Leave Application": LeaveIcon,
	"Expense Claim": ExpenseIcon,
	"Salary Slip": SalaryIcon,
	"Employee Advance": EmployeeAdvanceIcon,
	"Shift Request": ShiftIcon,
	"Shift Assignment": ShiftIcon,
	"Attendance Request": AttendanceIcon,
	"ICD3S Work Request": HomeIcon,
}

const FEATHER_ICON_MAP = {
	"ICD3S Meal Claim": "coffee",
	"ICD3S Attendance Correction": "edit-3",
	"ICD3S Shift Swap": "repeat",
	"ICD3S Device Binding": "smartphone",
	"ICD3S Late Penalty": "clock",
	"ICD3S Payroll Review": "clipboard",
	"ICD3S Monthly Payroll": "layers",
	"ICD3S Disciplinary Action": "alert-triangle",
	"ICD3S Monthly Attendance Summary": "bar-chart-2",
	"ICD3S Attendance Log": "log-in",
	"ICD3S Employee Permission": "unlock",
	"Loan Application": "credit-card",
	"Appraisal": "star",
	"Grievance": "flag",
	"Training Event": "book-open",
	"Travel Request": "map-pin",
}

const ICON_BG = {
	"Leave Application": "bg-blue-100 dark:bg-blue-800/25",
	"Expense Claim": "bg-green-100 dark:bg-green-800/25",
	"Salary Slip": "bg-sky-100 dark:bg-sky-800/25",
	"Employee Advance": "bg-cyan-100 dark:bg-cyan-800/25",
	"Shift Request": "bg-indigo-100 dark:bg-indigo-800/25",
	"Shift Assignment": "bg-indigo-100 dark:bg-indigo-800/25",
	"Attendance Request": "bg-teal-100 dark:bg-teal-800/25",
	"ICD3S Work Request": "bg-violet-100 dark:bg-violet-800/25",
	"ICD3S Meal Claim": "bg-emerald-100 dark:bg-emerald-800/25",
	"ICD3S Attendance Correction": "bg-purple-100 dark:bg-purple-800/25",
	"ICD3S Shift Swap": "bg-pink-100 dark:bg-pink-800/25",
	"ICD3S Device Binding": "bg-amber-100 dark:bg-amber-800/25",
	"ICD3S Late Penalty": "bg-orange-100 dark:bg-orange-800/25",
	"ICD3S Payroll Review": "bg-violet-100 dark:bg-violet-800/25",
	"ICD3S Monthly Payroll": "bg-fuchsia-100 dark:bg-fuchsia-800/25",
	"ICD3S Disciplinary Action": "bg-red-100 dark:bg-red-800/25",
	"ICD3S Monthly Attendance Summary": "bg-sky-100 dark:bg-sky-800/25",
	"ICD3S Attendance Log": "bg-teal-100 dark:bg-teal-800/25",
	"ICD3S Employee Permission": "bg-lime-100 dark:bg-lime-800/25",
	"Loan Application": "bg-cyan-100 dark:bg-cyan-800/25",
}

const ICON_COLOR = {
	"Leave Application": "text-blue-600 dark:text-blue-400",
	"Expense Claim": "text-green-600 dark:text-green-400",
	"Salary Slip": "text-sky-600 dark:text-sky-400",
	"Employee Advance": "text-cyan-600 dark:text-cyan-400",
	"Shift Request": "text-indigo-600 dark:text-indigo-400",
	"Shift Assignment": "text-indigo-600 dark:text-indigo-400",
	"Attendance Request": "text-teal-600 dark:text-teal-400",
	"ICD3S Work Request": "text-violet-600 dark:text-violet-400",
	"ICD3S Meal Claim": "text-emerald-600 dark:text-emerald-400",
	"ICD3S Attendance Correction": "text-purple-600 dark:text-purple-400",
	"ICD3S Shift Swap": "text-pink-600 dark:text-pink-400",
	"ICD3S Device Binding": "text-amber-600 dark:text-amber-400",
	"ICD3S Late Penalty": "text-orange-600 dark:text-orange-400",
	"ICD3S Payroll Review": "text-violet-600 dark:text-violet-400",
	"ICD3S Monthly Payroll": "text-fuchsia-600 dark:text-fuchsia-400",
	"ICD3S Disciplinary Action": "text-red-600 dark:text-red-400",
	"ICD3S Monthly Attendance Summary": "text-sky-600 dark:text-sky-400",
	"ICD3S Attendance Log": "text-teal-600 dark:text-teal-400",
	"ICD3S Employee Permission": "text-lime-600 dark:text-lime-400",
	"Loan Application": "text-cyan-600 dark:text-cyan-400",
}

function getCustomIcon(dt) { return CUSTOM_ICON_MAP[dt] || null }
function getFeatherIcon(dt) { return FEATHER_ICON_MAP[dt] || "bell" }
function getIconBg(dt) { return ICON_BG[dt] || "bg-gray-100 dark:bg-white/10" }
function getIconColor(dt) { return ICON_COLOR[dt] || "text-gray-700" }

// ==================== TYPE LABELS ====================

const TYPE_LABELS = {
	"ICD3S Work Request": "WFH", "Leave Application": "Leave", "Expense Claim": "Expense",
	"ICD3S Meal Claim": "Meal", "ICD3S Attendance Correction": "Correction", "ICD3S Shift Swap": "Swap",
	"ICD3S Device Binding": "Device", "ICD3S Late Penalty": "Late", "Attendance Request": "Attendance",
	"Employee Advance": "Advance", "Salary Slip": "Salary", "ICD3S Payroll Review": "Payroll",
	"ICD3S Monthly Payroll": "Payroll", "Loan Application": "Loan", "ICD3S Disciplinary Action": "Disciplinary",
	"Shift Request": "Shift", "Shift Assignment": "Shift", "Appraisal": "Appraisal",
	"Grievance": "Grievance", "Training Event": "Training", "Travel Request": "Travel",
	"ICD3S Monthly Attendance Summary": "Summary", "ICD3S Attendance Log": "Check-in",
	"ICD3S Employee Permission": "Permission",
}

const TYPE_CHIP_CLASS = {
	"Leave Application": "bg-blue-100 text-blue-700 dark:bg-blue-800/25 dark:text-blue-300",
	"Expense Claim": "bg-green-100 text-green-700 dark:bg-green-800/25 dark:text-green-300",
	"Salary Slip": "bg-sky-100 text-sky-700 dark:bg-sky-800/25 dark:text-sky-300",
	"Employee Advance": "bg-cyan-100 text-cyan-700 dark:bg-cyan-800/25 dark:text-cyan-300",
	"Shift Request": "bg-indigo-100 text-indigo-700 dark:bg-indigo-800/25 dark:text-indigo-300",
	"Shift Assignment": "bg-indigo-100 text-indigo-700 dark:bg-indigo-800/25 dark:text-indigo-300",
	"Attendance Request": "bg-teal-100 text-teal-700 dark:bg-teal-800/25 dark:text-teal-300",
	"ICD3S Work Request": "bg-violet-100 text-violet-700 dark:bg-violet-800/25 dark:text-violet-300",
	"ICD3S Meal Claim": "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/25 dark:text-emerald-300",
	"ICD3S Attendance Correction": "bg-purple-100 text-purple-700 dark:bg-purple-800/25 dark:text-purple-300",
	"ICD3S Shift Swap": "bg-pink-100 text-pink-700 dark:bg-pink-800/25 dark:text-pink-300",
	"ICD3S Device Binding": "bg-amber-100 text-amber-700 dark:bg-amber-800/25 dark:text-amber-300",
	"ICD3S Late Penalty": "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300",
	"ICD3S Payroll Review": "bg-violet-100 text-violet-700 dark:bg-violet-800/25 dark:text-violet-300",
	"ICD3S Monthly Payroll": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-800/25 dark:text-fuchsia-300",
	"ICD3S Disciplinary Action": "bg-red-100 text-red-700 dark:bg-red-800/25 dark:text-red-300",
	"ICD3S Monthly Attendance Summary": "bg-sky-100 text-sky-700 dark:bg-sky-800/25 dark:text-sky-300",
	"ICD3S Attendance Log": "bg-teal-100 text-teal-700 dark:bg-teal-800/25 dark:text-teal-300",
	"ICD3S Employee Permission": "bg-lime-100 text-lime-700 dark:bg-lime-800/25 dark:text-lime-300",
}

function getTypeLabel(dt) { return TYPE_LABELS[dt] || (dt || "").replace("ICD3S ", "") }
function getTypeChipClass(dt) { return TYPE_CHIP_CLASS[dt] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400" }

// ==================== FILTERS ====================

const activeFilter = ref("all")

const filters = [
	{ key: "all", label: "All" },
	{ key: "leave", label: "Leave", types: ["Leave Application"] },
	{ key: "salary", label: "Salary", types: ["Salary Slip", "ICD3S Payroll Review", "ICD3S Monthly Payroll", "ICD3S Monthly Attendance Summary"] },
	{ key: "attendance", label: "Attendance", types: ["Attendance Request", "ICD3S Attendance Correction", "ICD3S Late Penalty", "ICD3S Attendance Log", "ICD3S Employee Permission"] },
	{ key: "expense", label: "Expense", types: ["Expense Claim"] },
	{ key: "work", label: "WFH", types: ["ICD3S Work Request"] },
	{ key: "meal", label: "Meal", types: ["ICD3S Meal Claim"] },
	{ key: "shift", label: "Shift", types: ["Shift Request", "Shift Assignment", "ICD3S Shift Swap"] },
	{ key: "advance", label: "Advance", types: ["Employee Advance"] },
]

function getFilterCount(f) {
	if (!notifications.data?.length || !f.types) return 0
	return notifications.data.filter(item => f.types.includes(item.reference_document_type)).length
}

const activeFilterLabel = computed(() => {
	const f = filters.find(x => x.key === activeFilter.value)
	return f?.label || ""
})

// ==================== GROUPED NOTIFICATIONS ====================

const filteredNotifications = computed(() => {
	if (!notifications.data?.length) return []
	if (activeFilter.value === "all") return notifications.data
	const f = filters.find(x => x.key === activeFilter.value)
	if (!f?.types) return notifications.data
	return notifications.data.filter(item => f.types.includes(item.reference_document_type))
})

const visibleGroups = computed(() => {
	const items = filteredNotifications.value
	const now = dayjs()
	const today = [], yesterday = [], thisWeek = [], earlier = []
	for (const item of items) {
		const d = dayjs(item.creation)
		if (now.isSame(d, "day")) today.push(item)
		else if (now.subtract(1, "day").isSame(d, "day")) yesterday.push(item)
		else if (now.diff(d, "day") < 7) thisWeek.push(item)
		else earlier.push(item)
	}
	const result = []
	if (today.length) result.push({ key: "today", label: __("Today"), items: today })
	if (yesterday.length) result.push({ key: "yesterday", label: __("Yesterday"), items: yesterday })
	if (thisWeek.length) result.push({ key: "this_week", label: __("This Week"), items: thisWeek })
	if (earlier.length) result.push({ key: "earlier", label: __("Earlier"), items: earlier })
	return result
})

// ==================== NOTIFICATIONS ====================

const markAllRead = createResource({
	url: "hrms.api.mark_all_notifications_as_read",
	onSuccess() { notifications.reload() },
})

const docStatuses = ref({})

const STATUS_FIELD_MAP = {
	"ICD3S Work Request": "status", "Leave Application": "status", "Expense Claim": "approval_status",
	"ICD3S Meal Claim": "status", "ICD3S Attendance Correction": "status", "ICD3S Shift Swap": "status",
	"ICD3S Device Binding": "approval_status", "ICD3S Late Penalty": "status", "Attendance Request": "workflow_state",
	"Employee Advance": "status", "ICD3S Payroll Review": "status", "Salary Slip": "docstatus",
	"ICD3S Monthly Payroll": "status", "Loan Application": "status",
	"ICD3S Monthly Attendance Summary": "status", "ICD3S Attendance Log": "status",
	"ICD3S Employee Permission": "status",
}

async function fetchDocStatuses() {
	const items = notifications.data || []
	const batch = []
	for (const item of items) {
		if (!item.reference_document_type || !item.reference_document_name) continue
		const key = `${item.reference_document_type}:${item.reference_document_name}`
		if (docStatuses.value[key]) continue
		const fieldname = STATUS_FIELD_MAP[item.reference_document_type]
		if (!fieldname) continue
		batch.push({ doctype: item.reference_document_type, name: item.reference_document_name, fieldname })
	}
	if (!batch.length) return
	try {
		const result = await call("icd3s_attendance.icd3s_attendance.api.modules.manager.batch_get_doc_statuses", { items: JSON.stringify(batch) })
		if (result) Object.assign(docStatuses.value, result)
	} catch(e) { console.warn("[GeniusInbox] batch status fetch failed:", e) }
}

watch(() => notifications.data, (d) => { if (d?.length) fetchDocStatuses() }, { immediate: true })

function getDocStatus(item) {
	if (!item.reference_document_type || !item.reference_document_name) return null
	return docStatuses.value[`${item.reference_document_type}:${item.reference_document_name}`] || null
}

let notifStart = 0
function loadMoreNotifs() {
	notifStart += 20
	notifications.start = notifStart
	notifications.pageLength = 20
	notifications.list.fetch()
}

// ==================== ROUTING (ALL in-app, NO window.open!) ====================

// DocTypes with their own :id detail pages
const DETAIL_VIEW_ROUTES = {
	"Leave Application": "LeaveApplicationDetailView",
	"Expense Claim": "ExpenseClaimDetailView",
	"Shift Request": "ShiftRequestDetailView",
	"Shift Assignment": "ShiftAssignmentDetailView",
	"Attendance Request": "AttendanceRequestDetailView",
	"Employee Advance": "EmployeeAdvanceDetailView",
	"Appraisal": "AppraisalDetailView",
	"Grievance": "GrievanceDetailView",
	"Training Event": "TrainingEventDetailView",
	"Loan Application": "LoanApplicationDetailView",
	"Travel Request": "TravelRequestDetailView",
	"ICD3S Disciplinary Action": "DisciplinaryDetail",
}

// DocTypes without detail pages → route to best matching app page
const PAGE_ROUTES = {
	"Salary Slip": { name: "GeniusSalarySlip", useNameParam: true },
	"ICD3S Payroll Review": { name: "GeniusSalary" },
	"ICD3S Monthly Payroll": { name: "GeniusSalary" },
	"ICD3S Late Penalty": { name: "GeniusMyHistory" },
	"ICD3S Attendance Correction": { name: "MyRequestsList" },
	"ICD3S Meal Claim": { name: "MyMealRequests" },
	"ICD3S Work Request": { name: "MyRequestsList" },
	"ICD3S Shift Swap": { name: "MyRequestsList" },
	"ICD3S Device Binding": { name: "GeniusSettings" },
	"ICD3S Monthly Attendance Summary": { name: "GeniusMyHistory" },
	"ICD3S Attendance Log": { name: "Home" },
	"ICD3S Employee Permission": { name: "MyRequestsList" },
}

const docDetail = ref(null)

function openNotification(item) {
	notifications.setValue.submit({ name: item.name, read: 1 }, {
		onSuccess: () => unreadNotificationsCount.reload(),
	})

	if (!item.reference_document_type || !item.reference_document_name) return
	const dt = item.reference_document_type
	const dn = item.reference_document_name

	// 1. DocTypes with their own detail view (:id param)
	if (DETAIL_VIEW_ROUTES[dt]) {
		router.push({ name: DETAIL_VIEW_ROUTES[dt], params: { id: dn } })
		return
	}

	// 2. DocTypes routed to best matching page
	const pageRoute = PAGE_ROUTES[dt]
	if (pageRoute) {
		if (pageRoute.useNameParam) {
			router.push({ name: pageRoute.name, params: { name: dn } })
		} else {
			router.push({ name: pageRoute.name })
		}
		return
	}

	// 3. Fallback: show detail in bottom sheet (only for truly unknown types)
	docDetail.value = {
		type: dt,
		docName: dn,
		message: parseNotifSummary(item),
		time: dayjs(item.creation).format("DD-MM-YYYY h:mm A"),
		status: getDocStatus(item),
	}
}

function goToMyRequests() {
	docDetail.value = null
	router.push({ name: "MyRequestsList" })
}

// ==================== PARSING ====================

function stripHtml(html) {
	if (!html) return ""
	return html.replace(/<br\s*\/?>/gi, " ").replace(/<\/(?:p|div|li)>/gi, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function parseNotifName(item) {
	if (!item) return ""
	const plain = stripHtml(item.message || "")
	const m1 = plain.match(/^New\s+\w+\s+Request\s+(.+?)\s+(submitted|raised|requested)/i)
	if (m1) return m1[1].trim()
	const m2 = plain.match(/^(.+?)\s+(raised|submitted|requested|created|approved|rejected|cancelled)/i)
	if (m2 && !/^New\s/i.test(m2[1])) return m2[1].trim()
	if (/^Your\s/i.test(plain)) return "You"
	if (item.from_user && item.from_user !== "Administrator") {
		return item.from_user.split("@")[0].split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
	}
	return plain.substring(0, 30)
}

function parseNotifSummary(item) {
	if (!item) return ""
	const plain = stripHtml(item.message || "")
	const dt = item.reference_document_type || ""
	const label = TYPE_LABELS[dt] || dt.replace("ICD3S ", "")
	if (/\bapproved\b/i.test(plain)) return `${label} was approved`
	if (/\brejected\b/i.test(plain)) return `${label} was rejected`
	if (/\bcancelled\b/i.test(plain)) return `${label} was cancelled`
	if (/raised a new|submitted a/i.test(plain)) return `New ${label} for approval`
	if (/^Your /i.test(plain)) {
		if (/approved/i.test(plain)) return `Your ${label} was approved`
		if (/rejected/i.test(plain)) return `Your ${label} was rejected`
		return `Update on your ${label}`
	}
	return label
}

// ==================== STATUS ====================

function statusClass(status) {
	if (!status) return "bg-gray-100 text-gray-600"
	const s = String(status).toLowerCase()
	if (s === "approved" || s === "completed" || s === "1") return "bg-green-100 text-green-700 dark:bg-green-800/25 dark:text-green-300"
	if (s === "rejected") return "bg-red-100 text-red-700 dark:bg-red-800/25 dark:text-red-300"
	if (s === "cancelled" || s === "0") return "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"
	if (s.includes("ceo") || s.includes("final")) return "bg-amber-100 text-amber-700 dark:bg-amber-800/25 dark:text-amber-300"
	if (s.includes("hr") || s.includes("manager")) return "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300"
	if (s === "open" || s === "draft" || s === "submitted") return "bg-blue-100 text-blue-700 dark:bg-blue-800/25 dark:text-blue-300"
	if (s.includes("pending")) return "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300"
	return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
}

// ==================== MOUNT ====================

onMounted(() => {
	notifications.start = 0
	notifications.pageLength = 20
	notifications.fetch()
})
</script>

<style scoped>
.pb-safe-bottom {
	padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
}
@keyframes slide-up {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.animate-slide-up {
	animation: slide-up 0.25s ease-out;
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
