<template>
	<div class="card-premium w-full py-3 px-4" role="region" :aria-label="__('Check-in Panel')">
		<!-- Streak Badge -->
		<div v-if="streaks.data?.current_streak >= 3" class="flex items-center gap-1.5 mt-2 rounded-lg px-2.5 py-1 streak-badge" :class="streaks.data.current_streak >= 7 ? 'streak-glow' : ''">
			<span class="text-sm">&#x1F525;</span>
			<span class="text-xs font-semibold text-amber-800 dark:text-amber-300">
				{{ streaks.data.current_streak }}-{{ __("day streak!") }}
			</span>
			<span v-if="streaks.data.milestones?.next_5 <= 3" class="text-[11px] text-amber-600 dark:text-amber-300 ml-auto">
				{{ streaks.data.milestones.next_5 }} {{ __("more for 5-day bonus") }}
			</span>
		</div>

		<!-- Check-in / Check-out Button with Live Timer -->
		<div v-if="nextAction === 'OUT' && !checkinSuccess && todayStatus.data?.first_check_in"
			class="mt-3 mb-1 genius-timer-btn" :class="{ 'genius-timer-disabled': deviceBlocked }"
			@click="!deviceBlocked && openCheckinModal()">
			<!-- Progress fill -->
			<div class="timer-progress" :style="{ width: shiftProgress + '%' }"></div>
			<!-- Ruler hour markers 1H-10H -->
			<div class="timer-ruler" aria-hidden="true">
				<div class="ruler-overtime-zone"></div>
				<div v-for="h in 10" :key="h" class="ruler-mark" :class="{ 'ruler-overtime': h >= 9 }" :style="{ left: (h * 10) + '%' }">
					<div class="ruler-tick"></div>
					<span class="ruler-label">{{ h }}h</span>
				</div>
			</div>
			<!-- Main content - since left, elapsed center, checkout right -->
			<div class="timer-content">
				<div class="timer-since-left">
					<div class="timer-since-label">SINCE</div>
					<div class="timer-since-time">{{ formatTime(todayStatus.data.first_check_in) }}</div>
				</div>
				<div class="timer-center">
					<div class="timer-elapsed" style="font-variant-numeric: tabular-nums;">
						{{ elapsedTime }}
					</div>
				</div>
				<div class="timer-checkout-btn">
					<div class="timer-dot"></div>
					<FeatherIcon name="log-out" class="w-4 h-4" />
					<span class="timer-checkout-text">{{ __("Check Out") }}</span>
				</div>
			</div>
		</div>
		<Button
			v-else
			class="w-full mt-3 mb-1 py-4 text-base font-semibold rounded-xl shadow-md genius-btn"
			:class="[
				deviceBlocked ? 'genius-btn-disabled' : (nextAction === 'IN' ? 'genius-btn-in text-white pulse-glow' : 'genius-btn-out text-white'),
				checkinSuccess ? 'genius-btn-success' : ''
			]"
			:disabled="deviceBlocked"
			:aria-label="checkinSuccess ? __('Check-in successful') : (nextAction === 'IN' ? __('Check in now') : __('Check out now'))"
			@click="openCheckinModal"
		>
			<template #prefix>
				<FeatherIcon
					v-if="!checkinSuccess"
					:name="nextAction === 'IN' ? 'camera' : 'camera'"
					class="w-5"
				/>
				<span v-else class="animate-checkmark inline-flex">&#x2713;</span>
			</template>
			{{ checkinSuccess ? __('Success!') : (nextAction === 'IN' ? __('Check In') : __('Check Out')) }}
		</Button>

		<!-- Verification Result (Task #7) -->
		<div v-if="verificationResult" class="mt-2 bg-gray-100 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-white/10 transition-all duration-300">
			<div class="flex flex-wrap gap-1.5 justify-center">
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
					:class="verificationResult.is_within_geofence ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : (geofenceBypassed ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300')">
					<FeatherIcon :name="verificationResult.is_within_geofence ? 'check-circle' : (geofenceBypassed ? 'home' : 'x-circle')" class="w-3" />
					{{ verificationResult.is_within_geofence ? __('GPS') : (geofenceBypassed ? (isMissionActive ? __('Mission') : __('WFH')) : __('GPS')) }}
				</span>
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
					:class="verificationResult.face_verified ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-gray-700'">
					<FeatherIcon :name="verificationResult.face_verified ? 'check-circle' : 'minus-circle'" class="w-3" />
					{{ __("Photo") }}
				</span>
				<span v-if="geniusSettings.data?.anti_fraud?.wifi_bssid_verification && !geofenceBypassed" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
					:class="wifiVerified ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-gray-700'">
					<FeatherIcon :name="wifiVerified ? 'check-circle' : 'minus-circle'" class="w-3" />
					{{ __('WiFi') }}
				</span>
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
					:class="verificationResult.fraud_score === 0 ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : verificationResult.fraud_score < 30 ? 'bg-yellow-100 dark:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300'">
					<FeatherIcon name="shield" class="w-3" />
					{{ verificationResult.fraud_score === 0 ? __('Clean') : verificationResult.fraud_score + ' ' + __('risk') }}
				</span>
				<span v-if="verificationResult.is_mock_location" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300">
					<FeatherIcon name="alert-triangle" class="w-3" />
					{{ __("FAKE GPS") }}
				</span>
			</div>
			<div v-if="verificationResult.compliance_warnings?.length > 0" class="mt-1.5 text-[11px] text-orange-600 text-center">
				<FeatherIcon name="alert-triangle" class="w-3 inline" />
				{{ verificationResult.compliance_warnings[0] }}
			</div>
		</div>

		<!-- Device Pending Approval Banner -->
		<div v-if="devicePendingApproval" class="mt-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border border-amber-200 dark:border-amber-700">
			<div class="flex items-center gap-2 mb-1.5">
				<FeatherIcon name="clock" class="w-4 text-amber-600 dark:text-amber-300" />
				<span class="text-xs font-bold text-amber-800 dark:text-amber-300">{{ __("Device Pending Approval") }}</span>
			</div>
			<p class="text-[11px] text-amber-700 dark:text-amber-300">{{ __("Your device has been registered and is waiting for HR approval. You will be able to check in once approved.") }}</p>
		</div>

		<!-- Device Mismatch Banner -->
		<div v-if="deviceMismatch && !devicePendingApproval" class="mt-2 bg-red-50 dark:bg-red-900/30 rounded-xl p-3 border border-red-200 dark:border-red-700">
			<div class="flex items-center gap-2 mb-1.5">
				<FeatherIcon name="alert-triangle" class="w-4 text-red-600 dark:text-red-300" />
				<span class="text-xs font-bold text-red-800 dark:text-red-300">{{ __("Different Device Detected") }}</span>
			</div>
			<p class="text-[11px] text-red-700 dark:text-red-300 mb-2">{{ __("You are using a different device/browser than your registered one. Register this device or use your registered device.") }}</p>
			<Button variant="solid" size="sm" class="w-full" @click="autoRegisterDevice">
				{{ __("Register This Device") }}
			</Button>
		</div>

		<!-- Device Registration Prompt (Task #6) -->
		<div v-if="showDevicePrompt && !devicePendingApproval" class="mt-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
			<div class="flex items-center gap-2 mb-2">
				<FeatherIcon name="smartphone" class="w-4 text-blue-600 dark:text-blue-300" />
				<span class="text-xs font-bold text-blue-800 dark:text-blue-300">{{ __("Register This Device") }}</span>
			</div>
			<p class="text-[11px] text-blue-700 dark:text-blue-300 mb-2">{{ __("Your company requires device registration for attendance. Register this device to check in.") }}</p>
			<Button variant="solid" size="sm" class="w-full" @click="autoRegisterDevice">
				{{ __("Register Device") }}
			</Button>
		</div>

		<!-- Offline Queue Badge -->
		<div v-if="offlineCount > 0" class="flex items-center gap-2 mt-2 text-xs text-orange-600 justify-center">
			<FeatherIcon name="wifi-off" class="w-3.5" />
			{{ offlineCount }} {{ __("pending sync") }}
		</div>

		<!-- Confetti Container -->
		<div ref="confettiContainer"></div>
	</div>

	<!-- Check-in Modal -->
	<ion-modal
		ref="checkinModal"
		:is-open="showModal"
		@didDismiss="showModal = false"
		:initial-breakpoint="1"
		:breakpoints="[0, 1]"
	>
		<div class="flex flex-col items-center p-4 pb-6 gap-3 overflow-y-auto bg-white dark:bg-gray-900" style="max-height: 90vh;">
			<!-- Live Clock -->
			<div class="text-center mt-1 w-full bg-white dark:bg-gray-900 py-3">
				<div class="flex items-baseline justify-center gap-1" style="font-variant-numeric: tabular-nums;">
					<span class="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{{ liveTime.format("hh:mm") }}</span>
					<span class="text-2xl font-bold text-gray-600 dark:text-gray-700">{{ liveTime.format("ss") }}</span>
					<span class="text-lg font-bold text-gray-700 dark:text-gray-700 ml-1">{{ liveTime.format("A") }}</span>
				</div>
				<div class="text-sm font-medium text-gray-700 dark:text-gray-700 mt-1.5">
					{{ liveTime.format("dddd, DD-MM-YYYY") }}
				</div>
			</div>

			<!-- Location Card -->
			<div class="w-full bg-gray-100 dark:bg-white/5 rounded-xl p-4">
				<div class="flex items-center gap-2 mb-2">
					<FeatherIcon name="map-pin" class="w-4 text-icd-600 dark:text-icd-300" />
					<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Location") }}</span>
				</div>

				<div v-if="locationLoading" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-700">
					<span class="animate-spin">&#8635;</span>
					{{ __("Getting location...") }}
				</div>

				<div v-else-if="locationError" class="text-sm text-red-500">
					{{ locationError }}
				</div>

				<div v-else class="space-y-2">
					<!-- Mock Location Warning -->
					<div v-if="isMockLocation" class="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-700">
						<FeatherIcon name="alert-octagon" class="w-4 text-red-600" />
						<span class="font-bold">{{ __("Fake GPS detected!") }}</span>
					</div>

					<div v-if="isWithinGeofence" class="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-lg px-3 py-2">
						<FeatherIcon name="check-circle" class="w-4" />
						<span class="font-medium">{{ nearestLocation ? nearestLocation + ' - ' + __("Office") : __("Within office area") }}</span>
						<span class="ml-auto text-xs font-semibold text-green-600">{{ distanceFromOffice }}m</span>
					</div>
					<div v-else-if="isWfhActive" class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-700">
						<FeatherIcon name="home" class="w-4 text-blue-600" />
						<span class="font-bold">{{ __("Working From Home") }}</span>
					</div>
					<div v-else-if="isMissionActive" class="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-700">
						<FeatherIcon name="map-pin" class="w-4 text-purple-600" />
						<span class="font-bold">{{ __("On Mission") }}</span>
						<span v-if="activeWorkRequest?.mission_location" class="ml-auto text-xs font-semibold text-purple-600">{{ activeWorkRequest.mission_location }}</span>
					</div>
					<div v-else class="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-700">
						<FeatherIcon name="alert-triangle" class="w-4 text-red-600" />
						<span class="font-bold">{{ __("Outside office area") }}</span>
						<span class="ml-auto text-xs font-semibold text-red-600">{{ distanceFromOffice }}m</span>
					</div>

					<!-- GPS Accuracy Badge -->
					<div v-if="gpsAccuracy" class="flex items-center justify-center gap-1 text-[11px] text-gray-700 dark:text-gray-700">
						<FeatherIcon name="crosshair" class="w-3" />
						{{ __("Accuracy") }}: {{ Math.round(gpsAccuracy) }}m
					</div>

					<!-- Map Preview -->
					<div class="rounded-lg overflow-hidden border border-gray-200 dark:border-white/15 h-24">
						<iframe
							width="100%"
							height="96"
							frameborder="0"
							scrolling="no"
							style="border: 0"
							:src="`https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=16&output=embed`"
						></iframe>
					</div>
				</div>
			</div>

			<!-- Photo Capture -->
			<div class="w-full bg-gray-100 dark:bg-white/5 rounded-xl p-4">
				<div class="flex items-center gap-2 mb-2">
					<FeatherIcon name="camera" class="w-4 text-purple-600" />
					<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Photo Verification") }}</span>
				</div>

				<div v-if="!photoData" class="flex flex-col items-center gap-3">
					<div v-if="showCamera" class="relative w-full">
						<video
							ref="videoEl"
							autoplay
							playsinline
							class="w-full h-48 rounded-lg object-cover bg-black"
							style="transform: scaleX(-1);"
						></video>
						<!-- Face Guide Circle -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div class="w-28 h-28 rounded-full border-2 border-dashed border-white/60" style="box-shadow: 0 0 0 9999px rgba(0,0,0,0.15);"></div>
						</div>
						<div class="absolute bottom-2 left-0 right-0 text-center">
							<span class="text-[11px] text-white/80 bg-black/30 px-2 py-0.5 rounded-full">{{ __("Position face in circle") }}</span>
						</div>
					</div>
					<div v-else class="w-full h-48 rounded-lg bg-gray-200 dark:bg-white/15 flex items-center justify-center">
						<span class="animate-spin text-gray-600 dark:text-gray-700 text-xl">&#8635;</span>
					</div>
					<canvas ref="canvasEl" class="hidden"></canvas>

					<Button
						v-if="showCamera"
						variant="solid"
						class="w-full py-3"
						@click="capturePhoto"
					>
						<template #prefix>
							<FeatherIcon name="aperture" class="w-4" />
						</template>
						{{ __("Capture") }}
					</Button>
				</div>

				<div v-else class="flex flex-col items-center gap-2">
					<img :src="photoData" class="w-full rounded-lg" style="max-height: 240px; object-fit: contain;" />
					<Button variant="subtle" size="sm" @click="retakePhoto">
						{{ __("Retake") }}
					</Button>
				</div>
			</div>

			<!-- Device Info -->
			<div class="w-full flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-700">
				<FeatherIcon name="smartphone" class="w-3.5" />
				<span>{{ deviceInfo.device_name }} &middot; {{ deviceInfo.os_version }}</span>
			</div>

			<!-- Geofence Block Message -->
			<div
				v-if="!locationLoading && geniusSettings.data?.office_locations?.length > 0 && !isWithinGeofence && !geofenceBypassed"
				class="w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-center"
			>
				<div class="flex items-center justify-center gap-2 text-red-700 dark:text-red-300">
					<FeatherIcon name="shield-off" class="w-4" />
					<span class="text-sm font-bold">{{ __("Check-in Blocked") }}</span>
				</div>
				<p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ __("You must be within office area to check in") }}</p>
			</div>

			<!-- Confirm Button -->
			<Button
				:loading="submitting"
				variant="solid"
				class="w-full py-4 text-base font-semibold rounded-xl shadow-md genius-btn"
				:class="nextAction === 'IN' ? 'genius-btn-in' : 'genius-btn-out'"
				@click="submitCheckin"
				:disabled="locationLoading || (geniusSettings.data?.photo_required && !photoData) || (geniusSettings.data?.office_locations?.length > 0 && !isWithinGeofence && !geofenceBypassed)"
			>
				{{ __("Confirm {0}", [nextAction === 'IN' ? __('Check In') : __('Check Out')]) }}
			</Button>
		</div>
	</ion-modal>
</template>

<script setup>
import { createResource, toast, FeatherIcon } from "frappe-ui"
import { computed, inject, ref, nextTick, onMounted, onBeforeUnmount, watch } from "vue"
import { IonModal, modalController } from "@ionic/vue"
import { getDeviceInfo, getDeviceFingerprint, saveOfflineCheckin, getOfflineCheckins, clearOfflineCheckins, initDeviceCrypto, signCheckin, getEnhancedFingerprint } from "@/data/genius"
import soundManager from "@/utils/sounds"

const employee = inject("$employee")
const dayjs = inject("$dayjs")
const __ = inject("$translate")

const showModal = ref(false)
const checkinTimestamp = ref(null)
const liveTime = ref(dayjs())
let clockTimer = null
const checkinSuccess = ref(false)
const confettiContainer = ref(null)
const latitude = ref(0)
const longitude = ref(0)
const locationLoading = ref(false)
const locationError = ref("")
const isWithinGeofence = ref(false)
const nearestLocation = ref("")
const distanceFromOffice = ref(0)
const showCamera = ref(false)
const photoData = ref(null)
const videoEl = ref(null)
const canvasEl = ref(null)
const submitting = ref(false)
const refreshing = ref(false)
const offlineCount = ref(0)
const gpsAccuracy = ref(null)
const isMockLocation = ref(false)
const verificationResult = ref(null)
const deviceRegistered = ref(null) // null = loading, true = registered, false = not registered
const devicePendingApproval = ref(false)
const deviceMismatch = ref(false) // approved device exists but current device doesn't match
let mediaStream = null

const deviceInfo = getDeviceInfo()

// ==========================================
// LIVE ELAPSED TIMER (Option A)
// ==========================================
const elapsedNow = ref(Date.now())
let elapsedTimer = null

const elapsedTime = computed(() => {
	if (!todayStatus.data?.first_check_in || !todayStatus.data?.is_checked_in) return "00:00:00"
	const checkIn = dayjs(todayStatus.data.first_check_in)
	if (!checkIn.isValid()) return "00:00:00"
	const now = dayjs(elapsedNow.value)
	const totalSec = Math.max(0, now.diff(checkIn, 'second'))
	const h = Math.floor(totalSec / 3600)
	const m = Math.floor((totalSec % 3600) / 60)
	const s = totalSec % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const shiftProgress = computed(() => {
	if (!todayStatus.data?.first_check_in || !todayStatus.data?.is_checked_in) return 0
	const checkIn = dayjs(todayStatus.data.first_check_in)
	if (!checkIn.isValid()) return 0
	const now = dayjs(elapsedNow.value)
	const elapsed = now.diff(checkIn, 'minute')
	// 10-hour ruler (600 min), cap at 100%
	return Math.min(100, Math.round((elapsed / 600) * 100))
})

function startElapsedTimer() {
	if (elapsedTimer) return
	elapsedNow.value = Date.now()
	elapsedTimer = setInterval(() => { elapsedNow.value = Date.now() }, 1000)
}

function stopElapsedTimer() {
	if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null }
}

// Start/stop timer based on check-in status
// Watch both is_checked_in AND first_check_in to catch all state changes
watch([() => todayStatus.data?.is_checked_in, () => todayStatus.data?.first_check_in], ([isCheckedIn, firstIn]) => {
	if (isCheckedIn && firstIn) startElapsedTimer()
	else if (!isCheckedIn) stopElapsedTimer()
}, { immediate: true })

// Safety net: assign camera stream when video element becomes available via ref
watch(videoEl, (el) => {
	if (el && mediaStream && !el.srcObject) {
		el.srcObject = mediaStream
	}
})

// API Resources
const geniusSettings = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.get_settings",
	auto: true,
	cache: "genius:settings",
})

const todayStatus = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.get_today_status",
	auto: true,
	cache: "genius:today_status",
	makeParams() {
		return { employee: employee.data?.name }
	},
	onSuccess(data) {
		// Restore last verification from today's logs so it persists across refreshes
		if (data?.last_verification && !verificationResult.value) {
			verificationResult.value = data.last_verification
		}
		// Ensure live timer starts when fresh data confirms user is checked in
		if (data?.is_checked_in && data?.first_check_in && !elapsedTimer) {
			startElapsedTimer()
		}
	},
})

const streaks = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_attendance_streaks",
	auto: true,
	cache: "genius:streaks",
	makeParams() {
		return { employee: employee.data?.name }
	},
})

const employeeInfo = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.get_employee_info",
	auto: true,
	cache: "genius:employee_info",
	onSuccess(data) {
		updateDeviceStatus(data)
	}
})

const nextAction = computed(() => {
	return todayStatus.data?.is_checked_in ? "OUT" : "IN"
})

const wifiVerified = computed(() => {
	if (!verificationResult.value) return false
	// Always use backend's wifi_matched (checks BSSID against office network)
	return !!verificationResult.value.wifi_matched
})

// WFH/Mission bypass - backend already validates approved Work Requests
const activeWorkRequest = computed(() => todayStatus.data?.approved_work_request || null)
const isWfhActive = computed(() => !!todayStatus.data?.is_wfh || activeWorkRequest.value?.request_type === "Work From Home")
const isMissionActive = computed(() => activeWorkRequest.value?.request_type === "Mission")
const geofenceBypassed = computed(() => isWfhActive.value || isMissionActive.value)

// Reactive device prompt - replaces broken setTimeout approach
const showDevicePrompt = computed(() => {
	if (!geniusSettings.data?.device_binding_enabled) return false
	if (deviceRegistered.value === null) return false // still loading
	if (devicePendingApproval.value) return false // pending shown separately
	return deviceRegistered.value === false
})

// Device binding can block check-in (managers bypass, same as backend)
const deviceBlocked = computed(() => {
	if (!geniusSettings.data?.device_binding_enabled) return false
	if (deviceRegistered.value === null) return false // still loading, don't block
	if (employeeInfo.data?.is_manager) return false // managers bypass device binding
	return devicePendingApproval.value || deviceRegistered.value === false || deviceMismatch.value
})

function updateDeviceStatus(data) {
	if (!data) data = employeeInfo.data
	if (!data) return

	if (!geniusSettings.data?.device_binding_enabled) {
		deviceRegistered.value = true // binding disabled = everyone OK
		devicePendingApproval.value = false
		deviceMismatch.value = false
		return
	}

	if (!data.device) {
		// No device binding at all
		deviceRegistered.value = false
		devicePendingApproval.value = false
		deviceMismatch.value = false
		return
	}

	const boundDeviceId = data.device.device_id
	const approvalStatus = data.device.approval_status

	if (approvalStatus === "Pending") {
		devicePendingApproval.value = true
		deviceRegistered.value = true
		deviceMismatch.value = false
	} else if (approvalStatus === "Approved") {
		devicePendingApproval.value = false
		if (boundDeviceId === deviceInfo.device_id) {
			deviceRegistered.value = true
			deviceMismatch.value = false
		} else {
			// Approved device exists but THIS browser/device doesn't match
			deviceRegistered.value = true
			deviceMismatch.value = true
		}
	} else if (approvalStatus === "Rejected") {
		devicePendingApproval.value = false
		deviceRegistered.value = false
		deviceMismatch.value = false
	}
}

// Re-evaluate device status when settings load (may load after employeeInfo)
watch(() => geniusSettings.data, () => {
	if (employeeInfo.data) updateDeviceStatus(employeeInfo.data)
})

async function refreshAll() {
	if (refreshing.value) return
	refreshing.value = true
	try {
		const minDelay = new Promise(r => setTimeout(r, 600))
		await Promise.all([
			todayStatus.reload(),
			streaks.reload(),
			geniusSettings.reload(),
			minDelay,
		])
	} catch (e) {
		console.error("Refresh failed:", e)
	}
	refreshing.value = false
}

function formatTime(timestamp) {
	if (!timestamp) return "--:--"
	return dayjs(timestamp).format("hh:mm A")
}

function formatHours(hours) {
	if (!hours) return "0h 0m"
	const h = Math.floor(hours)
	const m = Math.round((hours - h) * 60)
	return `${h}h ${m}m`
}

// ==========================================
// LOCATION
// ==========================================

function fetchLocation() {
	locationLoading.value = true
	locationError.value = ""

	if (!navigator.geolocation) {
		locationError.value = __("Geolocation not supported")
		locationLoading.value = false
		return
	}

	navigator.geolocation.getCurrentPosition(
		(position) => {
			latitude.value = position.coords.latitude
			longitude.value = position.coords.longitude
			gpsAccuracy.value = position.coords.accuracy

			// Detect mock location: accuracy < 1m is physically impossible for real GPS
			// Real GPS: 3-30m accuracy. Mock GPS tools often report 0-1m.
			isMockLocation.value = (position.coords.accuracy !== null && position.coords.accuracy < 1)

			// Check geofence against office locations
			checkGeofence()
			locationLoading.value = false
		},
		(error) => {
			locationError.value = __("Location access denied. Please enable GPS.")
			locationLoading.value = false
		},
		{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
	)
}

function checkGeofence() {
	const locations = geniusSettings.data?.office_locations || []
	let minDist = Infinity
	let closest = null

	for (const loc of locations) {
		const dist = haversineDistance(
			latitude.value, longitude.value,
			parseFloat(loc.latitude), parseFloat(loc.longitude)
		)
		if (dist < minDist) {
			minDist = dist
			closest = loc
		}
	}

	distanceFromOffice.value = Math.round(minDist)
	if (closest) {
		nearestLocation.value = closest.name || closest.location_name || __("Office")
		isWithinGeofence.value = minDist <= (parseFloat(closest.radius) || 100)
	}
}

function haversineDistance(lat1, lon1, lat2, lon2) {
	const R = 6371000
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLon = (lon2 - lon1) * Math.PI / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

// ==========================================
// CAMERA
// ==========================================

async function startCamera() {
	try {
		mediaStream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: "user", width: 640, height: 480 }
		})
		showCamera.value = true
		// Wait for Vue to render the video element (v-if="showCamera")
		await nextTick()
		// Retry assigning stream - video element may need extra time inside ion-modal
		const assignStream = () => {
			if (videoEl.value && mediaStream) {
				videoEl.value.srcObject = mediaStream
				return true
			}
			return false
		}
		if (!assignStream()) {
			// Retry with increasing delays for slow devices/modals
			for (const delay of [50, 150, 300, 500]) {
				await new Promise(r => setTimeout(r, delay))
				if (assignStream()) break
			}
		}
	} catch (err) {
		console.error("Camera start error:", err)
		showCamera.value = false
		toast({
			title: __("Error"),
			text: __("Camera access denied. Please allow camera permission."),
			icon: "alert-circle",
			position: "bottom-center",
			iconClasses: "text-red-500",
		})
	}
}

function capturePhoto() {
	if (!videoEl.value || !canvasEl.value) return
	const canvas = canvasEl.value
	// Use actual camera dimensions for correct aspect ratio
	const vw = videoEl.value.videoWidth || 640
	const vh = videoEl.value.videoHeight || 480
	canvas.width = vw
	canvas.height = vh
	const ctx = canvas.getContext("2d")
	// Mirror capture to match the mirrored video preview
	ctx.translate(vw, 0)
	ctx.scale(-1, 1)
	ctx.drawImage(videoEl.value, 0, 0, vw, vh)
	photoData.value = canvas.toDataURL("image/jpeg", 0.7)
	stopCamera()
}

function retakePhoto() {
	photoData.value = null
	startCamera()
}

function stopCamera() {
	showCamera.value = false
	if (mediaStream) {
		mediaStream.getTracks().forEach(track => track.stop())
		mediaStream = null
	}
}

// ==========================================
// WIFI NATIVE BRIDGE
// ==========================================

function _getWifiSSID() {
	// Priority: Android native bridge > window globals > null
	try {
		if (window.ICD3SNative && window.ICD3SNative.getWifiSSID) {
			const ssid = window.ICD3SNative.getWifiSSID()
			if (ssid && ssid !== "null" && ssid !== "<unknown ssid>") return ssid
		}
	} catch (e) { /* not in native app */ }
	return window.__icd3s_wifi_ssid || null
}

function _getWifiBSSID() {
	try {
		if (window.ICD3SNative && window.ICD3SNative.getWifiBSSID) {
			const bssid = window.ICD3SNative.getWifiBSSID()
			if (bssid && bssid !== "null" && bssid !== "02:00:00:00:00:00") return bssid
		}
	} catch (e) { /* not in native app */ }
	return window.__icd3s_wifi_bssid || null
}

// ==========================================
// CHECK-IN FLOW
// ==========================================

function openCheckinModal() {
	checkinTimestamp.value = dayjs().format("YYYY-MM-DD HH:mm:ss")
	liveTime.value = dayjs()
	clockTimer = setInterval(() => { liveTime.value = dayjs() }, 1000)
	showModal.value = true
	fetchLocation()
	startCamera()
}

async function submitCheckin() {
	submitting.value = true

	// Layer 3: Sign check-in with device crypto key
	const sigTimestamp = new Date().toISOString()
	const deviceSignature = await signCheckin(
		employee.data?.name,
		deviceInfo.device_id,
		sigTimestamp
	)

	const params = {
		employee: employee.data?.name,
		log_type: nextAction.value === "IN" ? "Check-in" : "Check-out",
		latitude: latitude.value,
		longitude: longitude.value,
		gps_accuracy: gpsAccuracy.value || 10,
		device_id: deviceInfo.device_id,
		device_name: deviceInfo.device_name,
		device_model: deviceInfo.device_model,
		os_version: deviceInfo.os_version,
		app_version: deviceInfo.app_version,
		// Anti-fraud params
		is_mock_location: isMockLocation.value ? 1 : 0,
		face_verified: photoData.value ? 1 : 0,
		face_confidence: photoData.value ? 0.8 : 0,
		// WiFi: Native bridge (Android app) > window globals > null (browser)
		wifi_ssid: _getWifiSSID(),
		wifi_bssid: _getWifiBSSID(),
		// Layer 3: Crypto signature
		device_signature: deviceSignature || null,
		signature_timestamp: deviceSignature ? sigTimestamp : null,
	}

	if (photoData.value) {
		params.photo = photoData.value
	}

	// Check if online
	if (!navigator.onLine) {
		// Save offline
		try {
			await saveOfflineCheckin(params)
			offlineCount.value++
			showModal.value = false
			toast({
				title: __("Saved Offline"),
				text: __("Will sync when connection restored"),
				icon: "wifi-off",
				position: "bottom-center",
				iconClasses: "text-orange-500",
			})
		} catch (err) {
			toast({
				title: __("Error"),
				text: __("Failed to save offline"),
				icon: "alert-circle",
				position: "bottom-center",
				iconClasses: "text-red-500",
			})
		}
		submitting.value = false
		stopCamera()
		return
	}

	// Online check-in
	const checkinResource = createResource({
		url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.check_in",
	})

	const wasCheckIn = nextAction.value === "IN"

	try {
		await checkinResource.submit(params)
		const result = checkinResource.data

		showModal.value = false
		stopCamera()
		photoData.value = null

		// Store verification result for display
		verificationResult.value = {
			location_name: result?.location_name,
			is_within_geofence: result?.is_within_geofence,
			face_verified: result?.face_verified,
			wifi_matched: result?.wifi_matched,
			fraud_score: result?.fraud_score || 0,
			fraud_flags: result?.fraud_flags || "",
			compliance_warnings: result?.compliance_warnings || [],
			timestamp: result?.timestamp,
		}

		// Verification result stays visible until next check-in or page refresh

		// Play sound based on action
		if (wasCheckIn) {
			soundManager.playCheckIn()
		} else {
			soundManager.playCheckOut()
		}

		// Show success animation on button
		checkinSuccess.value = true
		setTimeout(() => { checkinSuccess.value = false }, 2000)

		const actionLabel = wasCheckIn ? __("Check-in") : __("Check-out")

		toast({
			title: __("Success"),
			text: `${actionLabel} ${__("successful!")} ${result?.location_name ? "@ " + result.location_name : ""}`,
			icon: "check-circle",
			position: "bottom-center",
			iconClasses: "text-green-500",
		})

		// Reload status
		await todayStatus.reload()
		await streaks.reload()

		// Check for streak milestone - confetti on 7, 14, 21, 30 day streaks
		const currentStreak = streaks.data?.current_streak || 0
		if (wasCheckIn && (currentStreak === 7 || currentStreak === 14 || currentStreak === 21 || currentStreak === 30 || currentStreak === 50 || currentStreak === 100)) {
			soundManager.playStreakMilestone()
			if (soundManager.isConfettiEnabled()) {
				triggerConfetti()
			}
		}

	} catch (error) {
		const messages = error?.messages || [error?.message || __("Check-in failed")]
		for (const msg of messages) {
			toast({
				title: __("Error"),
				text: msg,
				icon: "alert-circle",
				position: "bottom-center",
				iconClasses: "text-red-500",
			})
		}
	}

	submitting.value = false
}

// ==========================================
// OFFLINE SYNC
// ==========================================

async function syncOfflineCheckins() {
	const records = await getOfflineCheckins()
	if (!records || records.length === 0) return

	if (!navigator.onLine) return

	try {
		const syncResource = createResource({
			url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.sync_offline",
		})

		await syncResource.submit({ records: JSON.stringify(records) })
		await clearOfflineCheckins()
		offlineCount.value = 0

		toast({
			title: __("Synced"),
			text: __("{0} offline records synced", [records.length]),
			icon: "check-circle",
			position: "bottom-center",
			iconClasses: "text-green-500",
		})

		todayStatus.reload()
	} catch (err) {
		console.error("Offline sync failed:", err)
	}
}

// ==========================================
// CONFETTI ANIMATION
// ==========================================

function triggerConfetti() {
	const colors = ['#4D067B', '#7B2FA0', '#a86cc9', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']
	const container = confettiContainer.value || document.body

	for (let i = 0; i < 40; i++) {
		const piece = document.createElement('div')
		piece.className = 'confetti-piece'
		piece.style.left = Math.random() * 100 + 'vw'
		piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
		piece.style.animationDelay = Math.random() * 0.5 + 's'
		piece.style.animationDuration = (2 + Math.random() * 1.5) + 's'
		piece.style.width = (6 + Math.random() * 6) + 'px'
		piece.style.height = (6 + Math.random() * 6) + 'px'
		document.body.appendChild(piece)
		setTimeout(() => piece.remove(), 3500)
	}
}

// ==========================================
// LIFECYCLE
// ==========================================

async function autoRegisterDevice() {
	try {
		// Layer 2+3: Generate crypto key pair and enhanced fingerprint
		const [publicKeyJwk, fpHash] = await Promise.all([
			initDeviceCrypto(),
			getEnhancedFingerprint(),
		])

		const regResource = createResource({
			url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.register_device",
		})
		const result = await regResource.submit({
			employee: employee.data?.name,
			device_id: deviceInfo.device_id,
			device_name: deviceInfo.device_name,
			device_model: deviceInfo.device_model,
			os_version: deviceInfo.os_version,
			app_version: deviceInfo.app_version,
			device_public_key: publicKeyJwk ? JSON.stringify(publicKeyJwk) : null,
			fingerprint_hash: fpHash || null,
		})

		const approvalStatus = regResource.data?.approval_status || result?.approval_status

		if (approvalStatus === "Pending" || approvalStatus === "already_pending") {
			deviceRegistered.value = true
			devicePendingApproval.value = true
			deviceMismatch.value = false
			toast({
				title: __("Device Registered"),
				text: __("Waiting for HR approval. You'll be notified when approved."),
				icon: "clock",
				position: "bottom-center",
				iconClasses: "text-amber-500",
			})
		} else if (approvalStatus === "Approved") {
			deviceRegistered.value = true
			devicePendingApproval.value = false
			deviceMismatch.value = false
			toast({
				title: __("Device Active"),
				text: __("Your device is approved and ready for check-in."),
				icon: "check-circle",
				position: "bottom-center",
				iconClasses: "text-green-500",
			})
		}

		// Refresh device status from server
		await employeeInfo.reload()
	} catch (err) {
		console.error("Device registration failed:", err)
		const errMsg = err?.exc_type || err?.message || err?.messages?.[0] || String(err)
		if (errMsg.includes("already registered")) {
			toast({
				title: __("Device Error"),
				text: __("This device is registered to another employee. Contact HR."),
				icon: "alert-circle",
				position: "bottom-center",
				iconClasses: "text-red-500",
			})
		} else {
			toast({
				title: __("Registration Failed"),
				text: errMsg.length > 100 ? errMsg.substring(0, 100) + "..." : errMsg,
				icon: "alert-circle",
				position: "bottom-center",
				iconClasses: "text-red-500",
			})
		}
	}
}

onMounted(async () => {
	// Check offline queue
	const records = await getOfflineCheckins()
	offlineCount.value = records?.length || 0

	// Auto-sync when online
	window.addEventListener("online", syncOfflineCheckins)

	// Try sync now
	if (navigator.onLine && offlineCount.value > 0) {
		syncOfflineCheckins()
	}

	// Safety net: ensure live timer starts if user is already checked in (cache or delayed load)
	const ensureTimer = () => {
		if (todayStatus.data?.is_checked_in && todayStatus.data?.first_check_in && !elapsedTimer) {
			startElapsedTimer()
		}
	}
	// Check immediately, then retry at multiple intervals to catch all loading scenarios
	ensureTimer()
	setTimeout(ensureTimer, 1000)
	setTimeout(ensureTimer, 3000)
	setTimeout(ensureTimer, 5000)

	// Device status is now reactive via computed showDevicePrompt + watch on geniusSettings
})

onBeforeUnmount(() => {
	stopCamera()
	stopElapsedTimer()
	if (clockTimer) clearInterval(clockTimer)
	window.removeEventListener("online", syncOfflineCheckins)
})

watch(showModal, (val) => {
	if (!val && clockTimer) { clearInterval(clockTimer); clockTimer = null }
})
</script>

<style scoped>
/* ICD Branding - Purple #4D067B */
.genius-btn {
	border: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.genius-btn:active {
	transform: scale(0.97);
}
.genius-btn-in {
	background: linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%) !important;
	color: white !important;
	box-shadow: 0 4px 14px -2px rgba(5, 150, 105, 0.4) !important;
}
.genius-btn-out {
	background: linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%) !important;
	color: white !important;
	box-shadow: 0 4px 14px -2px rgba(220, 38, 38, 0.4) !important;
}
.genius-btn-success {
	background: linear-gradient(135deg, #059669 0%, #10B981 100%) !important;
	animation: none !important;
	box-shadow: 0 0 0 0 transparent !important;
}
.genius-btn-disabled {
	background: linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%) !important;
	color: white !important;
	box-shadow: none !important;
	cursor: not-allowed !important;
	opacity: 0.7;
}

/* Live Timer Button */
.genius-timer-btn {
	position: relative;
	overflow: hidden;
	border-radius: 0.85rem;
	background: linear-gradient(135deg, #991b1b 0%, #DC2626 40%, #EF4444 100%);
	box-shadow: 0 4px 18px -2px rgba(220, 38, 38, 0.45), 0 1px 3px rgba(0,0,0,0.1);
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	transition: transform 0.15s ease;
}
.genius-timer-btn:active:not(.genius-timer-disabled) {
	transform: scale(0.97);
}
.genius-timer-disabled {
	opacity: 0.55;
	cursor: not-allowed;
}
/* Progress fill with glow edge */
.timer-progress {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 100%);
	border-right: 2px solid rgba(255, 255, 255, 0.35);
	box-shadow: inset -4px 0 12px rgba(255,255,255,0.08);
	transition: width 1s linear;
	pointer-events: none;
}
/* Ruler with hour markers - white, visible */
.timer-ruler {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 18px;
	pointer-events: none;
	z-index: 1;
}
.ruler-mark {
	position: absolute;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
}
.ruler-tick {
	width: 1.5px;
	height: 8px;
	background: rgba(255, 255, 255, 0.7);
	border-radius: 1px;
}
.ruler-label {
	font-size: 8px;
	font-weight: 800;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1;
	margin-top: 1px;
	font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}
/* Overtime zone (9H-10H) */
.ruler-overtime-zone {
	position: absolute;
	left: 80%;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(245, 158, 11, 0.15);
	border-left: 1px dashed rgba(245, 158, 11, 0.5);
}
.ruler-overtime .ruler-tick {
	background: rgba(245, 158, 11, 0.9);
}
.ruler-overtime .ruler-label {
	color: rgba(245, 158, 11, 0.9);
}
/* Main content - centered */
.timer-content {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10px 14px 22px;
	z-index: 2;
}
.timer-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}
.timer-elapsed {
	font-size: 28px;
	font-weight: 800;
	color: white;
	letter-spacing: -0.02em;
	line-height: 1.1;
	font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
	text-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.timer-since-left {
	position: absolute;
	left: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1px;
}
.timer-since-label {
	font-size: 7px;
	font-weight: 800;
	color: rgba(255, 255, 255, 0.45);
	letter-spacing: 0.08em;
}
.timer-since-time {
	font-size: 11px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}
.timer-checkout-btn {
	position: absolute;
	right: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 3px;
	color: rgba(255, 255, 255, 0.92);
}
.timer-checkout-text {
	font-size: 8px;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.8;
}
.timer-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #fff;
	animation: timer-pulse 1.5s ease-in-out infinite;
	box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}
@keyframes timer-pulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.4; transform: scale(0.8); }
}

/* Streak Badge */
.streak-badge {
	background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Refresh Button */
.genius-refresh {
	width: 26px;
	height: 26px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
	color: #6b7280;
	cursor: pointer;
	transition: all 0.25s ease;
}
.genius-refresh:active {
	transform: scale(0.88);
	background: linear-gradient(135deg, #e5e7eb, #d1d5db);
}
.genius-refresh.is-refreshing {
	background: linear-gradient(135deg, #ede9fe, #ddd6fe);
	color: #4D067B;
}
.genius-refresh.is-refreshing svg {
	animation: genius-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes genius-spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
