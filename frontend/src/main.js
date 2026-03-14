import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import { initSocket } from "./socket"

import {
	Button,
	Input,
	setConfig,
	frappeRequest,
	resourcesPlugin,
	FormControl,
} from "frappe-ui"
import { translationsPlugin } from "./plugins/translationsPlugin.js"
import EmptyState from "@/components/EmptyState.vue"
import ErrorBoundary from "@/components/ErrorBoundary.vue"

import { IonicVue } from "@ionic/vue"

import { session } from "@/data/session"
import { userResource } from "@/data/user"
import { employeeResource } from "@/data/employee"

import dayjs from "@/utils/dayjs"
import getIonicConfig from "@/utils/ionicConfig"
import { useManagerMode, hasManagerRole } from "@/composables/managerMode"

import FrappePushNotification from "../public/frappe-push-notification"

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css"

/* Theme variables */
import "./theme/variables.css"

import "./main.css"

// Apply dark mode on startup (before app renders to prevent flash)
try {
	if (localStorage.getItem("icd3s_dark_mode") === "1") {
		document.documentElement.classList.add("dark")
	}
} catch(e) { console.warn("[dark-mode] Init error:", e) }

const app = createApp(App)
const socket = initSocket()

setConfig("resourceFetcher", frappeRequest)
app.use(resourcesPlugin)
app.use(translationsPlugin)

app.component("Button", Button)
app.component("Input", Input)
app.component("FormControl", FormControl)
app.component("EmptyState", EmptyState)
app.component("ErrorBoundary", ErrorBoundary)

app.use(router)
app.use(IonicVue, getIonicConfig())

if (session?.isLoggedIn && !employeeResource?.data) {
	employeeResource.reload()
}

app.provide("$session", session)
app.provide("$user", userResource)
app.provide("$employee", employeeResource)
app.provide("$socket", socket)
app.provide("$dayjs", dayjs)

// Global error handler - prevents white screen on uncaught errors
app.config.errorHandler = (err, instance, info) => {
	console.error(`[ICD HR Error] ${info}:`, err)
	// Show user-friendly toast for rate limit errors
	if (err?.message?.toLowerCase()?.includes("too many requests")) {
		import("frappe-ui").then(({ toast }) => {
			toast({ title: "Slow down", text: "Too many requests. Please wait a moment.", icon: "clock", iconClasses: "text-amber-500" })
		})
	}
}

// ICD v5.1 - Unified SW: VAPID push only (Firebase removed)
const registerServiceWorker = async () => {
	window.frappePushNotification = new FrappePushNotification("hrms")

	if (!("serviceWorker" in navigator)) {
		console.error("Service worker not supported")
		return
	}

	try {
		// Force SW update check on every page load
		const swUrl = "/assets/hrms/frontend/sw.js?v=" + (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : Date.now())
		const registration = await navigator.serviceWorker.register(
			swUrl,
			{ type: "classic", scope: "/", updateViaCache: "none" }
		)
		registration.update()
		vapidSubscribe(registration)
	} catch (err) {
		console.error("Failed to register service worker", err)
	}
}

// ICD v4.0 - VAPID Web Push subscription for icd3s_attendance notifications
function b64ToUint8Array(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

async function vapidSubscribe(registration) {
	try {
		if (!("PushManager" in window)) return

		// Check if already subscribed
		const existing = await registration.pushManager.getSubscription()
		if (existing) {
			// Save to server (in case it changed)
			saveVapidSubscription(existing)
			return
		}

		// Request notification permission if not yet granted
		if (typeof Notification === "undefined") return
		let perm = Notification.permission
		if (perm === "default") {
			perm = await Notification.requestPermission()
		}
		if (perm !== "granted") return

		// Get VAPID public key from server
		const resp = await fetch(
			"/api/method/icd3s_attendance.icd3s_attendance.push_service.get_vapid_public_key",
			{ headers: { "X-Frappe-CSRF-Token": window.csrf_token || "" } }
		)
		const data = await resp.json()
		const vapidKey = data.message && data.message.public_key
		if (!vapidKey) return

		// Subscribe with VAPID key
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: b64ToUint8Array(vapidKey),
		})

		saveVapidSubscription(subscription)
		console.log("[ICD Push] VAPID subscription created")
	} catch (e) {
		console.log("[ICD Push] VAPID subscribe:", e.message)
	}
}

function saveVapidSubscription(sub) {
	const ua = navigator.userAgent
	const br = ua.includes("Chrome")
		? "Chrome"
		: ua.includes("Firefox")
		? "Firefox"
		: ua.includes("Safari")
		? "Safari"
		: "Other"
	const dt = /Mobile|Android|iPhone/i.test(ua)
		? "Mobile"
		: /iPad|Tablet/i.test(ua)
		? "Tablet"
		: "Desktop"

	fetch(
		"/api/method/icd3s_attendance.icd3s_attendance.push_service.save_subscription",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Frappe-CSRF-Token": window.csrf_token || "",
			},
			body: JSON.stringify({
				subscription_json: JSON.stringify(sub.toJSON()),
				browser: br,
				device_type: dt,
			}),
		}
	).catch(() => {})
}

router.isReady().then(async () => {
	if (import.meta.env.DEV) {
		await frappeRequest({
			url: "/api/method/hrms.www.hrms.get_context_for_dev",
		}).then(async (values) => {
			if (!window.frappe) window.frappe = {}
			window.frappe.boot = values
		})
	}

	await translationsPlugin.isReady();
	registerServiceWorker()
	app.mount("#app")
})

// ICD v5.2: VAPID subscription after login (not before - APIs require auth)
let _icdVapidDone = false
router.afterEach((to) => {
	if (!_icdVapidDone && to.name !== "Login" && to.name !== "InvalidEmployee" && session.isLoggedIn) {
		_icdVapidDone = true
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.ready.then((registration) => {
				vapidSubscribe(registration)
			})
		}
	}
})

let _userFetched = false
router.beforeEach(async (to, _, next) => {
	let isLoggedIn = session.isLoggedIn

	try {
		if (isLoggedIn) {
			if (!_userFetched) {
				// First navigation: await fresh data
				await userResource.reload()
				_userFetched = true
			} else {
				// Subsequent navigations: fire-and-forget (no hang)
				userResource.reload()
			}
		}
	} catch (error) {
		isLoggedIn = false
	}

	if (!isLoggedIn) {
		if (to.path === "/update-password") {
			return next(false)
		} else if (to.name !== "Login") {
			return next({ name: "Login" })
		}
		return next()
	}

	if (to.name === "InvalidEmployee") {
		return next()
	}

	// Wait for employee data (first load only - promise resolves instantly after)
	await employeeResource.promise
	if (
		!employeeResource?.data ||
		employeeResource?.data?.user_id !== userResource.data?.name
	) {
		return next({ name: "InvalidEmployee" })
	}

	if (to.name === "Login") {
		return next({ name: "Home" })
	}

	// Validate manager mode against actual user roles
	const { validateManagerAccess, isManagerMode } = useManagerMode()
	const roles = userResource?.data?.roles || []
	const isMgr = validateManagerAccess(roles)

	// Redirect managers to dashboard when opening app (going to /home)
	if (isMgr && isManagerMode.value && (to.path === "/home" || to.path === "/")) {
		return next({ path: "/manager/dashboard" })
	}

	// Block /manager/* routes for non-managers
	if (to.path.startsWith("/manager")) {
		if (!hasManagerRole(roles)) {
			localStorage.setItem("hrms_manager_mode", "0")
			return next({ name: "Home" })
		}
	}
	next()
})
