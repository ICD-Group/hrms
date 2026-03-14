<template>
	<ion-page>
		<!-- Ambient gradient background -->
		<div class="app-bg-ambient"></div>

		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Late Excuses") }}</h2>
					<span v-if="excuses.length > 0" class="ml-auto text-xs text-white bg-red-500 px-2 py-0.5 rounded-full font-bold">
						{{ excuses.length }}
					</span>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Summary Stats -->
					<div v-if="!loading && excuses.length > 0" class="grid grid-cols-3 gap-2">
						<div class="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
							<div class="text-xl font-bold text-orange-700">{{ excuses.length }}</div>
							<div class="text-[11px] text-orange-600 font-medium">{{ __("Pending") }}</div>
						</div>
						<div class="bg-green-50 rounded-xl p-3 text-center border border-green-100">
							<div class="text-xl font-bold text-green-700">{{ approvedCount }}</div>
							<div class="text-[11px] text-green-600 font-medium">{{ __("Approved") }}</div>
						</div>
						<div class="bg-red-50 rounded-xl p-3 text-center border border-red-100">
							<div class="text-xl font-bold text-red-700">{{ rejectedCount }}</div>
							<div class="text-[11px] text-red-600 font-medium">{{ __("Rejected") }}</div>
						</div>
					</div>

					<!-- Loading -->
					<div v-if="loading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Empty State -->
					<div v-else-if="excuses.length === 0" class="text-center py-16">
						<div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
							<FeatherIcon name="check-circle" class="w-8 h-8 text-green-500" />
						</div>
						<div class="text-sm font-semibold text-gray-700">{{ __("All Clear!") }}</div>
						<div class="text-xs text-gray-700 mt-1">{{ __("No pending late excuses to review") }}</div>
					</div>

					<!-- Excuse Cards -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="excuse in excuses"
							:key="excuse.name"
							class="card-premium p-4"
						>
							<!-- Header: Employee + Penalty Level -->
							<div class="flex items-start justify-between mb-2">
								<div>
									<div class="text-sm font-semibold text-gray-900">{{ excuse.employee_name }}</div>
									<div class="text-xs text-gray-700">{{ excuse.department }}</div>
								</div>
								<span
									class="text-[11px] font-bold px-2 py-0.5 rounded-full"
									:class="getLevelColor(excuse.penalty_level)"
								>
									{{ excuse.penalty_level }}
								</span>
							</div>

							<!-- Penalty Details -->
							<div class="flex items-center gap-3 text-xs text-gray-700 mb-2">
								<span class="flex items-center gap-1">
									<FeatherIcon name="calendar" class="w-3" />
									{{ formatDate(excuse.attendance_date) }}
								</span>
								<span class="flex items-center gap-1">
									<FeatherIcon name="clock" class="w-3" />
									{{ excuse.penalty_type }}
								</span>
							</div>

							<!-- Late/Early Details -->
							<div class="flex gap-2 mb-2">
								<span v-if="excuse.late_minutes" class="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg border border-orange-100">
									{{ excuse.late_minutes }} {{ __("min late") }}
								</span>
								<span v-if="excuse.early_minutes" class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
									{{ excuse.early_minutes }} {{ __("min early") }}
								</span>
								<span class="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-lg border border-red-100">
									{{ excuse.deduction_days }}d {{ __("deduction") }}
								</span>
							</div>

							<!-- Shift vs Actual Times -->
							<div v-if="excuse.shift_start_time || excuse.actual_check_in" class="bg-gray-100 rounded-lg p-2 mb-2 text-xs text-gray-600">
								<div class="flex justify-between">
									<span>{{ __("Shift") }}: {{ formatTime(excuse.shift_start_time) }} - {{ formatTime(excuse.shift_end_time) }}</span>
								</div>
								<div class="flex justify-between mt-0.5">
									<span>{{ __("Actual") }}: {{ formatDatetime(excuse.actual_check_in) }} - {{ formatDatetime(excuse.actual_check_out) }}</span>
								</div>
							</div>

							<!-- Excuse Reason -->
							<div class="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
								<div class="text-[11px] font-bold text-blue-600 uppercase mb-1">{{ __("Employee's Reason") }}</div>
								<div class="text-xs text-gray-700">{{ excuse.excuse_reason }}</div>
								<div v-if="excuse.excuse_attachment" class="mt-2">
									<a :href="excuse.excuse_attachment" target="_blank" class="text-xs text-icd-600 font-medium flex items-center gap-1">
										<FeatherIcon name="paperclip" class="w-3" />
										{{ __("View Attachment") }}
									</a>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex gap-2">
								<button
									@click="approveExcuse(excuse)"
									:disabled="excuse._processing"
									class="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-xs font-bold active:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
								>
									<FeatherIcon v-if="excuse._processing !== 'approve'" name="check" class="w-3.5" />
									{{ excuse._processing === 'approve' ? __("Approving...") : __("Approve & Waive") }}
								</button>
								<button
									@click="showRejectDialog(excuse)"
									:disabled="excuse._processing"
									class="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5 text-xs font-bold active:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1"
								>
									<FeatherIcon v-if="excuse._processing !== 'reject'" name="x" class="w-3.5" />
									{{ excuse._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Reject Reason Modal -->
			<div v-if="rejectModal.show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
				<div class="absolute inset-0 bg-black/50" @click="rejectModal.show = false"></div>
				<div class="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 z-10">
					<div class="text-sm font-bold text-gray-900 mb-1">{{ __("Reject Excuse") }}</div>
					<div class="text-xs text-gray-700 mb-4">
						{{ __("Rejecting excuse for") }} {{ rejectModal.excuse?.employee_name }} - {{ formatDate(rejectModal.excuse?.attendance_date) }}
					</div>
					<textarea
						v-model="rejectModal.reason"
						:placeholder="__('Reason for rejection (optional)')"
						class="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-icd-500 focus:border-transparent"
						rows="3"
					></textarea>
					<div class="flex gap-2 mt-4">
						<button
							@click="rejectModal.show = false"
							class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200"
						>
							{{ __("Cancel") }}
						</button>
						<button
							@click="confirmReject"
							:disabled="rejectModal.processing"
							class="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-xs font-bold active:bg-red-700 disabled:opacity-50"
						>
							{{ rejectModal.processing ? __("Rejecting...") : __("Confirm Reject") }}
						</button>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getCount } = useManagerApi()

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const excuses = ref([])
const loading = ref(true)
const approvedCount = ref(0)
const rejectedCount = ref(0)

const rejectModal = reactive({
	show: false,
	excuse: null,
	reason: "",
	processing: false,
})

async function loadExcuses() {
	loading.value = true
	try {
		const data = await call(
			`${API_BASE}.get_pending_excuses`
		)
		excuses.value = data?.pending_excuses || []

		// Get historical counts for stats
		try {
			const approved = await getCount({
				doctype: "ICD3S Late Penalty",
				filters: { excuse_status: "Approved", docstatus: 1 },
			})
			approvedCount.value = approved || 0
		} catch (e) { /* ignore */ }

		try {
			const rejected = await getCount({
				doctype: "ICD3S Late Penalty",
				filters: { excuse_status: "Rejected", docstatus: 1 },
			})
			rejectedCount.value = rejected || 0
		} catch (e) { /* ignore */ }
	} catch (e) {
		_errToast(e, "Failed to load excuses")
		excuses.value = []
	} finally {
		loading.value = false
	}
}

watch(
	() => employee.data?.company,
	() => { loadExcuses() },
	{ immediate: true }
)

async function approveExcuse(excuse) {
	excuse._processing = "approve"
	try {
		await call(`${API_BASE}.approve_late_excuse`, {
			penalty_name: excuse.name,
		})
		loadExcuses()
	} catch (e) {
		_errToast(e, "Failed to approve excuse")
		excuse._processing = null
	}
}

function showRejectDialog(excuse) {
	rejectModal.excuse = excuse
	rejectModal.reason = ""
	rejectModal.processing = false
	rejectModal.show = true
}

async function confirmReject() {
	if (!rejectModal.excuse) return
	rejectModal.processing = true
	rejectModal.excuse._processing = "reject"
	try {
		await call(`${API_BASE}.reject_late_excuse`, {
			penalty_name: rejectModal.excuse.name,
			rejection_reason: rejectModal.reason || null,
		})
		rejectModal.show = false
		loadExcuses()
	} catch (e) {
		_errToast(e, "Failed to reject excuse")
		rejectModal.processing = false
		rejectModal.excuse._processing = null
	}
}

function getLevelColor(level) {
	const map = {
		"Warning": "bg-yellow-100 text-yellow-700",
		"Minor": "bg-orange-100 text-orange-700",
		"Major": "bg-red-100 text-red-700",
		"Accumulated": "bg-purple-100 text-purple-700",
	}
	return map[level] || "bg-gray-100 text-gray-700"
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function formatTime(time) {
	if (!time) return "--:--"
	// time can be "09:00:00" or timedelta string
	const parts = String(time).split(":")
	return parts[0] + ":" + parts[1]
}

function formatDatetime(dt) {
	if (!dt) return "--:--"
	return dayjs(dt).format("HH:mm")
}
</script>
