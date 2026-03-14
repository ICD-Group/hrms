<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Permission Request") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Tab: New Request vs My Requests -->
				<div class="flex gap-2">
					<button @click="activeView = 'new'"
						class="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
						:class="activeView === 'new'
							? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
							: 'bg-gray-200 text-gray-800'">
						<FeatherIcon name="plus-circle" class="w-4 h-4 inline mr-1" />
						{{ __("New Request") }}
					</button>
					<button @click="activeView = 'history'; loadHistory()"
						class="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
						:class="activeView === 'history'
							? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
							: 'bg-gray-200 text-gray-800'">
						<FeatherIcon name="list" class="w-4 h-4 inline mr-1" />
						{{ __("My Requests") }}
					</button>
				</div>

				<!-- ======================== -->
				<!-- NEW REQUEST FORM -->
				<!-- ======================== -->
				<template v-if="activeView === 'new'">

					<!-- Permission Type Selection -->
					<section v-if="permissionTypes.length">
						<div class="section-title mb-3">{{ __("Permission Type") }}</div>
						<div class="grid grid-cols-3 gap-3">
							<button
								v-for="pt in permissionTypes" :key="pt.name"
								@click="selectType(pt)"
								class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center transition-all"
								:class="form.permission_type === pt.name
									? 'ring-2 ring-violet-500 bg-violet-50/50'
									: 'hover:bg-gray-50'"
							>
								<div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
									:class="form.permission_type === pt.name ? 'bg-violet-100' : 'bg-gray-100'">
									<FeatherIcon :name="categoryIcon(pt.category)" class="w-5 h-5"
										:class="form.permission_type === pt.name ? 'text-violet-600' : 'text-gray-600'" />
								</div>
								<div class="text-xs font-bold"
									:class="form.permission_type === pt.name ? 'text-violet-700' : 'text-gray-700'">
									{{ __(pt.category) }}
								</div>
								<div class="text-[10px] text-gray-400 mt-1">
									{{ __("Max") }} {{ formatMaxHours(pt.max_hours) }}
								</div>
							</button>
						</div>
					</section>

					<!-- Info Card: Quota + Rules -->
					<div v-if="selectedType" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
						<div class="grid grid-cols-3 gap-3 text-center">
							<div>
								<div class="text-[11px] font-bold text-gray-500 uppercase">{{ __("Quota") }}</div>
								<div class="text-lg font-black mt-0.5"
									:class="quotaInfo.remaining <= 0 ? 'text-red-600' : 'text-violet-700'">
									{{ quotaInfo.used }}/{{ selectedType.monthly_quota }}
								</div>
								<div class="text-[10px] text-gray-400">{{ __("this month") }}</div>
							</div>
							<div>
								<div class="text-[11px] font-bold text-gray-500 uppercase">{{ __("Max Time") }}</div>
								<div class="text-lg font-black text-gray-800 mt-0.5">
									{{ formatMaxHours(selectedType.max_hours) }}
								</div>
								<div class="text-[10px] text-gray-400">{{ __("per request") }}</div>
							</div>
							<div>
								<div class="text-[11px] font-bold text-gray-500 uppercase">{{ __("Grace") }}</div>
								<div class="text-lg font-black mt-0.5"
									:class="selectedType.grace_minutes > 0 ? 'text-green-600' : 'text-gray-400'">
									{{ selectedType.grace_minutes || 0 }}m
								</div>
								<div class="text-[10px] text-gray-400">
									{{ selectedType.auto_approve_within_grace ? __("auto-approve") : __("needs approval") }}
								</div>
							</div>
						</div>
						<div v-if="quotaInfo.remaining <= 0" class="mt-3 pt-3 border-t border-gray-100 text-xs text-red-600 font-medium text-center">
							<FeatherIcon name="alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
							{{ __("Quota exceeded - request needs special approval") }}
						</div>
					</div>

					<!-- Date -->
					<section>
						<div class="section-title mb-3">{{ __("Date") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0 overflow-hidden">
							<div class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Permission Date") }}</label>
								<input type="date" v-model="form.permission_date"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
						</div>
					</section>

					<!-- Time Range -->
					<section>
						<div class="section-title mb-3">{{ __("Time") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0 overflow-hidden divide-y divide-gray-100">
							<div class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("From") }}</label>
								<input type="time" v-model="form.from_time"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
							<div class="p-3.5">
								<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("To") }}</label>
								<input type="time" v-model="form.to_time"
									class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							</div>
						</div>
						<!-- Duration Badge -->
						<div v-if="totalMinutes > 0" class="mt-2.5 flex justify-center">
							<span class="text-sm font-bold px-4 py-1.5 rounded-full"
								:class="durationClass">
								{{ formatDuration(totalMinutes) }}
								<span v-if="isWithinGrace" class="ml-1 text-xs font-medium opacity-80">
									({{ __("within grace - auto-approve") }})
								</span>
								<span v-else-if="exceedsMax" class="ml-1 text-xs font-medium opacity-80">
									({{ __("exceeds max {0}", [formatMaxHours(selectedType?.max_hours)]) }})
								</span>
							</span>
						</div>
					</section>

					<!-- Reason -->
					<section>
						<div class="section-title mb-3">{{ __("Reason") }}</div>
						<div class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0">
							<textarea v-model="form.reason"
								:placeholder="__('Why do you need this permission?')"
								class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
								rows="3"></textarea>
						</div>
						<div class="flex justify-between mt-1.5 px-1">
							<div class="text-[11px]" :class="form.reason.length < 3 ? 'text-gray-500' : 'text-violet-600'">
								{{ form.reason.length }}/500
							</div>
						</div>
					</section>

					<!-- Submit Button -->
					<button @click="submitPermission" :disabled="submitting || !isValid"
						class="w-full bg-violet-600 text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
						<FeatherIcon v-if="!submitting" name="send" class="w-4 h-4 inline mr-2" />
						<FeatherIcon v-else name="loader" class="w-4 h-4 inline mr-2 animate-spin" />
						{{ submitting ? __("Submitting...") : __("Submit Permission Request") }}
					</button>

					<!-- Success Message -->
					<div v-if="successMsg" class="bg-white rounded-2xl border shadow-sm p-4 text-center"
						:class="autoApproved ? 'border-green-200 bg-green-50' : 'border-violet-200 bg-violet-50'">
						<FeatherIcon :name="autoApproved ? 'check-circle' : 'clock'" class="w-8 h-8 mx-auto mb-2"
							:class="autoApproved ? 'text-green-500' : 'text-violet-500'" />
						<div class="text-sm font-bold" :class="autoApproved ? 'text-green-700' : 'text-violet-700'">
							{{ successMsg }}
						</div>
						<div class="text-xs text-gray-500 mt-1">
							{{ autoApproved ? __("No further action needed") : __("HR will review your request") }}
						</div>
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
						<FeatherIcon name="shield" class="w-10 h-10 text-gray-400 mx-auto mb-2" />
						<div class="text-sm font-bold text-gray-700">{{ __("No permission requests yet") }}</div>
						<div class="text-xs text-gray-500 mt-1">{{ __("Submit your first request above") }}</div>
					</div>

					<div v-else class="flex flex-col gap-3">
						<div v-for="p in historyItems" :key="p.name"
							class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
							<!-- Header: Category + Status Badge -->
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div class="w-8 h-8 rounded-lg flex items-center justify-center"
										:class="historyIconBg(p.status)">
										<FeatherIcon :name="categoryIcon(p.permission_category)" class="w-4 h-4"
											:class="historyIconColor(p.status)" />
									</div>
									<div>
										<div class="text-sm font-bold text-gray-900">{{ __(p.permission_category) }}</div>
										<div class="text-[11px] text-gray-500">{{ formatDate(p.permission_date) }}</div>
									</div>
								</div>
								<span class="px-2.5 py-1 rounded-full text-[11px] font-bold"
									:class="historyBadgeClass(p.status)">
									{{ __(p.status) }}
								</span>
							</div>
							<!-- Time + Duration -->
							<div class="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
								<div class="flex items-center gap-1.5 text-xs text-gray-600">
									<FeatherIcon name="clock" class="w-3.5 h-3.5" />
									{{ formatTime(p.from_time) }} - {{ formatTime(p.to_time) }}
								</div>
								<span v-if="p.total_minutes" class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
									{{ formatDuration(p.total_minutes) }}
								</span>
								<span v-if="p.auto_approved" class="text-[11px] font-bold text-green-600">
									{{ __("Auto") }}
								</span>
							</div>
							<!-- Reason -->
							<div v-if="p.reason" class="text-xs text-gray-500 mt-2 line-clamp-2">{{ p.reason }}</div>
							<!-- Rejection reason -->
							<div v-if="p.status === 'Rejected' && p.rejection_reason"
								class="mt-2 pt-2 border-t border-gray-100 text-xs text-red-600">
								<FeatherIcon name="x-circle" class="w-3.5 h-3.5 inline mr-1" />
								{{ p.rejection_reason }}
							</div>
						</div>
					</div>

				</template>

			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { FeatherIcon, call, toast } from "frappe-ui"

const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const router = useRouter()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const activeView = ref("new")

const permissionTypes = ref([])
const selectedType = ref(null)
const quotaInfo = reactive({ used: 0, remaining: 99 })

const form = reactive({
	permission_type: "",
	permission_date: new Date().toISOString().split("T")[0],
	from_time: "",
	to_time: "",
	reason: "",
})

const submitting = ref(false)
const successMsg = ref("")
const autoApproved = ref(false)

// History
const historyItems = ref([])
const loadingHistory = ref(false)

onMounted(async () => {
	try {
		const res = await call(`${API_BASE}.get_permission_types`)
		const types = res?.permission_types || []
		// Sort: Late Arrival first
		types.sort((a, b) => {
			if (a.category === "Late Arrival") return -1
			if (b.category === "Late Arrival") return 1
			return 0
		})
		permissionTypes.value = types
		// Auto-select Late Arrival
		const lateType = types.find(t => t.category === "Late Arrival")
		if (lateType) selectType(lateType)
	} catch (e) {
		_errToast(e, "Failed to load permission types")
	}
})

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

function categoryIcon(cat) {
	if (cat === "Late Arrival") return "clock"
	if (cat === "Early Leave") return "log-out"
	if (cat === "Short Leave") return "coffee"
	return "shield"
}

function selectType(pt) {
	form.permission_type = pt.name
	selectedType.value = pt
	loadQuota(pt)
}

async function loadQuota(pt) {
	try {
		const res = await call(`${API_BASE}.get_my_permission_summary`)
		const s = (res?.summary || []).find(s => s.permission_type === pt.name)
		if (s) {
			quotaInfo.used = s.used
			quotaInfo.remaining = s.remaining
		} else {
			quotaInfo.used = 0
			quotaInfo.remaining = pt.monthly_quota || 99
		}
	} catch (_) {}
}

function formatMaxHours(h) {
	if (!h) return "--"
	const hrs = Math.floor(h)
	const mins = Math.round((h - hrs) * 60)
	if (hrs === 0) return `${mins}m`
	if (mins === 0) return `${hrs}h`
	return `${hrs}h ${mins}m`
}

const totalMinutes = computed(() => {
	if (!form.from_time || !form.to_time) return 0
	const [fh, fm] = form.from_time.split(":").map(Number)
	const [th, tm] = form.to_time.split(":").map(Number)
	const diff = (th * 60 + tm) - (fh * 60 + fm)
	return diff > 0 ? diff : 0
})

const isWithinGrace = computed(() => {
	if (!selectedType.value) return false
	return totalMinutes.value > 0 &&
		selectedType.value.grace_minutes > 0 &&
		totalMinutes.value <= selectedType.value.grace_minutes &&
		selectedType.value.auto_approve_within_grace
})

const exceedsMax = computed(() => {
	if (!selectedType.value || !selectedType.value.max_hours) return false
	return totalMinutes.value > selectedType.value.max_hours * 60
})

const durationClass = computed(() => {
	if (exceedsMax.value) return "text-red-700 bg-red-100"
	if (isWithinGrace.value) return "text-green-700 bg-green-100"
	return "text-violet-700 bg-violet-100"
})

function formatDuration(mins) {
	if (mins < 60) return `${mins} min`
	const h = Math.floor(mins / 60)
	const m = mins % 60
	return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const isValid = computed(() => {
	if (!form.permission_type || !form.permission_date) return false
	if (!form.from_time || !form.to_time) return false
	if (totalMinutes.value <= 0) return false
	if (exceedsMax.value) return false
	if (!form.reason.trim() || form.reason.trim().length < 3) return false
	return true
})

async function submitPermission() {
	if (!isValid.value || submitting.value) return
	submitting.value = true
	successMsg.value = ""
	autoApproved.value = false

	try {
		const res = await call(`${API_BASE}.submit_employee_permission`, {
			permission_type: form.permission_type,
			permission_date: form.permission_date,
			from_time: form.from_time,
			to_time: form.to_time,
			reason: form.reason,
		})

		autoApproved.value = !!res?.auto_approved
		successMsg.value = res?.message || __("Permission submitted successfully")

		// Reset form but keep type selected
		form.from_time = ""
		form.to_time = ""
		form.reason = ""

		// Refresh quota
		if (selectedType.value) loadQuota(selectedType.value)
	} catch (e) {
		_errToast(e, "Failed to submit permission")
	} finally {
		submitting.value = false
	}
}

// ---- History ----
async function loadHistory() {
	loadingHistory.value = true
	try {
		const res = await call(`${API_BASE}.get_my_permissions`, { limit: 50 })
		historyItems.value = res?.permissions || []
	} catch (e) {
		_errToast(e, "Failed to load history")
	} finally {
		loadingHistory.value = false
	}
}

function formatTime(t) {
	if (!t) return "--:--"
	return String(t).slice(0, 5)
}

function formatDate(date) {
	if (!date) return ""
	const d = dayjs(date)
	return d.isValid() ? d.format("ddd, DD-MM") : date
}

function historyBadgeClass(status) {
	const map = {
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-blue-100 text-blue-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Cancelled": "bg-gray-100 text-gray-600",
	}
	return map[status] || "bg-gray-100 text-gray-700"
}

function historyIconBg(status) {
	if (status === "Approved") return "bg-green-100"
	if (status === "Rejected") return "bg-red-100"
	if (status === "Cancelled") return "bg-gray-100"
	return "bg-violet-100"
}

function historyIconColor(status) {
	if (status === "Approved") return "text-green-600"
	if (status === "Rejected") return "text-red-600"
	if (status === "Cancelled") return "text-gray-500"
	return "text-violet-600"
}
</script>
