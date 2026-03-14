import { clientsClaim } from "workbox-core"

// =============================================================================
// ICD HR Unified Service Worker v5.1
// Features: VAPID Push with action buttons, Background Sync,
//           Push Analytics, Offline Check-in Queue, Message Commands
// =============================================================================

const SW_VERSION = "3.0.0"

// ---------------------------------------------------------------------------
// 2. Core Lifecycle - Auto-update: clear caches + refresh all clients
// ---------------------------------------------------------------------------
self.skipWaiting()
clientsClaim()

// On activate: clear ALL caches only (no page refresh - handled by main app)
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((names) => {
			return Promise.all(names.map((name) => caches.delete(name)))
		}).then(() => {
			if (self.navigator && self.navigator.onLine) {
				return syncQueuedCheckins()
			}
		})
	)
})

// No fetch interception - HRMS Vue assets use Vite hashed URLs
// which are cache-busted automatically. Network-first is safest.

// ---------------------------------------------------------------------------
// 3. VAPID Web Push - Enhanced with Action Buttons + Analytics
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
	if (!event.data) return

	let data
	try {
		data = event.data.json()
	} catch (e) {
		data = {
			title: "ICD HR",
			body: event.data.text(),
			icon: "/assets/hrms/manifest/manifest-icon-192.maskable.png",
			url: "/hrms",
		}
	}

	// Build contextual action buttons based on notification type
	const ntype = data.type || data.tag || ""
	let actions = []

	if (ntype.indexOf("checkin") !== -1 || ntype.indexOf("reminder") !== -1) {
		actions = [
			{ action: "checkin", title: "Check In" },
			{ action: "view", title: "View Details" },
		]
	} else if (ntype.indexOf("leave") !== -1) {
		actions = [
			{ action: "view", title: "View Leave" },
			{ action: "dismiss", title: "Dismiss" },
		]
	} else if (ntype.indexOf("salary") !== -1 || ntype.indexOf("payroll") !== -1) {
		actions = [{ action: "view", title: "View Salary" }]
	} else {
		actions = [{ action: "view", title: "Open" }]
	}

	const options = {
		body: data.body || "",
		icon: data.icon || "/assets/hrms/manifest/manifest-icon-192.maskable.png",
		badge: "/assets/hrms/manifest/manifest-icon-192.maskable.png",
		tag: data.tag || "icd3s-notification",
		renotify: true,
		actions: actions,
		data: {
			url: data.url || "/hrms",
			type: ntype,
		},
	}

	event.waitUntil(
		self.registration
			.showNotification(data.title || "ICD HR", options)
			.then(() => {
				trackPushEvent("delivered", options.tag, "")
			})
	)
})

// ---------------------------------------------------------------------------
// 4. Notification Click - Smart routing based on action
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
	event.notification.close()

	const action = event.action || ""
	const ndata = event.notification.data || {}
	let url = ndata.url || "/hrms"

	// Track the click
	trackPushEvent("clicked", event.notification.tag || "", action || "body")

	// Route based on action button clicked
	if (action === "checkin") {
		url = "/hrms/check-in"
	} else if (action === "view") {
		const ntype = ndata.type || ""
		if (ntype.indexOf("leave") !== -1) {
			url = "/hrms/genius/inbox?tab=actions"
		} else if (ntype.indexOf("salary") !== -1 || ntype.indexOf("payroll") !== -1) {
			url = "/hrms/genius/salary"
		} else {
			url = ndata.url || "/hrms/genius/inbox?tab=updates"
		}
	} else if (action === "dismiss") {
		return // Just close the notification
	}

	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			// Focus existing HRMS window and navigate
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && "focus" in client) {
					client.navigate(url)
					return client.focus()
				}
			}
			// Open new window
			return clients.openWindow(url)
		})
	)
})

// Track notification dismissals (user swipes away)
self.addEventListener("notificationclose", (event) => {
	trackPushEvent("dismissed", event.notification.tag || "", "")
})

// ---------------------------------------------------------------------------
// 5. Push Analytics - Lightweight tracking via API
// ---------------------------------------------------------------------------
function trackPushEvent(eventType, tag, action) {
	fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.track_push_event", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Frappe-CSRF-Token": "none",
		},
		body: JSON.stringify({
			event_type: eventType,
			notification_tag: tag || "",
			action_clicked: action || "",
		}),
	}).catch(() => {
		// Silent fail - analytics should never block
	})
}

// ---------------------------------------------------------------------------
// 6. Background Sync - Queue offline check-ins for later sync
// ---------------------------------------------------------------------------
self.addEventListener("sync", (event) => {
	if (event.tag === "icd3s-sync-checkins") {
		event.waitUntil(syncQueuedCheckins())
	}
})

function syncQueuedCheckins() {
	return openPendingCheckinsDB()
		.then((db) => getAllPendingCheckins(db))
		.then((result) => {
			const { db, checkins } = result
			if (!checkins || checkins.length === 0) return

			return fetch(
				"/api/method/icd3s_attendance.icd3s_attendance.api.attendance.sync_offline",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Frappe-CSRF-Token": "none",
					},
					body: JSON.stringify({ checkins: checkins }),
				}
			)
				.then((response) => {
					if (!response.ok) throw new Error("Sync API returned " + response.status)
					return response.json()
				})
				.then(() => {
					return clearPendingCheckins(db).then(() => {
						return self.registration.showNotification("ICD HR", {
							body: checkins.length + " check-in(s) synced successfully",
							icon: "/assets/hrms/manifest/manifest-icon-192.maskable.png",
							tag: "icd3s-sync-success",
						})
					})
				})
				.catch(() => {
					// Leave records for next sync attempt
				})
		})
		.catch(() => {
			// IndexedDB error - ignore
		})
}

// ---------------------------------------------------------------------------
// 6a. IndexedDB helpers for pending check-ins
// ---------------------------------------------------------------------------
function openPendingCheckinsDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("icd3s_attendance_offline", 1)
		request.onupgradeneeded = (event) => {
			const db = event.target.result
			if (!db.objectStoreNames.contains("pending_checkins")) {
				db.createObjectStore("pending_checkins", { keyPath: "id", autoIncrement: true })
			}
		}
		request.onsuccess = (event) => resolve(event.target.result)
		request.onerror = (event) => reject(event.target.error)
	})
}

function getAllPendingCheckins(db) {
	return new Promise((resolve, reject) => {
		const tx = db.transaction("pending_checkins", "readonly")
		const store = tx.objectStore("pending_checkins")
		const request = store.getAll()
		request.onsuccess = () => resolve({ db, checkins: request.result })
		request.onerror = () => reject(new Error("Failed to read pending_checkins"))
	})
}

function clearPendingCheckins(db) {
	return new Promise((resolve, reject) => {
		const tx = db.transaction("pending_checkins", "readwrite")
		const store = tx.objectStore("pending_checkins")
		const request = store.clear()
		request.onsuccess = () => resolve()
		request.onerror = () => reject(new Error("Failed to clear pending_checkins"))
	})
}

// ---------------------------------------------------------------------------
// 7. Message Handler - Commands from main thread
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
	const data = event.data
	if (!data || !data.type) return

	switch (data.type) {
		case "SKIP_WAITING":
			self.skipWaiting()
			break

		case "CACHE_URLS":
			if (data.urls && data.urls.length > 0) {
				event.waitUntil(
					caches.open("icd3s-dynamic").then((cache) => {
						return Promise.all(
							data.urls.map((url) => cache.add(url).catch(() => {}))
						)
					})
				)
			}
			break

		case "CLEAR_CACHE":
			event.waitUntil(
				caches.keys().then((names) => {
					return Promise.all(names.map((name) => caches.delete(name)))
				})
			)
			break
	}
})

// ---------------------------------------------------------------------------
// 8. Safari Fallback - Safari doesn't support Background Sync API
// ---------------------------------------------------------------------------
self.addEventListener("online", () => {
	syncQueuedCheckins()
})

console.log("ICD HR Service Worker v" + SW_VERSION)
