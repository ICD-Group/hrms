/**
 * FrappePushNotification stub — Firebase dependency removed.
 * ICD HR uses VAPID Web Push via icd3s_attendance push_service.
 * This stub preserves the API surface for compatibility with main.js
 * but all actual push logic is handled by VAPID subscription in main.js.
 */
class FrappePushNotification {
	static get relayServerBaseURL() {
		return window.frappe?.boot?.push_relay_server_url || ""
	}

	constructor(projectName) {
		this.projectName = projectName
		this.webConfig = null
		this.vapidPublicKey = ""
		this.token = null
		this.initialized = false
		this.messaging = null
		this.serviceWorkerRegistration = null
		this.onMessageHandler = null
	}

	async initialize(serviceWorkerRegistration) {
		this.serviceWorkerRegistration = serviceWorkerRegistration
		this.initialized = true
	}

	async appendConfigToServiceWorkerURL(url) {
		return url
	}

	async fetchWebConfig() {
		if (this.webConfig) return this.webConfig
		try {
			const url = `${FrappePushNotification.relayServerBaseURL}/api/method/notification_relay.api.get_config?project_name=${this.projectName}`
			const response = await fetch(url)
			const json = await response.json()
			this.webConfig = json.config
			return this.webConfig
		} catch {
			return null
		}
	}

	async fetchVapidPublicKey() {
		return this.vapidPublicKey
	}

	onMessage(callback) {
		this.onMessageHandler = callback
	}

	isNotificationEnabled() {
		return false
	}

	async enableNotification() {
		return { permission_granted: false, token: "" }
	}

	async disableNotification() {}

	async registerTokenHandler() {
		return false
	}

	async unregisterTokenHandler() {
		return false
	}
}

export default FrappePushNotification
