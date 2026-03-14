<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">

				<!-- Glass Header -->
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<div class="ml-2 flex-1 min-w-0">
						<div class="text-sm font-bold text-gray-900 truncate">{{ doc?.name || route.params.id }}</div>
						<span v-if="doc" class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(doc.status)">{{ doc.status }}</span>
					</div>
				</header>

				<!-- Loading -->
				<div v-if="loading" class="flex items-center justify-center py-20">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<div v-else-if="doc" class="flex flex-col p-4 gap-3 mb-6">

					<!-- Employee Info Card -->
					<div class="card-premium p-4">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-full gradient-icd flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
								{{ (doc.employee_name || '?')[0] }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-base font-bold text-gray-900 truncate">{{ doc.employee_name }}</div>
								<div class="text-xs text-gray-700">
									{{ doc.department }}{{ doc.designation ? ' · ' + doc.designation : '' }}
								</div>
								<div class="text-[11px] text-gray-600 mt-0.5">
									{{ doc.name }} · {{ formatDate(doc.incident_date) }}
									<span v-if="doc.incident_date" class="text-gray-700 ml-1">{{ timeAgo(doc.incident_date) }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Violation Info -->
					<div class="card-premium p-4" :class="severityBorderClass(doc.severity)">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-2">{{ __("Violation") }}</div>
						<div class="flex items-start justify-between">
							<div>
								<div class="text-base font-bold text-gray-900">{{ doc.action_type }}</div>
								<div class="text-xs text-gray-700 mt-1">{{ formatDate(doc.incident_date) }}</div>
							</div>
							<div class="text-right">
								<div class="text-xs font-bold px-2 py-0.5 rounded-full" :class="severityClass(doc.severity)">
									{{ doc.severity }}
								</div>
								<div v-if="doc.progressive_level" class="text-[11px] text-gray-700 mt-1">{{ doc.progressive_level }}</div>
							</div>
						</div>
						<p v-if="doc.description" class="text-sm text-gray-600 mt-3 leading-relaxed">{{ doc.description }}</p>
						<p v-if="doc.policy_violated" class="text-xs text-gray-700 mt-2 italic">{{ __("Policy") }}: {{ doc.policy_violated }}</p>
					</div>

					<!-- Penalty -->
					<div v-if="doc.penalty_type" class="card-premium p-4 border-l-4 border-l-red-500">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-2">{{ __("Penalty") }}</div>
						<div class="flex items-center justify-between">
							<div class="text-sm font-bold text-red-700">{{ doc.penalty_type }}</div>
							<div v-if="doc.deduction_days > 0" class="text-right">
								<div class="text-2xl font-black text-red-600">{{ doc.deduction_days }}<span class="text-sm">d</span></div>
								<div v-if="doc.deduction_amount > 0" class="text-[11px] text-gray-700">{{ doc.deduction_amount }} EGP</div>
							</div>
						</div>
						<div v-if="doc.penalty_details" class="text-xs text-gray-600 mt-2">{{ doc.penalty_details }}</div>
						<div v-if="doc.penalty_start_date" class="flex gap-4 mt-2 text-xs text-gray-700">
							<span>{{ __("From") }}: {{ doc.penalty_start_date }}</span>
							<span v-if="doc.penalty_end_date">{{ __("To") }}: {{ doc.penalty_end_date }}</span>
						</div>
					</div>

					<!-- Investigation -->
					<div v-if="doc.investigation_required" class="card-premium p-4 border-l-4 border-l-blue-400">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-2">{{ __("Investigation") }}</div>
						<div class="flex flex-col gap-1.5 text-xs text-gray-600">
							<div v-if="doc.investigation_deadline" class="flex justify-between">
								<span>{{ __("Deadline") }}</span>
								<span class="font-semibold">{{ formatDate(doc.investigation_deadline) }}</span>
							</div>
							<div v-if="doc.investigation_completed_date" class="flex justify-between">
								<span>{{ __("Completed") }}</span>
								<span class="font-semibold text-green-600">{{ formatDate(doc.investigation_completed_date) }}</span>
							</div>
						</div>
					</div>

					<!-- Employee Defense -->
					<div class="card-premium p-4" :class="doc.status === 'Pending Employee Defense' ? 'border-l-4 border-l-orange-400' : ''">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-2">{{ __("Employee Defense") }}</div>
						<div v-if="doc.employee_defense">
							<p class="text-sm text-gray-700 leading-relaxed">{{ doc.employee_defense }}</p>
							<div class="text-[11px] text-gray-600 mt-2">{{ __("Submitted") }}: {{ formatDate(doc.employee_defense_date) }}</div>
						</div>
						<div v-else-if="doc.status === 'Pending Employee Defense' && !doc.is_manager" class="text-center py-3">
							<p class="text-sm text-orange-600 font-semibold mb-3">{{ __("You must submit your defense") }}</p>
							<button @click="router.push({ name: 'DisciplinaryDefense', params: { id: doc.name } })"
								class="premium-submit text-xs" style="padding: 0.625rem 1.5rem; width: auto; display: inline-flex;">
								{{ __("Submit Defense") }}
							</button>
						</div>
						<div v-else-if="doc.status === 'Pending Employee Defense'" class="text-center py-2">
							<p class="text-xs text-orange-600 font-semibold">{{ __("Awaiting employee defense submission") }}</p>
						</div>
						<div v-else class="text-xs text-gray-600 italic">{{ __("Not submitted") }}</div>
					</div>

					<!-- Approval Timeline -->
					<div v-if="doc.hr_reviewed_by || doc.ceo_reviewed_by" class="card-premium p-4">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-3">{{ __("Approval History") }}</div>
						<div class="flex flex-col gap-3">
							<div v-if="doc.hr_reviewed_by" class="flex items-center gap-3 text-xs">
								<div class="w-7 h-7 rounded-full bg-icd-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="check" class="w-3.5 text-icd-600" />
								</div>
								<div class="flex-1">
									<span class="font-semibold text-gray-800">{{ __("HR Review") }}</span>
									<div class="text-[11px] text-gray-600">{{ formatDate(doc.hr_reviewed_on) }}</div>
								</div>
							</div>
							<div v-if="doc.ceo_reviewed_by" class="flex items-center gap-3 text-xs">
								<div class="w-7 h-7 rounded-full bg-icd-50 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="check" class="w-3.5 text-icd-600" />
								</div>
								<div class="flex-1">
									<span class="font-semibold text-gray-800">{{ __("CEO Review") }}</span>
									<div class="text-[11px] text-gray-600">{{ formatDate(doc.ceo_reviewed_on) }}</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Appeal Section -->
					<div v-if="doc.appeal_status || canAppeal" class="card-premium p-4" :class="canAppeal && !doc.appeal_status ? 'border-l-4 border-l-orange-400' : ''">
						<div class="text-[11px] font-bold text-gray-600 uppercase mb-2">{{ __("Appeal") }}</div>
						<div v-if="doc.appeal_status">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-bold" :class="doc.appeal_status === 'Overturned' ? 'text-green-600' : 'text-gray-700'">
									{{ doc.appeal_status }}
								</span>
								<span v-if="doc.appeal_submitted_on" class="text-[11px] text-gray-600">{{ formatDate(doc.appeal_submitted_on) }}</span>
							</div>
							<p v-if="doc.appeal_reason" class="text-xs text-gray-600">{{ doc.appeal_reason }}</p>
							<p v-if="doc.appeal_outcome" class="text-xs text-gray-600 mt-1 italic">{{ __("Outcome") }}: {{ doc.appeal_outcome }}</p>
						</div>
						<div v-else-if="canAppeal && !doc.is_manager" class="text-center py-2">
							<div v-if="appealCountdown" class="text-xs font-semibold mb-2" :class="appealCountdown.urgent ? 'text-red-600' : 'text-orange-600'">
								{{ appealCountdown.text }}
							</div>
							<p class="text-xs text-gray-700 mb-3">{{ __("Appeal deadline") }}: {{ formatDate(doc.appeal_deadline) }}</p>
							<button @click="router.push({ name: 'DisciplinaryAppeal', params: { id: doc.name } })"
								class="bg-orange-600 text-white rounded-lg px-6 py-2 text-xs font-bold active:bg-orange-700">
								{{ __("File Appeal") }}
							</button>
						</div>
						<div v-else-if="canAppeal && doc.is_manager" class="py-1">
							<div v-if="appealCountdown" class="text-xs font-semibold" :class="appealCountdown.urgent ? 'text-red-600' : 'text-orange-600'">
								{{ appealCountdown.text }}
							</div>
							<p class="text-xs text-gray-700 mt-1">{{ __("Employee can appeal until") }}: {{ formatDate(doc.appeal_deadline) }}</p>
						</div>
					</div>

					<!-- Resolution -->
					<div v-if="doc.is_resolved" class="card-premium p-4 bg-green-50 border border-green-200">
						<div class="flex items-center gap-2">
							<FeatherIcon name="check-circle" class="w-5 text-green-600" />
							<span class="text-sm font-bold text-green-700">{{ __("Resolved") }}</span>
							<span v-if="doc.resolution_date" class="text-xs text-green-600 ml-auto">{{ formatDate(doc.resolution_date) }}</span>
						</div>
					</div>

					<!-- Manager Action Buttons -->
					<div v-if="doc.is_manager" class="flex flex-col gap-2 mt-2">

						<!-- Status: Under Investigation -->
						<template v-if="doc.status === 'Under Investigation'">
							<button @click="completeInvestigation" :disabled="processing"
								class="premium-submit text-sm">
								{{ processing === 'investigate' ? __("Processing...") : __("Complete Investigation") }}
							</button>
							<div class="flex gap-2">
								<button @click="editAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5" /> {{ __("Edit") }}
								</button>
								<button @click="deleteAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5" /> {{ __("Cancel") }}
								</button>
							</div>
						</template>

						<!-- Status: Pending Employee Defense -->
						<template v-else-if="doc.status === 'Pending Employee Defense'">
							<div class="flex gap-2">
								<button @click="editAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5" /> {{ __("Edit") }}
								</button>
								<button @click="deleteAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5" /> {{ __("Cancel") }}
								</button>
							</div>
						</template>

						<!-- Status: Pending HR -->
						<template v-else-if="doc.status === 'Pending HR'">
							<button @click="hrApprove" :disabled="processing"
								class="premium-submit text-sm">
								{{ processing === 'approve' ? __("Processing...") : __("HR Approve") }}
							</button>
							<div class="flex gap-2">
								<button @click="hrReject" :disabled="processing"
									class="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5 text-xs font-bold active:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5">
									<FeatherIcon name="x" class="w-3.5 h-3.5" /> {{ __("Reject") }}
								</button>
								<button @click="editAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5" /> {{ __("Edit") }}
								</button>
								<button @click="deleteAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="trash-2" class="w-3.5 h-3.5" /> {{ __("Cancel") }}
								</button>
							</div>
						</template>

						<!-- Status: Pending CEO -->
						<template v-else-if="doc.status === 'Pending CEO'">
							<button @click="ceoApprove" :disabled="processing"
								class="premium-submit text-sm">
								{{ processing === 'approve' ? __("Processing...") : __("CEO Approve") }}
							</button>
							<div class="flex gap-2">
								<button @click="ceoReject" :disabled="processing"
									class="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5 text-xs font-bold active:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5">
									<FeatherIcon name="x" class="w-3.5 h-3.5" /> {{ __("Reject") }}
								</button>
								<button @click="editAction" class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
									<FeatherIcon name="edit-2" class="w-3.5 h-3.5" /> {{ __("Edit") }}
								</button>
							</div>
						</template>

						<!-- Status: Appealed -->
						<template v-else-if="doc.status === 'Appealed'">
							<div class="flex gap-2">
								<button @click="reviewAppeal('Upheld')" :disabled="processing"
									class="flex-1 bg-gray-600 text-white rounded-lg py-2.5 text-xs font-bold disabled:opacity-50">
									{{ __("Uphold") }}
								</button>
								<button @click="reviewAppeal('Overturned')" :disabled="processing"
									class="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-xs font-bold disabled:opacity-50">
									{{ __("Overturn") }}
								</button>
								<button @click="reviewAppeal('Modified')" :disabled="processing"
									class="flex-1 bg-orange-600 text-white rounded-lg py-2.5 text-xs font-bold disabled:opacity-50">
									{{ __("Modify") }}
								</button>
							</div>
						</template>

						<!-- Other statuses: just cancel if possible -->
						<template v-else-if="!['Closed', 'Cancelled', 'Rejected'].includes(doc.status)">
							<button @click="deleteAction"
								class="bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200 flex items-center justify-center gap-1.5">
								<FeatherIcon name="trash-2" class="w-3.5 h-3.5" /> {{ __("Cancel Action") }}
							</button>
						</template>
					</div>

					<!-- Employee Action Buttons (non-manager) -->
					<div v-else class="flex flex-col gap-2 mt-2">
						<button v-if="doc.status === 'Pending Employee Defense'"
							@click="router.push({ name: 'DisciplinaryDefense', params: { id: doc.name } })"
							class="premium-submit text-sm">
							{{ __("Submit Defense") }}
						</button>
						<button v-if="canAppeal && !doc.appeal_status"
							@click="router.push({ name: 'DisciplinaryAppeal', params: { id: doc.name } })"
							class="bg-orange-600 text-white rounded-lg py-3 text-sm font-bold active:bg-orange-700 flex items-center justify-center">
							{{ __("File Appeal") }}
						</button>
					</div>

					<div class="h-4"></div>
				</div>
			</div>

			<!-- Toast -->
			<div v-if="toast" class="fixed bottom-6 left-4 right-4 text-white rounded-xl p-4 text-center text-sm font-bold z-50 shadow-lg"
				:class="toastIsError ? 'bg-red-600' : 'bg-green-600'">
				{{ toast }}
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue"
import { useRouter, useRoute } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call } from "frappe-ui"
import dayjs from "@/utils/dayjs"

const __ = inject("$translate")
const router = useRouter()
const route = useRoute()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const loading = ref(true)
const doc = ref(null)
const processing = ref(false)
const toast = ref("")
const toastIsError = ref(false)

const canAppeal = computed(() => {
	if (!doc.value) return false
	return doc.value.status === "Approved" &&
		!doc.value.appeal_status &&
		doc.value.appeal_deadline &&
		dayjs(doc.value.appeal_deadline).isAfter(dayjs())
})

const appealCountdown = computed(() => {
	if (!doc.value?.appeal_deadline) return null
	const deadline = dayjs(doc.value.appeal_deadline)
	if (deadline.isBefore(dayjs())) return null
	const days = deadline.diff(dayjs(), "day")
	const hours = deadline.diff(dayjs(), "hour")
	if (days <= 0) {
		return { text: __("{0} hours remaining to appeal", [hours]), urgent: true }
	}
	return { text: __("{0} days remaining to appeal", [days]), urgent: days <= 1 }
})

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

function severityClass(severity) {
	const map = {
		"Minor": "bg-yellow-100 text-yellow-700",
		"Moderate": "bg-orange-100 text-orange-700",
		"Major": "bg-red-100 text-red-700",
		"Critical": "bg-red-200 text-red-800",
	}
	return map[severity] || "bg-gray-100 text-gray-600"
}

function severityBorderClass(severity) {
	const map = {
		"Minor": "border-l-4 border-l-yellow-400",
		"Moderate": "border-l-4 border-l-orange-400",
		"Major": "border-l-4 border-l-red-500",
		"Critical": "border-l-4 border-l-red-700",
	}
	return map[severity] || ""
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function timeAgo(date) {
	if (!date) return ""
	return dayjs(date).fromNow()
}

function showToast(msg) {
	toastIsError.value = false
	toast.value = msg
	setTimeout(() => { toast.value = "" }, 2500)
}
function showError(e) {
	let msg = __("Action failed. Please try again.")
	try {
		if (e?.messages) msg = JSON.parse(e.messages)?.[0] || msg
		else if (e?.message) msg = e.message
	} catch (_) { /* use default */ }
	toastIsError.value = true
	toast.value = msg
	setTimeout(() => { toast.value = "" }, 4000)
}

function editAction() {
	router.push({ name: "ManagerDisciplinaryEdit", params: { id: doc.value.name } })
}

async function deleteAction() {
	if (!confirm(__("Cancel disciplinary action {0}? This cannot be undone.", [doc.value.name]))) return
	processing.value = "delete"
	try {
		await call(`${API_BASE}.cancel_disciplinary_action`, { action_name: doc.value.name })
		showToast(__("Action cancelled"))
		setTimeout(() => router.back(), 1500)
	} catch (e) {
		showError(e)
	}
	processing.value = false
}

async function completeInvestigation() {
	processing.value = "investigate"
	try {
		await call(`${API_BASE}.complete_investigation`, { action_name: doc.value.name })
		showToast(__("Investigation completed"))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function hrApprove() {
	processing.value = "approve"
	try {
		await call(`${API_BASE}.hr_approve_action`, { action_name: doc.value.name })
		showToast(__("Approved by HR"))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function hrReject() {
	processing.value = "reject"
	try {
		await call(`${API_BASE}.hr_reject_action`, { action_name: doc.value.name })
		showToast(__("Rejected by HR"))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function ceoApprove() {
	processing.value = "approve"
	try {
		await call(`${API_BASE}.ceo_approve_action`, { action_name: doc.value.name })
		showToast(__("Approved by CEO"))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function ceoReject() {
	processing.value = "reject"
	try {
		await call(`${API_BASE}.ceo_reject_action`, { action_name: doc.value.name })
		showToast(__("Rejected by CEO"))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function reviewAppeal(outcome) {
	processing.value = "appeal"
	try {
		await call(`${API_BASE}.review_appeal`, { action_name: doc.value.name, outcome })
		showToast(__("Appeal {0}", [outcome]))
		await loadDetail()
	} catch (e) { showError(e) }
	processing.value = false
}

async function loadDetail() {
	loading.value = true
	try {
		const res = await call(`${API_BASE}.get_disciplinary_detail`, {
			action_name: route.params.id,
		})
		doc.value = res || null
	} catch (e) {
		showError(e)
	} finally {
		loading.value = false
	}
}

onMounted(loadDetail)
</script>
