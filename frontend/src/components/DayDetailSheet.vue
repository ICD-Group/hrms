<template>
	<Teleport to="body">
		<div v-if="show" class="day-detail-overlay" @click.self="$emit('close')">
			<div class="day-detail-backdrop" @click="$emit('close')"></div>
			<div class="day-detail-sheet">
				<!-- Handle -->
				<div class="flex justify-center pt-2 pb-1">
					<div class="w-10 h-1 bg-gray-300 rounded-full"></div>
				</div>

				<!-- Header -->
				<div class="px-4 pb-3 flex items-center justify-between">
					<div class="text-lg font-bold text-gray-900">
						{{ formattedDate }}
					</div>
					<span v-if="dayStatus" class="px-3 py-1 rounded-full text-xs font-bold" :class="statusBadgeClass">
						{{ __(dayStatus) }}
					</span>
				</div>

				<!-- Body -->
				<div class="flex-1 overflow-y-auto px-4 pb-5 space-y-4">
					<!-- Loading -->
					<div v-if="loading" class="flex items-center justify-center py-8">
						<LoadingIndicator class="w-6 h-6 text-gray-500" />
					</div>

					<template v-else-if="attendance">
						<!-- Check-in / Check-out -->
						<div class="grid grid-cols-2 gap-3">
							<div class="rounded-xl px-4 py-3 bg-green-50 border border-green-200">
								<div class="text-xs text-green-700 font-semibold mb-1">{{ __("Check-in") }}</div>
								<div class="text-xl font-bold text-green-800">{{ firstCheckIn || "--:--" }}</div>
								<div v-if="firstCheckInLog" class="mt-1.5 space-y-0.5">
									<div v-if="firstCheckInLog.location_name" class="text-xs text-green-700">&#x1F4CD; {{ firstCheckInLog.location_name }}</div>
									<div v-if="firstCheckInLog.wifi_ssid" class="text-xs text-green-700">&#x1F4F6; {{ firstCheckInLog.wifi_ssid }}</div>
									<div v-if="firstCheckInLog.face_verified" class="text-xs text-green-700">&#x1F464; {{ __("Face Verified") }}</div>
								</div>
							</div>
							<div class="rounded-xl px-4 py-3 bg-red-50 border border-red-200">
								<div class="text-xs text-red-600 font-semibold mb-1">{{ __("Check-out") }}</div>
								<div class="text-xl font-bold text-red-700">{{ lastCheckOut || "--:--" }}</div>
								<div v-if="lastCheckOutLog" class="mt-1.5 space-y-0.5">
									<div v-if="lastCheckOutLog.auto_checkout" class="text-xs text-red-600 italic">&#x23F0; {{ __("Auto Checkout") }}</div>
									<div v-else-if="lastCheckOutLog.location_name" class="text-xs text-red-600">&#x1F4CD; {{ lastCheckOutLog.location_name }}</div>
									<div v-if="lastCheckOutLog.wifi_ssid" class="text-xs text-red-600">&#x1F4F6; {{ lastCheckOutLog.wifi_ssid }}</div>
								</div>
							</div>
						</div>

						<!-- Hours / Late / Early Exit -->
						<div class="grid grid-cols-3 gap-2">
							<div class="rounded-xl px-3 py-3 bg-white border border-gray-200 text-center">
								<div class="text-xs text-gray-600 font-medium mb-1">{{ __("Hours") }}</div>
								<div class="text-lg font-bold text-gray-900">{{ workingHours }}h</div>
							</div>
							<div class="rounded-xl px-3 py-3 bg-white border border-gray-200 text-center">
								<div class="text-xs text-gray-600 font-medium mb-1">{{ __("Late") }}</div>
								<div class="text-lg font-bold" :class="attendance.late_entry ? 'text-red-600' : 'text-green-600'">
									{{ attendance.late_entry ? __("Yes") : __("No") }}
								</div>
							</div>
							<div class="rounded-xl px-3 py-3 bg-white border border-gray-200 text-center">
								<div class="text-xs text-gray-600 font-medium mb-1">{{ __("Early Exit") }}</div>
								<div class="text-lg font-bold" :class="attendance.early_exit ? 'text-orange-600' : 'text-green-600'">
									{{ attendance.early_exit ? __("Yes") : __("No") }}
								</div>
							</div>
						</div>

						<!-- Tags Row: Shift / Leave / WFH -->
						<div v-if="attendance.shift || attendance.leave_type || dayStatus === 'Work From Home'" class="flex flex-wrap gap-2">
							<span v-if="attendance.shift" class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
								{{ attendance.shift }}
							</span>
							<span v-if="attendance.leave_type" class="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
								{{ attendance.leave_type }}
							</span>
							<span v-if="dayStatus === 'Work From Home'" class="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
								&#x1F3E0; WFH
							</span>
						</div>

						<!-- Penalty -->
						<div v-if="penalty" class="rounded-xl px-4 py-3 bg-red-50 border border-red-200">
							<div class="flex items-center justify-between">
								<span class="text-sm font-bold text-red-800">
									{{ penalty.penalty_type }} &middot; {{ penalty.penalty_level }}
								</span>
								<span v-if="penalty.deduction_days > 0" class="text-sm font-bold text-red-700">
									-{{ penalty.deduction_days }}d
								</span>
							</div>
							<div v-if="penalty.excuse_status" class="text-xs font-semibold mt-1"
								:class="penalty.excuse_status === 'Approved' ? 'text-green-700' : penalty.excuse_status === 'Rejected' ? 'text-red-600' : 'text-orange-600'">
								{{ __("Excuse") }}: {{ __(penalty.excuse_status) }}
							</div>
						</div>

						<!-- Activity Log - Date | IN | OUT on row 1, details on row 2 -->
						<div v-if="logPairs.length > 0">
							<div class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{{ __("Activity Log") }}</div>
							<div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
								<div v-for="(pair, idx) in logPairs" :key="idx"
									class="px-4 py-3"
									:class="idx < logPairs.length - 1 ? 'border-b border-gray-100' : ''">
									<!-- Row 1: Date | IN | OUT -->
									<div class="flex items-center">
										<div class="text-xs font-semibold text-gray-800 w-16 flex-shrink-0">
											{{ formatLogDate(pair.inLog || pair.outLog) }}
										</div>
										<div class="flex-1 flex items-center gap-1.5">
											<span class="text-xs font-bold text-green-700">IN</span>
											<span class="text-sm font-bold text-green-800">{{ pair.inLog ? formatTime(pair.inLog.timestamp) : '--:--' }}</span>
										</div>
										<div class="flex-1 flex items-center gap-1.5 justify-end">
											<span class="text-xs font-bold text-red-600">OUT</span>
											<span class="text-sm font-bold text-red-700">{{ pair.outLog ? formatTime(pair.outLog.timestamp) : '--:--' }}</span>
										</div>
									</div>
									<!-- Row 2: Location, WiFi, WFH, tags -->
									<div class="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-700">
										<span v-if="pairLocation(pair)" class="font-medium">&#x1F4CD; {{ pairLocation(pair) }}</span>
										<span v-if="pairWifi(pair)" class="font-medium">&#x1F4F6; {{ pairWifi(pair) }}</span>
										<span v-if="pairHasFace(pair)" class="font-medium">&#x1F464; {{ __("Face") }}</span>
										<span v-if="dayStatus === 'Work From Home'" class="text-purple-700 font-semibold">&#x1F3E0; WFH</span>
										<span v-if="pair.outLog && pair.outLog.auto_checkout" class="text-yellow-700 font-semibold">&#x23F0; {{ __("Auto") }}</span>
										<span v-if="pairHasFlag(pair, 'is_correction')" class="text-blue-700 font-semibold">{{ __("Correction") }}</span>
										<span v-if="pairHasFlag(pair, 'is_offline')" class="font-medium">{{ __("Offline") }}</span>
										<span v-if="pairOutside(pair)" class="text-orange-700 font-semibold">{{ __("Outside") }}</span>
									</div>
								</div>
							</div>
						</div>
					</template>

					<!-- No data -->
					<div v-else-if="!loading" class="text-center py-8 text-base text-gray-600 font-medium">
						{{ dayStatus === 'Holiday' ? __("Holiday") : __("No attendance record") }}
					</div>

					<!-- View Full History -->
					<button
						@click="goToHistory"
						class="w-full py-3 bg-gray-900 active:bg-gray-700 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1"
					>
						{{ __("View Full History") }}
						<span class="text-xs">&#x2192;</span>
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
import { computed, inject, ref, watch } from "vue"
import { call, LoadingIndicator } from "frappe-ui"
import { useRouter } from "vue-router"

const router = useRouter()
const dayjs = inject("$dayjs")
const employee = inject("$employee")
const __ = inject("$translate")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const props = defineProps({
	show: { type: Boolean, default: false },
	date: { type: String, default: null },
	status: { type: String, default: null },
})

defineEmits(["close"])

const loading = ref(false)
const dayResult = ref(null)
const penaltyResult = ref(null)

const formattedDate = computed(() => {
	if (!props.date) return ""
	return dayjs(props.date).format("dddd, DD-MM")
})

const dayStatus = computed(() => props.status)

const statusBadgeClass = computed(() => {
	const s = dayStatus.value
	if (s === "Present" || s === "Work From Home") return "bg-green-100 text-green-800"
	if (s === "Absent") return "bg-red-100 text-red-700"
	if (s === "On Leave") return "bg-orange-100 text-orange-800"
	if (s === "Half Day") return "bg-blue-100 text-blue-800"
	return "bg-gray-200 text-gray-800"
})

async function fetchDayData() {
	if (!props.date || !employee.data?.name) return
	loading.value = true
	dayResult.value = null
	penaltyResult.value = null
	try {
		const [attRes, penRes] = await Promise.all([
			call(`${API_BASE}.checkin.get_attendance_history`, {
				employee: employee.data.name,
				from_date: props.date,
				to_date: props.date,
			}),
			call(`${API_BASE}.salary.get_penalties`, {
				employee: employee.data.name,
				month: dayjs(props.date).month() + 1,
				year: dayjs(props.date).year(),
			}).catch(() => null),
		])
		dayResult.value = attRes
		penaltyResult.value = penRes
	} catch (e) {
		dayResult.value = null
	} finally {
		loading.value = false
	}
}

watch(() => props.date, (d) => { if (d && props.show) fetchDayData() })
watch(() => props.show, (v) => { if (v && props.date) fetchDayData() })

const attendance = computed(() => {
	if (!dayResult.value?.attendance?.length) return null
	return dayResult.value.attendance[0]
})

const detailedLogs = computed(() => dayResult.value?.detailed_logs || [])

// Pair IN/OUT logs together in one row
const logPairs = computed(() => {
	const ins = detailedLogs.value.filter(l => l.log_type === "Check-in")
	const outs = detailedLogs.value.filter(l => l.log_type === "Check-out" && !l.auto_checkout)
	const pairs = []
	const maxLen = Math.max(ins.length, outs.length)
	for (let i = 0; i < maxLen; i++) {
		pairs.push({ inLog: ins[i] || null, outLog: outs[i] || null })
	}
	return pairs
})

function pairLocation(pair) {
	return (pair.inLog?.location_name || pair.outLog?.location_name) || null
}
function pairWifi(pair) {
	return (pair.inLog?.wifi_ssid || pair.outLog?.wifi_ssid) || null
}
function pairHasFace(pair) {
	return (pair.inLog?.face_verified || pair.outLog?.face_verified)
}
function pairHasFlag(pair, flag) {
	return (pair.inLog && pair.inLog[flag]) || (pair.outLog && pair.outLog[flag])
}
function pairOutside(pair) {
	const log = pair.inLog || pair.outLog
	return log && !log.is_within_geofence && log.latitude
}
function formatLogDate(log) {
	if (!log?.timestamp) return ""
	return dayjs(log.timestamp).format("DD-MM")
}

const penalty = computed(() => {
	if (!penaltyResult.value?.penalties?.length || !props.date) return null
	return penaltyResult.value.penalties.find(p => p.attendance_date === props.date)
})

const firstCheckInLog = computed(() => detailedLogs.value.find(l => l.log_type === "Check-in"))
const lastCheckOutLog = computed(() => {
	const outs = detailedLogs.value.filter(l => l.log_type === "Check-out")
	return outs.length ? outs[outs.length - 1] : null
})

const firstCheckIn = computed(() => firstCheckInLog.value ? formatTime(firstCheckInLog.value.timestamp) : null)
const lastCheckOut = computed(() => lastCheckOutLog.value ? formatTime(lastCheckOutLog.value.timestamp) : null)

const workingHours = computed(() => {
	if (!attendance.value?.working_hours) return "0"
	return Number(attendance.value.working_hours).toFixed(1)
})

function formatTime(dt) {
	if (!dt) return null
	const d = dayjs(dt)
	return d.isValid() ? d.format("hh:mm A") : null
}

function goToHistory() {
	router.push({ name: "GeniusMyHistory" })
}
</script>

<style>
.day-detail-overlay {
	position: fixed;
	inset: 0;
	z-index: 99999;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}
.day-detail-backdrop {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
}
.day-detail-sheet {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 32rem;
	background: #f9fafb;
	border-radius: 1rem 1rem 0 0;
	box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
	max-height: 70vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: dayDetailSlideUp 0.3s ease-out;
}
@keyframes dayDetailSlideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
</style>
