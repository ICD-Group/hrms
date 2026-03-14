<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Attendance Correction") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Tab: New Request vs My Requests -->
				<div class="flex gap-2">
					<button @click="activeView = 'new'"
						class="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
						:class="activeView === 'new'
							? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
							: 'bg-gray-200 text-gray-800'">
						<FeatherIcon name="plus-circle" class="w-4 h-4 inline mr-1" />
						{{ __("New Request") }}
					</button>
					<button @click="activeView = 'history'; loadHistory()"
						class="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
						:class="activeView === 'history'
							? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
							: 'bg-gray-200 text-gray-800'">
						<FeatherIcon name="list" class="w-4 h-4 inline mr-1" />
						{{ __("My Requests") }}
					</button>
				</div>

				<!-- ======================== -->
				<!-- NEW REQUEST FORM -->
				<!-- ======================== -->
				<template v-if="activeView === 'new'">

					<!-- Correction Date -->
					<section>
						<div class="section-title mb-3">{{ __("Correction Date") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0 overflow-hidden">
							<div class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Select Date") }}</label>
								<input type="date" v-model="form.correction_date"
									:max="today" :min="minDate"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
						</div>
						<div v-if="form.correction_date && dateWarning" class="mt-2 text-xs text-orange-600 font-medium">
							<FeatherIcon name="alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
							{{ dateWarning }}
						</div>
					</section>

					<!-- Original Data Card (auto-fetched) -->
					<section v-if="form.correction_date">
						<div class="section-title mb-3">{{ __("Original Record") }}</div>
						<div v-if="loadingOriginal" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
							<div class="text-sm text-gray-600">{{ __("Loading...") }}</div>
						</div>
						<div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
							<div class="grid grid-cols-2 gap-3">
								<div>
									<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Status") }}</div>
									<div class="text-sm font-bold mt-0.5" :class="statusColor(originalData.status)">
										{{ originalData.status || __("No Record") }}
									</div>
								</div>
								<div>
									<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Working Hours") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-0.5">
										{{ originalData.working_hours ? originalData.working_hours.toFixed(1) + 'h' : '--' }}
									</div>
								</div>
								<div>
									<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Check-in") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-0.5">
										{{ originalData.check_in ? formatTime(originalData.check_in) : '--:--' }}
									</div>
								</div>
								<div>
									<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Check-out") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-0.5">
										{{ originalData.check_out ? formatTime(originalData.check_out) : '--:--' }}
									</div>
								</div>
							</div>
							<div v-if="originalData.auto_checkout" class="mt-3 text-xs text-orange-600 font-medium bg-orange-50 rounded-lg px-3 py-2">
								<FeatherIcon name="alert-circle" class="w-3.5 h-3.5 inline mr-1" />
								{{ __("Auto-checkout at 23:59 (forgot to check out)") }}
							</div>
						</div>
					</section>

					<!-- Correction Type -->
					<section>
						<div class="section-title mb-3">{{ __("Correction Type") }}</div>
						<div class="grid grid-cols-2 gap-3">
							<button
								v-for="opt in correctionTypes" :key="opt.value"
								@click="form.correction_type = opt.value"
								class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center transition-all"
								:class="form.correction_type === opt.value
									? 'ring-2 ring-green-500 bg-green-50/50'
									: 'hover:bg-gray-50'"
							>
								<FeatherIcon :name="opt.icon" class="w-6 h-6 mx-auto mb-1.5"
									:class="form.correction_type === opt.value ? 'text-green-600' : 'text-gray-600'" />
								<div class="text-xs font-bold"
									:class="form.correction_type === opt.value ? 'text-green-700' : 'text-gray-700'">
									{{ __(opt.label) }}
								</div>
							</button>
						</div>
					</section>

					<!-- Corrected Times (conditional) -->
					<section v-if="showCheckInField || showCheckOutField">
						<div class="section-title mb-3">{{ __("Corrected Time") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0 overflow-hidden divide-y divide-gray-100">
							<div v-if="showCheckInField" class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Check-in Time") }}</label>
								<input type="time" v-model="form.corrected_check_in"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
							<div v-if="showCheckOutField" class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Check-out Time") }}</label>
								<input type="time" v-model="form.corrected_check_out"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
						</div>
					</section>

					<!-- Requested Status (for Wrong Status type) -->
					<section v-if="form.correction_type === 'Wrong Status'">
						<div class="section-title mb-3">{{ __("Correct Status") }}</div>
						<div class="grid grid-cols-3 gap-2">
							<button
								v-for="st in statusOptions" :key="st.value"
								@click="form.requested_status = st.value"
								class="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-2 text-center transition-all"
								:class="form.requested_status === st.value
									? 'ring-2 ring-green-500 bg-green-50/50'
									: 'hover:bg-gray-50'"
							>
								<FeatherIcon :name="st.icon" class="w-5 h-5 mx-auto mb-1"
									:class="form.requested_status === st.value ? 'text-green-600' : 'text-gray-600'" />
								<div class="text-[11px] font-bold"
									:class="form.requested_status === st.value ? 'text-green-700' : 'text-gray-700'">
									{{ __(st.label) }}
								</div>
							</button>
						</div>
					</section>

					<!-- Reason -->
					<section>
						<div class="section-title mb-3">{{ __("Reason") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0">
							<textarea v-model="form.reason"
								:placeholder="__('Explain why you need this correction (min 10 characters)...')"
								class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
								rows="3"></textarea>
						</div>
						<div class="flex justify-between mt-1.5 px-1">
							<div class="text-[11px]" :class="form.reason.length < 10 ? 'text-gray-600' : 'text-green-600'">
								{{ form.reason.length }}/1000
							</div>
							<div v-if="form.reason.length > 0 && form.reason.length < 10" class="text-[11px] text-orange-600">
								{{ __("Min 10 characters") }}
							</div>
						</div>
					</section>

					<!-- Submit Button -->
					<button @click="submitCorrection" :disabled="submitting || !isValid"
						class="w-full bg-green-600 text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
						<FeatherIcon v-if="!submitting" name="send" class="w-4 h-4 inline mr-2" />
						<FeatherIcon v-else name="loader" class="w-4 h-4 inline mr-2 animate-spin" />
						{{ submitting ? __("Submitting...") : __("Submit Correction Request") }}
					</button>

					<!-- Success Message -->
					<div v-if="successMsg" class="bg-white rounded-2xl border border-green-200 shadow-sm p-4 text-center bg-green-50">
						<FeatherIcon name="check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
						<div class="text-sm font-bold text-green-700">{{ successMsg }}</div>
						<div class="text-xs text-gray-600 mt-1">{{ __("HR will review your request") }}</div>
					</div>

				</template>

				<!-- ======================== -->
				<!-- HISTORY LIST -->
				<!-- ======================== -->
				<template v-if="activeView === 'history'">

					<div v-if="loadingHistory" class="text-center py-8">
						<FeatherIcon name="loader" class="w-6 h-6 text-gray-600 mx-auto animate-spin" />
						<div class="text-sm text-gray-600 mt-2">{{ __("Loading...") }}</div>
					</div>

					<div v-else-if="!historyItems.length" class="text-center py-8">
						<FeatherIcon name="inbox" class="w-10 h-10 text-gray-400 mx-auto mb-2" />
						<div class="text-sm font-bold text-gray-700">{{ __("No correction requests yet") }}</div>
						<div class="text-xs text-gray-600 mt-1">{{ __("Submit your first correction above") }}</div>
					</div>

					<div v-else class="flex flex-col gap-3">
						<div v-for="item in historyItems" :key="item.name"
							class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
							<!-- Header: Date + Status Badge -->
							<div class="flex items-center justify-between mb-3">
								<div class="text-sm font-bold text-gray-900">{{ formatDate(item.correction_date) }}</div>
								<span class="px-2.5 py-1 rounded-full text-[11px] font-bold"
									:class="historyBadgeClass(item.status)">
									{{ __(item.status) }}
								</span>
							</div>
							<!-- Type + Reason -->
							<div class="flex items-center gap-2 mb-2">
								<FeatherIcon :name="typeIcon(item.correction_type)" class="w-4 h-4 text-gray-600" />
								<span class="text-xs font-bold text-gray-700">{{ __(item.correction_type) }}</span>
							</div>
							<div class="text-xs text-gray-600 line-clamp-2">{{ item.reason }}</div>
							<!-- Times (if applicable) -->
							<div v-if="item.original_check_in || item.corrected_check_in || item.original_check_out || item.corrected_check_out"
								class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
								<div v-if="item.original_check_in">
									<span class="text-gray-600">{{ __("Original In") }}:</span>
									<span class="font-bold text-gray-800 ml-1">{{ formatTime(item.original_check_in) }}</span>
								</div>
								<div v-if="item.corrected_check_in">
									<span class="text-gray-600">{{ __("Corrected In") }}:</span>
									<span class="font-bold text-green-700 ml-1">{{ formatTime(item.corrected_check_in) }}</span>
								</div>
								<div v-if="item.original_check_out">
									<span class="text-gray-600">{{ __("Original Out") }}:</span>
									<span class="font-bold text-gray-800 ml-1">{{ formatTime(item.original_check_out) }}</span>
								</div>
								<div v-if="item.corrected_check_out">
									<span class="text-gray-600">{{ __("Corrected Out") }}:</span>
									<span class="font-bold text-green-700 ml-1">{{ formatTime(item.corrected_check_out) }}</span>
								</div>
							</div>
							<!-- Rejection reason -->
							<div v-if="item.status === 'Rejected' && item.rejection_reason"
								class="mt-3 pt-3 border-t border-gray-100 text-xs text-red-600">
								<FeatherIcon name="x-circle" class="w-3.5 h-3.5 inline mr-1" />
								{{ item.rejection_reason }}
							</div>
						</div>
					</div>

				</template>

			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { FeatherIcon, call, toast } from "frappe-ui"

const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const router = useRouter()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const today = dayjs().format("YYYY-MM-DD")
const minDate = dayjs().subtract(30, "day").format("YYYY-MM-DD")

const activeView = ref("new")

// ---- Correction Types ----
const correctionTypes = [
	{ value: "Missed Check-out", label: "Missed Check-out", icon: "log-out" },
	{ value: "Missed Check-in", label: "Missed Check-in", icon: "log-in" },
	{ value: "Time Correction", label: "Time Correction", icon: "clock" },
	{ value: "Wrong Status", label: "Wrong Status", icon: "edit-3" },
	{ value: "Remove Absence", label: "Remove Absence", icon: "trash-2" },
]

const statusOptions = [
	{ value: "Present", label: "Present", icon: "check-circle" },
	{ value: "Half Day", label: "Half Day", icon: "sun" },
	{ value: "Work From Home", label: "WFH", icon: "home" },
	{ value: "On Leave", label: "On Leave", icon: "calendar" },
	{ value: "Absent", label: "Absent", icon: "x-circle" },
]

// ---- Form State ----
const form = reactive({
	correction_date: "",
	correction_type: "Missed Check-out",
	corrected_check_in: "",
	corrected_check_out: "",
	requested_status: "",
	reason: "",
})

const submitting = ref(false)
const successMsg = ref("")

// ---- Original Data ----
const originalData = reactive({
	status: null,
	working_hours: null,
	check_in: null,
	check_out: null,
	auto_checkout: false,
})
const loadingOriginal = ref(false)

// ---- History ----
const historyItems = ref([])
const loadingHistory = ref(false)

// ---- Computed ----
const showCheckInField = computed(() =>
	["Missed Check-in", "Time Correction"].includes(form.correction_type)
)
const showCheckOutField = computed(() =>
	["Missed Check-out", "Time Correction"].includes(form.correction_type)
)

const dateWarning = computed(() => {
	if (!form.correction_date) return ""
	const diff = dayjs().diff(dayjs(form.correction_date), "day")
	if (diff > 25) return __("This date is {0} days ago. Max is 30 days.", [diff])
	return ""
})

const isValid = computed(() => {
	if (!form.correction_date || !form.correction_type) return false
	if (!form.reason.trim() || form.reason.trim().length < 10) return false
	if (form.reason.length > 1000) return false

	if (form.correction_type === "Missed Check-in" && !form.corrected_check_in) return false
	if (form.correction_type === "Missed Check-out" && !form.corrected_check_out) return false
	if (form.correction_type === "Time Correction" && !form.corrected_check_in && !form.corrected_check_out) return false
	if (form.correction_type === "Wrong Status" && !form.requested_status) return false

	return true
})

// ---- Watch date → fetch original ----
let dateRequestId = 0

watch(() => form.correction_date, async (newDate) => {
	if (!newDate || !employee.data?.name) return
	const requestId = ++dateRequestId
	loadingOriginal.value = true
	originalData.status = null
	originalData.working_hours = null
	originalData.check_in = null
	originalData.check_out = null
	originalData.auto_checkout = false

	try {
		const res = await call(`${API_BASE}.get_attendance_history`, {
			employee: employee.data.name,
			from_date: newDate,
			to_date: newDate,
		})

		if (requestId !== dateRequestId) return  // Stale response, discard

		if (res?.attendance?.length) {
			const att = res.attendance[0]
			originalData.status = att.status
			originalData.working_hours = att.working_hours
		}

		if (res?.logs?.length) {
			for (const log of res.logs) {
				if (log.log_type === "Check-in") {
					originalData.check_in = log.first_time
				} else if (log.log_type === "Check-out") {
					originalData.check_out = log.last_time
				}
			}
		}

		// Check auto-checkout
		if (originalData.check_out) {
			const outTime = dayjs(originalData.check_out)
			if (outTime.hour() === 23 && outTime.minute() === 59) {
				originalData.auto_checkout = true
			}
		}
	} catch (e) {
		console.error("[Correction] Failed to load original data:", e)
		toast({ title: __("Failed to load attendance data"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		loadingOriginal.value = false
	}
})

// ---- Submit ----
async function submitCorrection() {
	if (!isValid.value || submitting.value) return
	submitting.value = true
	successMsg.value = ""

	try {
		const params = {
			employee: employee.data.name,
			correction_date: form.correction_date,
			correction_type: form.correction_type,
			reason: form.reason.trim(),
		}

		if (form.corrected_check_in && showCheckInField.value) {
			params.corrected_check_in = `${form.correction_date} ${form.corrected_check_in}:00`
		}
		if (form.corrected_check_out && showCheckOutField.value) {
			params.corrected_check_out = `${form.correction_date} ${form.corrected_check_out}:00`
		}
		if (form.correction_type === "Wrong Status" && form.requested_status) {
			params.requested_status = form.requested_status
		}

		const res = await call(`${API_BASE}.request_attendance_correction`, params)
		successMsg.value = __("Correction request {0} submitted successfully", [res?.correction || ""])

		// Reset form
		form.correction_date = ""
		form.corrected_check_in = ""
		form.corrected_check_out = ""
		form.requested_status = ""
		form.reason = ""
	} catch (e) {
		console.error("[Correction] Submit error:", e)
		let msg = __("Failed to submit. Please try again.")
		try {
			if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || msg
			else if (e?.message) msg = e.message
		} catch (_) {}
		toast({ title: msg, icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		submitting.value = false
	}
}

// ---- History ----
async function loadHistory() {
	if (!employee.data?.name) return
	loadingHistory.value = true
	try {
		const res = await call(`${API_BASE}.get_correction_requests`, {
			employee: employee.data.name,
		})
		historyItems.value = res?.corrections || []
	} catch (e) {
		console.error("[Correction] History error:", e)
		toast({ title: __("Failed to load history"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		loadingHistory.value = false
	}
}

// ---- Helpers ----
function formatTime(datetime) {
	if (!datetime) return "--:--"
	const d = dayjs(datetime)
	return d.isValid() ? d.format("hh:mm A") : "--:--"
}

function formatDate(date) {
	if (!date) return ""
	const d = dayjs(date)
	return d.isValid() ? d.format("ddd, DD-MM-YYYY") : date
}

function statusColor(status) {
	const map = {
		"Present": "text-green-700",
		"Absent": "text-red-600",
		"Half Day": "text-orange-600",
		"On Leave": "text-blue-600",
		"Work From Home": "text-purple-600",
	}
	return map[status] || "text-gray-700"
}

function typeIcon(type) {
	const map = {
		"Missed Check-out": "log-out",
		"Missed Check-in": "log-in",
		"Time Correction": "clock",
		"Wrong Status": "edit-3",
		"Remove Absence": "trash-2",
	}
	return map[type] || "edit"
}

function historyBadgeClass(status) {
	const map = {
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-blue-100 text-blue-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
	}
	return map[status] || "bg-gray-100 text-gray-700"
}
</script>
