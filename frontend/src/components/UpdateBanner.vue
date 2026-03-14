<template>
	<Teleport to="body">
		<Transition name="update-modal">
			<div v-if="updateAvailable" class="update-overlay" @click.self="false">
				<div class="update-card">
					<!-- Animated gradient icon -->
					<div class="update-icon-wrap">
						<div class="update-icon-glow"></div>
						<div class="update-icon">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
								<path d="M12 2L12 16M12 16L7 11M12 16L17 11" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
					<!-- Text -->
					<div class="update-title">Update Available</div>
					<div class="update-version">v{{ shortVersion }}</div>
					<div v-if="serverTimestamp" class="update-date">{{ formatDate(serverTimestamp) }}</div>
					<div class="update-msg">Tap to install the latest improvements.</div>
					<!-- Button -->
					<button class="update-btn" @click="doUpdate">
						<span>Update Now</span>
					</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"

const emit = defineEmits(["update-available"])
const updateAvailable = ref(false)
const serverTimestamp = ref(null)
let checkInterval = null

const STORAGE_KEY = "icd_app_version"
const COOLDOWN_KEY = "icd_update_ts"
const BUILD_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null
const BUILD_VERSION_NUM = typeof __APP_VERSION_NUM__ !== "undefined" ? __APP_VERSION_NUM__ : null
const VERSION_URL = "/assets/hrms/frontend/version.json"
const serverVersionNum = ref(null)

const shortVersion = computed(() => {
	return serverVersionNum.value || BUILD_VERSION_NUM || "?"
})

function formatDate(ts) {
	if (!ts) return ""
	const d = new Date(ts)
	const day = d.getDate()
	const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
	return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}

async function fetchServerVersion() {
	try {
		const resp = await fetch(VERSION_URL + "?_=" + Date.now(), {
			cache: "no-store",
		})
		if (!resp.ok) return null
		const data = await resp.json()
		if (data.t) serverTimestamp.value = data.t
		if (data.n) serverVersionNum.value = data.n
		return data.v || null
	} catch {
		return null
	}
}

function isInCooldown() {
	try {
		const ts = localStorage.getItem(COOLDOWN_KEY)
		if (ts && (Date.now() - parseInt(ts, 10)) < 30000) return true
	} catch {}
	return false
}

async function checkForUpdate() {
	if (updateAvailable.value) return
	if (isInCooldown()) {
		// Just landed after update - save current version
		try { localStorage.setItem(STORAGE_KEY, BUILD_VERSION) } catch {}
		return
	}
	const serverVersion = await fetchServerVersion()
	if (!serverVersion) return
	if (BUILD_VERSION && serverVersion !== BUILD_VERSION) {
		try { localStorage.setItem(STORAGE_KEY, serverVersion) } catch {}
		updateAvailable.value = true
		emit("update-available")
	} else {
		// Versions match - save it
		try { localStorage.setItem(STORAGE_KEY, BUILD_VERSION) } catch {}
	}
}

function onVisibilityChange() {
	if (document.visibilityState === "visible") {
		checkForUpdate()
	}
}

async function doUpdate() {
	// Redirect to standalone reset page — it clears SW, caches, storage,
	// IndexedDB, then redirects back to /hrms with cache-busting.
	// This is 100% reliable because reset.html is a standalone page
	// that doesn't depend on any JS bundle or service worker.
	window.location.replace("/assets/hrms/frontend/reset.html")
}

onMounted(() => {
	checkForUpdate()
	// Check every 2 minutes
	checkInterval = setInterval(checkForUpdate, 2 * 60 * 1000)
	document.addEventListener("visibilitychange", onVisibilityChange)
})

onUnmounted(() => {
	if (checkInterval) clearInterval(checkInterval)
	document.removeEventListener("visibilitychange", onVisibilityChange)
})
</script>

<style scoped>
.update-overlay {
	position: fixed;
	inset: 0;
	z-index: 999999;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.45);
	-webkit-backdrop-filter: blur(30px) saturate(200%);
	backdrop-filter: blur(30px) saturate(200%);
	padding: 32px;
}

.update-card {
	width: 280px;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.85);
	-webkit-backdrop-filter: blur(60px) saturate(200%);
	backdrop-filter: blur(60px) saturate(200%);
	border: 0.5px solid rgba(255, 255, 255, 0.7);
	box-shadow:
		0 0 0 0.5px rgba(0, 0, 0, 0.04),
		0 24px 80px rgba(0, 0, 0, 0.2),
		0 8px 24px rgba(0, 0, 0, 0.08);
	padding: 28px 24px 22px;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.update-icon-wrap {
	position: relative;
	width: 64px;
	height: 64px;
	margin-bottom: 18px;
}

.update-icon-glow {
	position: absolute;
	inset: -6px;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%);
	animation: glow-pulse 2.5s ease-in-out infinite;
}

.update-icon {
	position: relative;
	width: 64px;
	height: 64px;
	border-radius: 18px;
	background: linear-gradient(145deg, #059669 0%, #10b981 50%, #34d399 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 4px 16px rgba(5, 150, 105, 0.35),
		0 1px 3px rgba(0, 0, 0, 0.08),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.update-title {
	font-size: 18px;
	font-weight: 700;
	color: #1c1c1e;
	letter-spacing: -0.03em;
	margin-bottom: 6px;
}

.update-version {
	font-size: 12px;
	font-weight: 600;
	color: #059669;
	font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
	margin-bottom: 2px;
}

.update-date {
	font-size: 11px;
	color: rgba(60, 60, 67, 0.5);
	margin-bottom: 8px;
}

.update-msg {
	font-size: 13px;
	line-height: 1.45;
	color: rgba(60, 60, 67, 0.7);
	letter-spacing: -0.01em;
	margin-bottom: 22px;
}

.update-btn {
	width: 100%;
	padding: 13px 20px;
	border: none;
	border-radius: 13px;
	background: linear-gradient(145deg, #059669 0%, #10b981 60%, #34d399 100%);
	color: white;
	font-size: 16px;
	font-weight: 700;
	letter-spacing: -0.02em;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	box-shadow:
		0 4px 14px rgba(5, 150, 105, 0.35),
		0 1px 3px rgba(0, 0, 0, 0.06),
		inset 0 1px 0 rgba(255, 255, 255, 0.15);
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.update-btn:active {
	transform: scale(0.97);
}

@keyframes glow-pulse {
	0%, 100% { opacity: 0.6; transform: scale(1); }
	50% { opacity: 1; transform: scale(1.08); }
}

@media (prefers-color-scheme: dark) {
	.update-card {
		background: rgba(44, 44, 46, 0.88);
		border-color: rgba(255, 255, 255, 0.1);
	}
	.update-title { color: #fff; }
	.update-version { color: #34d399; }
	.update-date { color: rgba(235, 235, 245, 0.4); }
	.update-msg { color: rgba(235, 235, 245, 0.6); }
}

.update-modal-enter-active { transition: opacity 0.25s ease; }
.update-modal-enter-active .update-card { transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.update-modal-leave-active { transition: opacity 0.18s ease; }
.update-modal-leave-active .update-card { transition: opacity 0.18s ease, transform 0.18s ease; }
.update-modal-enter-from { opacity: 0; }
.update-modal-enter-from .update-card { opacity: 0; transform: scale(1.1) translateY(-8px); }
.update-modal-leave-to { opacity: 0; }
.update-modal-leave-to .update-card { opacity: 0; transform: scale(0.92) translateY(4px); }
</style>
