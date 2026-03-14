<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 ml-1">{{ __("Disciplinary") }}</h2>
					<button @click="router.push({ name: 'ManagerDisciplinaryCreate' })"
						class="ml-auto bg-icd-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:bg-icd-700">
						+ {{ __("New") }}
					</button>
				</header>

				<div class="flex flex-col p-4 gap-4">

					<!-- Dashboard Stats -->
					<div v-if="stats" class="grid grid-cols-4 gap-2">
						<div class="card-premium p-2 text-center">
							<div class="text-lg font-black text-icd-600">{{ stats.pending_hr }}</div>
							<div class="text-[11px] font-bold text-gray-700">{{ __("HR") }}</div>
						</div>
						<div class="card-premium p-2 text-center">
							<div class="text-lg font-black text-icd-600">{{ stats.pending_ceo }}</div>
							<div class="text-[11px] font-bold text-gray-700">{{ __("CEO") }}</div>
						</div>
						<div class="card-premium p-2 text-center">
							<div class="text-lg font-black text-icd-600">{{ stats.under_investigation }}</div>
							<div class="text-[11px] font-bold text-gray-700">{{ __("Invest.") }}</div>
						</div>
						<div class="card-premium p-2 text-center">
							<div class="text-lg font-black text-icd-600">{{ stats.active_appeals }}</div>
							<div class="text-[11px] font-bold text-gray-700">{{ __("Appeals") }}</div>
						</div>
					</div>

					<!-- Filter Tabs -->
					<div class="flex gap-2 overflow-x-auto pb-1">
						<button v-for="tab in tabs" :key="tab.value"
							@click="activeTab = tab.value; loadActions()"
							class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
							:class="activeTab === tab.value
								? 'bg-icd-600 text-white'
								: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
						>{{ tab.label }}</button>
					</div>

					<!-- Loading -->
					<div v-if="loading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Empty -->
					<div v-else-if="actions.length === 0" class="text-center py-10">
						<FeatherIcon name="shield" class="w-12 h-12 text-gray-700 mx-auto mb-3" />
						<div class="text-sm text-gray-700">{{ __("No disciplinary actions found") }}</div>
						<button @click="router.push({ name: 'ManagerDisciplinaryCreate' })"
							class="mt-4 premium-submit inline-flex" style="width:auto; padding: 0.625rem 1.25rem;">
							+ {{ __("Create First Action") }}
						</button>
					</div>

					<!-- Actions List -->
					<div v-else class="flex flex-col gap-2">
						<div v-for="(action, idx) in actions" :key="action.name"
							class="card-premium p-4 active:bg-gray-100 cursor-pointer animate-slide-up"
							:style="{ animationDelay: `${idx * 0.04}s` }"
							@click="router.push({ name: 'ManagerDisciplinaryDetail', params: { id: action.name } })"
						>
							<!-- Top: Avatar + Info + Badges -->
							<div class="flex items-start gap-3 mb-2.5">
								<div class="w-10 h-10 rounded-full gradient-icd flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
									{{ (action.employee_name || '?')[0] }}
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 truncate">{{ action.employee_name }}</div>
									<div class="text-[11px] text-gray-700 truncate">
										{{ action.department }}{{ action.designation ? ' · ' + action.designation : '' }}
									</div>
									<div class="text-[11px] text-gray-600 mt-0.5">{{ action.name }}</div>
								</div>
								<div class="flex flex-col items-end gap-1 flex-shrink-0">
									<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="severityClass(action.severity)">
										{{ action.severity }}
									</span>
									<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(action.status)">
										{{ shortStatus(action.status) }}
									</span>
								</div>
							</div>

							<!-- Meta row -->
							<div class="flex items-center gap-3 text-[11px] text-gray-700 mb-3">
								<span class="flex items-center gap-1">
									<FeatherIcon name="calendar" class="w-3" />
									{{ formatDate(action.incident_date) }}
								</span>
								<span v-if="action.incident_date" class="text-gray-600">{{ timeAgo(action.incident_date) }}</span>
								<span v-if="action.progressive_level" class="font-semibold text-gray-600">{{ action.progressive_level }}</span>
							</div>

							<!-- Action Buttons based on status -->
							<div v-if="action.status === 'Pending HR'" class="flex gap-2 items-center">
								<button @click.stop="hrApprove(action)" :disabled="action._processing"
									class="flex-1 premium-submit text-xs" style="padding: 0.5rem; font-size: 0.75rem;">
									{{ action._processing === 'approve' ? __("...") : __("HR Approve") }}
								</button>
								<button @click.stop="hrReject(action)" :disabled="action._processing"
									class="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2 text-xs font-bold active:bg-red-100 disabled:opacity-50">
									{{ action._processing === 'reject' ? __("...") : __("Reject") }}
								</button>
								<button @click.stop="editAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
								<button @click.stop="deleteAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
							</div>

							<div v-else-if="action.status === 'Pending CEO'" class="flex gap-2 items-center">
								<button @click.stop="ceoApprove(action)" :disabled="action._processing"
									class="flex-1 premium-submit text-xs" style="padding: 0.5rem; font-size: 0.75rem;">
									{{ action._processing === 'approve' ? __("...") : __("CEO Approve") }}
								</button>
								<button @click.stop="ceoReject(action)" :disabled="action._processing"
									class="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2 text-xs font-bold active:bg-red-100 disabled:opacity-50">
									{{ action._processing === 'reject' ? __("...") : __("Reject") }}
								</button>
								<button @click.stop="editAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
							</div>

							<div v-else-if="action.status === 'Under Investigation'" class="flex gap-2 items-center">
								<button @click.stop="completeInv(action)" :disabled="action._processing"
									class="flex-1 premium-submit text-xs" style="padding: 0.5rem; font-size: 0.75rem;">
									{{ __("Complete Investigation") }}
								</button>
								<button @click.stop="editAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
								<button @click.stop="deleteAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
							</div>

							<div v-else-if="action.status === 'Pending Employee Defense'" class="flex gap-2 items-center">
								<div class="flex-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg py-2 text-xs font-bold text-center">
									{{ __("Awaiting Defense") }}
								</div>
								<button @click.stop="editAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
								<button @click.stop="deleteAction(action)" class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 flex-shrink-0">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5 text-gray-600" />
								</button>
							</div>

							<div v-else-if="action.status === 'Appealed'" class="flex gap-2 items-center">
								<button @click.stop="reviewAppealAction(action, 'Upheld')" :disabled="action._processing"
									class="flex-1 bg-gray-600 text-white rounded-lg py-2 text-xs font-bold disabled:opacity-50">
									{{ __("Uphold") }}
								</button>
								<button @click.stop="reviewAppealAction(action, 'Overturned')" :disabled="action._processing"
									class="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-bold disabled:opacity-50">
									{{ __("Overturn") }}
								</button>
								<button @click.stop="reviewAppealAction(action, 'Modified')" :disabled="action._processing"
									class="flex-1 bg-orange-600 text-white rounded-lg py-2 text-xs font-bold disabled:opacity-50">
									{{ __("Modify") }}
								</button>
							</div>

							<div v-else class="flex items-center gap-2 mt-1">
								<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(action.status)">
									{{ action.status }}
								</span>
								<div v-if="canDelete(action)" class="ml-auto">
									<button @click.stop="deleteAction(action)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200">
										<FeatherIcon name="trash-2" class="w-3 h-3 text-gray-600" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, inject, onMounted, onActivated, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import dayjs from "@/utils/dayjs"

const __ = inject("$translate")
const employee = inject("$employee")
const router = useRouter()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const loading = ref(true)
const actions = ref([])
const stats = ref(null)
const activeTab = ref("pending")

const tabs = [
	{ value: "pending", label: "Pending" },
	{ value: "all", label: "All" },
	{ value: "approved", label: "Approved" },
	{ value: "closed", label: "Closed" },
]

function severityClass(severity) {
	const map = {
		"Minor": "bg-yellow-100 text-yellow-700",
		"Moderate": "bg-orange-100 text-orange-700",
		"Major": "bg-red-100 text-red-700",
		"Critical": "bg-red-200 text-red-800",
	}
	return map[severity] || "bg-gray-100 text-gray-600"
}

function statusClass(status) {
	const map = {
		"Draft": "bg-gray-100 text-gray-700",
		"Under Investigation": "bg-blue-100 text-blue-700",
		"Pending Employee Defense": "bg-orange-100 text-orange-700",
		"Pending HR": "bg-icd-50 text-icd-600",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Appealed": "bg-indigo-100 text-indigo-700",
		"Closed": "bg-gray-100 text-gray-600",
		"Cancelled": "bg-gray-100 text-gray-600",
	}
	return map[status] || "bg-gray-100 text-gray-600"
}

function shortStatus(status) {
	const map = {
		"Pending Employee Defense": "Defense",
		"Under Investigation": "Investigating",
		"Pending HR": "HR Review",
		"Pending CEO": "CEO Review",
	}
	return map[status] || status
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function timeAgo(date) {
	if (!date) return ""
	return dayjs(date).fromNow()
}

function canDelete(action) {
	return !["Closed", "Cancelled"].includes(action.status)
}

function editAction(action) {
	router.push({ name: "ManagerDisciplinaryEdit", params: { id: action.name } })
}

async function deleteAction(action) {
	if (!confirm(__("Cancel disciplinary action {0}? This cannot be undone.", [action.name]))) return
	action._processing = "delete"
	try {
		await call(`${API_BASE}.cancel_disciplinary_action`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) {
		_errToast(e, "Failed to cancel action")
	}
	action._processing = false
}

async function loadActions() {
	loading.value = true
	try {
		const statusFilter = activeTab.value === "pending" ? null : (
			activeTab.value === "approved" ? "Approved" :
			activeTab.value === "closed" ? "Closed" : null
		)
		const fn = activeTab.value === "pending"
			? `${API_BASE}.get_pending_disciplinary_actions`
			: `${API_BASE}.get_all_disciplinary_actions`

		const params = activeTab.value === "pending" ? {} : { limit: 50 }
		if (statusFilter) params.status = statusFilter

		const res = await call(fn, params)
		actions.value = (res?.pending_actions || res?.actions || []).map(a => ({ ...a, _processing: false }))
	} catch (e) {
		_errToast(e, "Failed to load actions")
		actions.value = []
	} finally {
		loading.value = false
	}
}

async function loadStats() {
	try {
		const res = await call(`${API_BASE}.get_disciplinary_dashboard`)
		stats.value = res || null
	} catch (e) { /* stats are non-critical */ }
}

async function hrApprove(action) {
	action._processing = "approve"
	try {
		await call(`${API_BASE}.hr_approve_action`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to approve") }
	action._processing = false
}

async function hrReject(action) {
	action._processing = "reject"
	try {
		await call(`${API_BASE}.hr_reject_action`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to reject") }
	action._processing = false
}

async function ceoApprove(action) {
	action._processing = "approve"
	try {
		await call(`${API_BASE}.ceo_approve_action`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to approve") }
	action._processing = false
}

async function ceoReject(action) {
	action._processing = "reject"
	try {
		await call(`${API_BASE}.ceo_reject_action`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to reject") }
	action._processing = false
}

async function completeInv(action) {
	action._processing = "approve"
	try {
		await call(`${API_BASE}.complete_investigation`, { action_name: action.name })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to complete investigation") }
	action._processing = false
}

async function reviewAppealAction(action, outcome) {
	action._processing = "approve"
	try {
		await call(`${API_BASE}.review_appeal`, { action_name: action.name, outcome })
		await loadActions()
		await loadStats()
	} catch (e) { _errToast(e, "Failed to review appeal") }
	action._processing = false
}

function loadAll() {
	loadActions()
	loadStats()
}

onMounted(() => loadAll())
onActivated(() => loadAll())
watch(() => employee.data?.company, (c) => { if (c) loadAll() })
</script>
