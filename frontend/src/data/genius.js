import { createResource } from "frappe-ui"

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

// ==========================================
// CHECK-IN API
// ==========================================

export function geniusCheckIn(params) {
	return createResource({
		url: `${API_BASE}.checkin.check_in`,
		makeParams() {
			return params
		},
	})
}

export function geniusSyncOffline(records) {
	return createResource({
		url: `${API_BASE}.checkin.sync_offline`,
		makeParams() {
			return { records: JSON.stringify(records) }
		},
	})
}

export function getTodayStatus(employee) {
	return createResource({
		url: `${API_BASE}.checkin.get_today_status`,
		auto: true,
		cache: `genius:today_status:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

export function getAttendanceHistory(employee, from_date, to_date) {
	return createResource({
		url: `${API_BASE}.checkin.get_attendance_history`,
		makeParams() {
			return { employee, from_date, to_date }
		},
	})
}

export function getGeniusSettings() {
	return createResource({
		url: `${API_BASE}.checkin.get_settings`,
		auto: true,
		cache: "genius:settings",
	})
}

export function getEmployeeInfo() {
	return createResource({
		url: `${API_BASE}.checkin.get_employee_info`,
		auto: true,
		cache: "genius:employee_info",
	})
}

export function registerDevice(params) {
	return createResource({
		url: `${API_BASE}.checkin.register_device`,
		makeParams() {
			return params
		},
	})
}

// ==========================================
// GAMIFICATION API
// ==========================================

export function getStreaks(employee) {
	return createResource({
		url: `${API_BASE}.gamification.get_attendance_streaks`,
		auto: true,
		cache: `genius:streaks:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

export function getBadges(employee, include_available = true) {
	return createResource({
		url: `${API_BASE}.gamification.get_badges`,
		auto: true,
		cache: `genius:badges:${employee}`,
		makeParams() {
			return { employee, include_available: include_available ? 1 : 0 }
		},
	})
}

export function getPoints(employee, months = 6) {
	return createResource({
		url: `${API_BASE}.gamification.get_points`,
		auto: true,
		cache: `genius:points:${employee}`,
		makeParams() {
			return { employee, months }
		},
	})
}

export function getLeaderboard(period = "monthly", month, year, limit = 20) {
	return createResource({
		url: `${API_BASE}.gamification.get_leaderboard`,
		auto: true,
		cache: `genius:leaderboard:${period}:${month}:${year}`,
		makeParams() {
			return { period, month, year, limit }
		},
	})
}

export function getTeamChallenges(department) {
	return createResource({
		url: `${API_BASE}.gamification.get_team_challenges`,
		auto: true,
		cache: `genius:team_challenges:${department}`,
		makeParams() {
			return { department }
		},
	})
}

export function getPersonalAnalytics(employee, months = 6) {
	return createResource({
		url: `${API_BASE}.gamification.get_personal_analytics`,
		auto: true,
		cache: `genius:analytics:${employee}`,
		makeParams() {
			return { employee, months }
		},
	})
}

export function getAchievementNotifications(employee, mark_read = false) {
	return createResource({
		url: `${API_BASE}.gamification.get_achievement_notifications`,
		auto: true,
		cache: `genius:achievements:${employee}`,
		makeParams() {
			return { employee, mark_read: mark_read ? 1 : 0 }
		},
	})
}

export function getRewardsCatalog() {
	return createResource({
		url: `${API_BASE}.gamification.get_rewards_catalog`,
		auto: true,
		cache: "genius:rewards",
	})
}

// ==========================================
// AI INTELLIGENCE API
// ==========================================

export function getAbsencePrediction(employee) {
	return createResource({
		url: `${API_BASE}.ai_intelligence.get_absence_prediction`,
		auto: true,
		cache: `genius:ai:absence:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

export function getBurnoutRisk(employee) {
	return createResource({
		url: `${API_BASE}.ai_intelligence.get_burnout_risk`,
		auto: true,
		cache: `genius:ai:burnout:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

// ==========================================
// COMPLIANCE API
// ==========================================

export function getComplianceStatus(employee) {
	return createResource({
		url: `${API_BASE}.compliance.get_compliance_status`,
		auto: true,
		cache: `genius:compliance:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

export function getDataPrivacyStatus(employee) {
	return createResource({
		url: `${API_BASE}.compliance.get_data_privacy_status`,
		auto: true,
		cache: `genius:privacy:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

export function submitBiometricConsent(consent_type, device_info) {
	return createResource({
		url: `${API_BASE}.compliance.submit_biometric_consent`,
		makeParams() {
			return { consent_type, device_info: JSON.stringify(device_info) }
		},
	})
}

export function exportMyData() {
	return createResource({
		url: `${API_BASE}.compliance.export_my_data`,
	})
}

// ==========================================
// PROFILE API
// ==========================================

export function updateProfile(employee, data) {
	return createResource({
		url: `${API_BASE}.profile.update_profile`,
		makeParams() {
			return { employee, ...data }
		},
	})
}

export function getEmergencyContacts(employee) {
	return createResource({
		url: `${API_BASE}.profile.get_emergency_contacts`,
		auto: true,
		cache: `genius:emergency:${employee}`,
		makeParams() {
			return { employee }
		},
	})
}

// ==========================================
// OFFLINE QUEUE (IndexedDB)
// ==========================================

const DB_NAME = "genius_attendance"
const DB_VERSION = 1
const STORE_NAME = "offline_checkins"

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = (event) => {
			const db = event.target.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
			}
		}
	})
}

export async function saveOfflineCheckin(data) {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite")
		const store = tx.objectStore(STORE_NAME)
		data.offline_timestamp = new Date().toISOString()
		data.is_offline = 1
		const request = store.add(data)
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function getOfflineCheckins() {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly")
		const store = tx.objectStore(STORE_NAME)
		const request = store.getAll()
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function clearOfflineCheckins() {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite")
		const store = tx.objectStore(STORE_NAME)
		const request = store.clear()
		request.onsuccess = () => resolve()
		request.onerror = () => reject(request.error)
	})
}

// ==========================================
// DEVICE CRYPTO BINDING (Layer 3 Security)
// ==========================================

const CRYPTO_DB_NAME = "genius_crypto"
const CRYPTO_DB_VERSION = 1
const CRYPTO_STORE = "keys"

function openCryptoDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(CRYPTO_DB_NAME, CRYPTO_DB_VERSION)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = (event) => {
			const db = event.target.result
			if (!db.objectStoreNames.contains(CRYPTO_STORE)) {
				db.createObjectStore(CRYPTO_STORE)
			}
		}
	})
}

function idbGet(store, key) {
	return new Promise((resolve, reject) => {
		const req = store.get(key)
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

export async function initDeviceCrypto() {
	try {
		// Check if Web Crypto API available
		if (!window.crypto?.subtle) return null

		// Check if we already have a key pair
		const existing = await getCryptoPublicKey()
		if (existing) return existing

		// Generate ECDSA P-256 key pair
		const keyPair = await crypto.subtle.generateKey(
			{ name: "ECDSA", namedCurve: "P-256" },
			false, // extractable: false - private key CANNOT leave this browser
			["sign", "verify"]
		)

		// Export public key as JWK (for sending to server)
		const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)

		// Store in IndexedDB (CryptoKey objects are structured-clonable)
		const db = await openCryptoDB()
		const tx = db.transaction(CRYPTO_STORE, "readwrite")
		const store = tx.objectStore(CRYPTO_STORE)
		store.put(keyPair.privateKey, "privateKey")
		store.put(keyPair.publicKey, "publicKey")
		store.put(publicKeyJwk, "publicKeyJwk")

		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve
			tx.onerror = () => reject(tx.error)
		})

		return publicKeyJwk
	} catch (e) {
		console.warn("[DeviceCrypto] Init failed:", e)
		return null
	}
}

export async function getCryptoPublicKey() {
	try {
		const db = await openCryptoDB()
		const tx = db.transaction(CRYPTO_STORE, "readonly")
		const store = tx.objectStore(CRYPTO_STORE)

		const privateKey = await idbGet(store, "privateKey")
		const publicKeyJwk = await idbGet(store, "publicKeyJwk")

		if (privateKey && publicKeyJwk) return publicKeyJwk
		return null
	} catch (e) {
		return null
	}
}

export async function signCheckin(employee, deviceId, timestamp) {
	try {
		if (!window.crypto?.subtle) return null

		const db = await openCryptoDB()
		const tx = db.transaction(CRYPTO_STORE, "readonly")
		const store = tx.objectStore(CRYPTO_STORE)
		const privateKey = await idbGet(store, "privateKey")

		if (!privateKey) return null

		// Build payload: same format the server expects
		const payload = `${employee}|${deviceId}|${timestamp}`
		const data = new TextEncoder().encode(payload)

		const signature = await crypto.subtle.sign(
			{ name: "ECDSA", hash: "SHA-256" },
			privateKey,
			data
		)

		// Convert ArrayBuffer to base64
		return btoa(String.fromCharCode(...new Uint8Array(signature)))
	} catch (e) {
		console.warn("[DeviceCrypto] Sign failed:", e)
		return null
	}
}

export async function getEnhancedFingerprint() {
	try {
		const signals = [
			navigator.userAgent,
			navigator.language,
			(navigator.languages || []).join(","),
			screen.width + "x" + screen.height,
			screen.colorDepth,
			screen.pixelDepth,
			new Date().getTimezoneOffset(),
			navigator.hardwareConcurrency,
			navigator.maxTouchPoints,
			navigator.platform || "",
			(() => {
				const c = document.createElement("canvas")
				const ctx = c.getContext("2d")
				ctx.textBaseline = "top"
				ctx.font = "14px Arial"
				ctx.fillText("fp-icd3s", 2, 2)
				return c.toDataURL()
			})(),
		].join("|")

		const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signals))
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	} catch (e) {
		return null
	}
}

// ==========================================
// DEVICE FINGERPRINT
// ==========================================

export function getDeviceFingerprint() {
	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")
	ctx.textBaseline = "top"
	ctx.font = "14px Arial"
	ctx.fillText("device-fp", 2, 2)

	const nav = window.navigator
	const screen = window.screen

	const raw = [
		nav.userAgent,
		nav.language,
		screen.width + "x" + screen.height,
		screen.colorDepth,
		new Date().getTimezoneOffset(),
		nav.hardwareConcurrency,
		canvas.toDataURL(),
	].join("|")

	// Simple hash
	let hash = 0
	for (let i = 0; i < raw.length; i++) {
		const char = raw.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash
	}
	return "DEV-" + Math.abs(hash).toString(36).toUpperCase()
}

export function getDeviceInfo() {
	const nav = window.navigator
	const ua = nav.userAgent

	let deviceName = "Unknown Device"
	let deviceModel = "Web Browser"
	let osVersion = "Unknown"

	if (/iPhone/.test(ua)) {
		deviceName = "iPhone"
		deviceModel = "Apple iPhone"
		const match = ua.match(/OS (\d+[_\.]\d+)/)
		osVersion = match ? "iOS " + match[1].replace("_", ".") : "iOS"
	} else if (/Android/.test(ua)) {
		deviceName = "Android Device"
		const match = ua.match(/Android (\d+\.?\d*)/)
		osVersion = match ? "Android " + match[1] : "Android"
		const model = ua.match(/;\s*([^;)]+)\s*Build/)
		if (model) deviceModel = model[1].trim()
	} else if (/Mac/.test(ua)) {
		deviceName = "Mac"
		deviceModel = "Apple Mac"
		osVersion = "macOS"
	} else if (/Windows/.test(ua)) {
		deviceName = "Windows PC"
		deviceModel = "Windows"
		const match = ua.match(/Windows NT (\d+\.?\d*)/)
		osVersion = match ? "Windows " + match[1] : "Windows"
	} else if (/Linux/.test(ua)) {
		deviceName = "Linux Device"
		deviceModel = "Linux"
		osVersion = "Linux"
	}

	return {
		device_id: getDeviceFingerprint(),
		device_name: deviceName,
		device_model: deviceModel,
		os_version: osVersion,
		app_version: typeof __APP_VERSION_NUM__ !== "undefined" ? __APP_VERSION_NUM__ : "1.0.1",
	}
}
