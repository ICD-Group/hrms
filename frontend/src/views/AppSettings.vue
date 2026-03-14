<template>
	<ion-page>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-screen w-full">
				<div class="w-full">
					<header class="flex flex-row glass-header py-4 px-3 items-center justify-between sticky top-0 z-10">
						<div class="flex flex-row items-center">
							<button class="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" @click="router.back()">
								<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700 dark:text-gray-300" />
							</button>
							<h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ __("Settings") }}</h2>
						</div>
					</header>

					<div class="flex flex-col gap-5 my-4 w-full p-4">

						<!-- APPEARANCE -->
						<div>
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Appearance") }}</div>
							<div class="settings-card">
								<div class="settings-row">
									<div class="settings-icon bg-gray-800">
										<FeatherIcon name="moon" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Dark Mode") }}</div>
										<div class="settings-sub">{{ __("Reduce eye strain in low light") }}</div>
									</div>
									<Switch :modelValue="!!darkMode" size="md" @update:modelValue="toggleDarkMode" />
								</div>
							</div>
						</div>

						<!-- PUSH NOTIFICATIONS (System) -->
						<div>
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("System Notifications") }}</div>
							<div class="settings-card">
								<div class="settings-row">
									<div class="settings-icon bg-red-500">
										<FeatherIcon name="bell" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Push Notifications") }}</div>
										<div v-if="pushDescription" class="settings-sub text-red-400">{{ pushDescription }}</div>
										<div v-else class="settings-sub">{{ __("System push alerts") }}</div>
									</div>
									<div class="flex items-center gap-2">
										<LoadingIndicator v-if="pushLoading" class="w-4 h-4 text-gray-600" />
										<Switch :modelValue="!!pushState" :disabled="pushDisabled" size="md" @update:modelValue="togglePush(!pushState)" />
									</div>
								</div>
							</div>
						</div>

						<!-- NOTIFICATION ALERTS (API-backed) -->
						<div v-if="prefsLoaded">
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Notification Alerts") }}</div>
							<div class="settings-card">
								<div class="settings-row" v-for="(item, idx) in alertItems" :key="item.key"
									:class="{ 'border-t border-gray-100 dark:border-gray-700': idx > 0 }">
									<div class="settings-icon" :class="item.bg">
										<FeatherIcon :name="item.icon" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __(item.label) }}</div>
										<div class="settings-sub">{{ __(item.sub) }}</div>
									</div>
									<Switch :modelValue="!!prefs[item.key]" size="md" @update:modelValue="prefs[item.key] = prefs[item.key] ? 0 : 1" />
								</div>
							</div>
						</div>

						<!-- CHANNELS -->
						<div v-if="prefsLoaded">
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Channels") }}</div>
							<div class="settings-card">
								<div class="settings-row">
									<div class="settings-icon" style="background:#4D067B">
										<FeatherIcon name="smartphone" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0"><div class="settings-label">{{ __("Push") }}</div></div>
									<Switch :modelValue="!!prefs.push_notifications" size="md" @update:modelValue="prefs.push_notifications = prefs.push_notifications ? 0 : 1" />
								</div>
								<div class="settings-row border-t border-gray-100 dark:border-gray-700">
									<div class="settings-icon bg-blue-500">
										<FeatherIcon name="mail" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0"><div class="settings-label">{{ __("Email") }}</div></div>
									<Switch :modelValue="!!prefs.email_notifications" size="md" @update:modelValue="prefs.email_notifications = prefs.email_notifications ? 0 : 1" />
								</div>
								<div class="settings-row border-t border-gray-100 dark:border-gray-700">
									<div class="settings-icon bg-green-500">
										<FeatherIcon name="message-circle" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0"><div class="settings-label">{{ __("WhatsApp") }}</div></div>
									<Switch :modelValue="!!prefs.whatsapp_notifications" size="md" @update:modelValue="prefs.whatsapp_notifications = prefs.whatsapp_notifications ? 0 : 1" />
								</div>
							</div>
						</div>

						<!-- QUIET HOURS -->
						<div v-if="prefsLoaded">
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Quiet Hours") }}</div>
							<div class="settings-card">
								<div class="settings-row">
									<div class="settings-icon bg-indigo-500">
										<FeatherIcon name="moon" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Enable Quiet Hours") }}</div>
										<div class="settings-sub">{{ __("Mute during set hours") }}</div>
									</div>
									<Switch :modelValue="!!prefs.quiet_hours_enabled" size="md" @update:modelValue="prefs.quiet_hours_enabled = prefs.quiet_hours_enabled ? 0 : 1" />
								</div>
								<div v-if="prefs.quiet_hours_enabled" class="border-t border-gray-100 dark:border-gray-700 p-4 grid grid-cols-2 gap-3">
									<div>
										<label class="text-xs text-gray-700 mb-1 block">{{ __("From") }}</label>
										<input type="time" v-model="prefs.quiet_start" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
									</div>
									<div>
										<label class="text-xs text-gray-700 mb-1 block">{{ __("To") }}</label>
										<input type="time" v-model="prefs.quiet_end" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
									</div>
								</div>
							</div>
						</div>

						<!-- REMINDER TIMES -->
						<div v-if="prefsLoaded">
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Reminder Times") }}</div>
							<div class="settings-card p-4 grid grid-cols-2 gap-3">
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-in") }}</label>
									<input type="time" v-model="prefs.checkin_reminder_time" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-out") }}</label>
									<input type="time" v-model="prefs.checkout_reminder_time" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
							</div>
						</div>

						<!-- SAVE PREFERENCES -->
						<button
							v-if="prefsLoaded"
							@click="savePrefs"
							:disabled="isSaving"
							class="w-full text-white rounded-xl py-3.5 font-bold text-sm shadow-md disabled:opacity-50 transition-all active:scale-[0.97]"
							style="background:#4D067B"
						>
							{{ isSaving ? __("Saving...") : __("Save Preferences") }}
						</button>

						<!-- SOUNDS & FEEDBACK -->
						<div v-if="hasSounds">
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("Sounds & Feedback") }}</div>
							<div class="settings-card">
								<div class="settings-row">
									<div class="settings-icon bg-orange-500">
										<FeatherIcon name="volume-2" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Sound Effects") }}</div>
										<div class="settings-sub">{{ __("Check-in & check-out chimes") }}</div>
									</div>
									<Switch :modelValue="!!soundsOn" size="md" @update:modelValue="toggleSounds" />
								</div>

								<div v-if="soundsOn" class="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
									<div class="flex items-center justify-between text-xs text-gray-700 mb-2">
										<span>{{ __("Volume") }}</span>
										<span class="font-medium" style="color:#4D067B">{{ Math.round(sndVolume * 100) }}%</span>
									</div>
									<input type="range" min="0" max="100" :value="sndVolume * 100" @input="setVol($event.target.value / 100)" class="w-full h-1.5 rounded-full appearance-none cursor-pointer" style="accent-color:#4D067B" />
								</div>

								<div class="settings-row border-t border-gray-100 dark:border-gray-700">
									<div class="settings-icon bg-purple-500">
										<FeatherIcon name="mouse-pointer" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Tap Sounds") }}</div>
										<div class="settings-sub">{{ __("Subtle clicks on button taps") }}</div>
									</div>
									<Switch :modelValue="!!tapOn" size="md" @update:modelValue="toggleTap" />
								</div>

								<div class="settings-row border-t border-gray-100 dark:border-gray-700">
									<div class="settings-icon bg-pink-500">
										<FeatherIcon name="zap" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Haptic Feedback") }}</div>
										<div class="settings-sub">{{ __("Vibration on actions") }}</div>
									</div>
									<Switch :modelValue="!!hapticOn" size="md" @update:modelValue="toggleHaptic" />
								</div>

								<div class="settings-row border-t border-gray-100 dark:border-gray-700">
									<div class="settings-icon bg-yellow-500">
										<FeatherIcon name="star" class="w-4 h-4 text-white" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="settings-label">{{ __("Celebrations") }}</div>
										<div class="settings-sub">{{ __("Confetti on streak milestones") }}</div>
									</div>
									<Switch :modelValue="!!confettiOn" size="md" @update:modelValue="toggleConfetti" />
								</div>
							</div>
						</div>

						<!-- ABOUT -->
						<div>
							<div class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">{{ __("About") }}</div>
							<div class="settings-card p-4">
								<div class="flex justify-between text-sm text-gray-700 py-1">
									<span>{{ __("Version") }}</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">v6.0.0</span>
								</div>
								<div class="flex justify-between text-sm text-gray-700 py-1">
									<span>{{ __("Build") }}</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">2026-02-14</span>
								</div>
							</div>
						</div>

						<!-- RESET -->
						<button @click="resetAll" class="text-xs text-gray-600 text-center py-2 active:text-gray-600 transition-colors">
							{{ __("Reset All Settings to Default") }}
						</button>

						<div class="h-8"></div>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { useRouter } from "vue-router"
import { FeatherIcon, Switch, toast, LoadingIndicator } from "frappe-ui"
import { computed, inject, ref, reactive, onMounted, watch } from "vue"
import soundManager from "@/utils/sounds"

// Use frappe-ui Switch component (proper iOS-style toggle)

const __ = inject("$translate")
const employee = inject("$employee")
const router = useRouter()

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// ===== DARK MODE =====
const darkMode = ref(false)
try { darkMode.value = localStorage.getItem("icd3s_dark_mode") === "1" } catch(e) {}

function toggleDarkMode() {
	darkMode.value = !darkMode.value
	try { localStorage.setItem("icd3s_dark_mode", darkMode.value ? "1" : "0") } catch(e) {}
	applyDark()
}

function applyDark() {
	try {
		if (darkMode.value) document.documentElement.classList.add("dark")
		else document.documentElement.classList.remove("dark")
	} catch(e) {}
}

// ===== PUSH NOTIFICATIONS (VAPID Web Push) =====
const pushState = ref(false)
const pushLoading = ref(false)

// Check current push subscription status
if ("serviceWorker" in navigator && "PushManager" in window) {
	navigator.serviceWorker.ready.then(reg => {
		reg.pushManager.getSubscription().then(sub => { pushState.value = !!sub }).catch(() => {})
	}).catch(() => {})
}

const pushDisabled = computed(() => {
	try {
		return !("PushManager" in window && "serviceWorker" in navigator) || pushLoading.value
	} catch(e) { return true }
})

const pushDescription = computed(() => {
	try {
		if (!("PushManager" in window)) return __("Push not supported in this browser")
		if (!("serviceWorker" in navigator)) return __("Service worker not available")
		return ""
	} catch(e) { return "" }
})

function _b64ToUint8(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = atob(base64)
	const out = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i)
	return out
}

async function togglePush(newVal) {
	pushLoading.value = true
	try {
		const reg = await navigator.serviceWorker.ready
		if (newVal) {
			let perm = Notification.permission
			if (perm === "default") perm = await Notification.requestPermission()
			if (perm !== "granted") { pushState.value = false; return }
			const resp = await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.get_vapid_public_key", {
				headers: { "X-Frappe-CSRF-Token": window.csrf_token || "" }
			})
			const data = await resp.json()
			const vapidKey = data.message?.public_key
			if (!vapidKey) { pushState.value = false; return }
			const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _b64ToUint8(vapidKey) })
			const ua = navigator.userAgent
			await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.save_subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": window.csrf_token || "" },
				body: JSON.stringify({
					subscription_json: JSON.stringify(sub.toJSON()),
					browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Other",
					device_type: /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop",
				}),
			})
			pushState.value = true
		} else {
			const sub = await reg.pushManager.getSubscription()
			if (sub) await sub.unsubscribe()
			pushState.value = false
		}
	} catch(e) {
		_errToast(e, "Failed to toggle push notifications")
	} finally {
		pushLoading.value = false
	}
}

// ===== NOTIFICATION PREFERENCES (API-backed, LAZY load) =====
const prefsLoaded = ref(false)
const isSaving = ref(false)

const prefs = reactive({
	checkin_reminder: 1, checkout_reminder: 1,
	checkin_reminder_time: "08:45:00", checkout_reminder_time: "16:45:00",
	late_warning_alert: 1, penalty_alert: 1, overtime_alert: 1,
	leave_status_alert: 1, salary_ready_alert: 1, commission_alert: 1,
	monthly_summary_alert: 1, push_notifications: 1, email_notifications: 1,
	whatsapp_notifications: 0, quiet_hours_enabled: 0,
	quiet_start: "22:00:00", quiet_end: "07:00:00",
})

const alertItems = [
	{ key: "checkin_reminder", label: "Check-in Reminder", sub: "Before shift starts", icon: "log-in", bg: "bg-green-500" },
	{ key: "checkout_reminder", label: "Check-out Reminder", sub: "Before shift ends", icon: "log-out", bg: "bg-blue-500" },
	{ key: "late_warning_alert", label: "Late Warning", sub: "When running late", icon: "clock", bg: "bg-orange-500" },
	{ key: "penalty_alert", label: "Penalty Alert", sub: "When penalty recorded", icon: "alert-triangle", bg: "bg-red-500" },
	{ key: "overtime_alert", label: "Overtime Alert", sub: "OT approval updates", icon: "trending-up", bg: "bg-purple-500" },
	{ key: "leave_status_alert", label: "Leave Status", sub: "Application updates", icon: "calendar", bg: "bg-teal-500" },
	{ key: "salary_ready_alert", label: "Salary Ready", sub: "Slip available", icon: "dollar-sign", bg: "bg-emerald-500" },
	{ key: "commission_alert", label: "Commission Alert", sub: "New commissions", icon: "gift", bg: "bg-pink-500" },
	{ key: "monthly_summary_alert", label: "Monthly Summary", sub: "End of month report", icon: "bar-chart-2", bg: "bg-indigo-500" },
]

async function loadPrefs() {
	try {
		const empName = employee?.data?.name
		if (!empName) { prefsLoaded.value = true; return }
		const res = await fetch(`/api/method/icd3s_attendance.icd3s_attendance.api.modules.profile.get_notification_preferences?employee=${encodeURIComponent(empName)}`, {
			headers: { "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "", "Accept": "application/json" },
		})
		if (res.ok) {
			const json = await res.json()
			if (json?.message?.preferences) Object.assign(prefs, json.message.preferences)
		}
	} catch(e) {
		_errToast(e, "Failed to load notification preferences")
	}
	prefsLoaded.value = true
}

async function savePrefs() {
	isSaving.value = true
	try {
		const empName = employee?.data?.name
		if (!empName) { toast({ title: __("Error"), text: __("Employee not found"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" }); return }
		const res = await fetch("/api/method/icd3s_attendance.icd3s_attendance.api.modules.profile.update_notification_preferences", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "", "Accept": "application/json" },
			body: JSON.stringify({ employee: empName, preferences: JSON.stringify(prefs) }),
		})
		if (res.ok) {
			toast({ title: __("Saved"), text: __("Preferences updated"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		} else {
			toast({ title: __("Error"), text: __("Failed to save"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		}
	} catch(e) {
		_errToast(e, "Failed to save preferences")
	} finally {
		isSaving.value = false
	}
}

// ===== SOUNDS & FEEDBACK (localStorage) =====
const hasSounds = ref(false)
const soundsOn = ref(true)
const sndVolume = ref(0.5)
const tapOn = ref(true)
const hapticOn = ref(true)
const confettiOn = ref(true)
let _sm = null

function initSounds() {
	try {
		_sm = soundManager
		if (_sm && typeof _sm.isEnabled === "function") {
			hasSounds.value = true
			soundsOn.value = _sm.isEnabled()
			sndVolume.value = _sm.getVolume()
			tapOn.value = _sm.isTapSoundsEnabled()
			hapticOn.value = _sm.isHapticEnabled()
			confettiOn.value = _sm.isConfettiEnabled()
		}
	} catch(e) {
		console.warn("[Settings] SoundManager not available:", e)
		hasSounds.value = false
	}
}

function toggleSounds() { soundsOn.value = !soundsOn.value; try { _sm?.setEnabled(soundsOn.value) } catch(e) {} }
function setVol(v) { sndVolume.value = v; try { _sm?.setVolume(v) } catch(e) {} }
function toggleTap() { tapOn.value = !tapOn.value; try { _sm?.setTapSoundsEnabled(tapOn.value) } catch(e) {} }
function toggleHaptic() { hapticOn.value = !hapticOn.value; try { _sm?.setHapticEnabled(hapticOn.value) } catch(e) {} }
function toggleConfetti() { confettiOn.value = !confettiOn.value; try { _sm?.setConfettiEnabled(confettiOn.value) } catch(e) {} }

// ===== RESET =====
function resetAll() {
	darkMode.value = false
	try { localStorage.setItem("icd3s_dark_mode", "0") } catch(e) {}
	applyDark()
	try { _sm?.setEnabled(true); _sm?.setVolume(0.5); _sm?.setTapSoundsEnabled(true); _sm?.setHapticEnabled(true); _sm?.setConfettiEnabled(true) } catch(e) {}
	soundsOn.value = true; sndVolume.value = 0.5; tapOn.value = true; hapticOn.value = true; confettiOn.value = true
	toast({ title: __("Reset"), text: __("All settings restored to defaults"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
}

// ===== MOUNT =====
onMounted(() => {
	applyDark()
	initSounds()
	loadPrefs()
})

// Watch for employee data loading (retry prefs load)
watch(() => employee?.data?.name, (newVal, oldVal) => {
	if (newVal && !oldVal) loadPrefs()
})
</script>

<style scoped>
.settings-card {
	background: rgba(255, 255, 255, 0.45);
	border-radius: 0.85rem;
	border: 0.5px solid rgba(255, 255, 255, 0.65);
	box-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.04);
	overflow: hidden;
}
:global(.dark) .settings-card {
	background: rgba(30, 30, 46, 0.45);
	border-color: rgba(255, 255, 255, 0.06);
}
.settings-row {
	display: flex;
	align-items: center;
	padding: 0.85rem 1rem;
	gap: 0.75rem;
}
.settings-icon {
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.settings-label {
	font-size: 0.875rem;
	font-weight: 500;
	color: #1f2937;
}
:global(.dark) .settings-label {
	color: #e5e7eb;
}
.settings-sub {
	font-size: 0.7rem;
	color: #9ca3af;
	margin-top: 1px;
}

/* frappe-ui Switch - scale up for mobile touch targets */
.settings-row :deep(button[role="switch"]) {
	transform: scale(1.5);
	transform-origin: center right;
	margin-right: 4px;
}
/* ICD Purple when ON */
.settings-row :deep(button[role="switch"][aria-checked="true"]) {
	background-color: #4D067B !important;
}
:global(.dark) .settings-row :deep(button[role="switch"][aria-checked="true"]) {
	background-color: #a86cc9 !important;
}
</style>
