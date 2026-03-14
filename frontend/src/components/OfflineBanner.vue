<template>
	<Transition name="offline-slide">
		<div v-if="isOffline" class="offline-banner" role="alert" aria-live="assertive">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="1" y1="1" x2="23" y2="23"/>
				<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
				<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
				<path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
				<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
				<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
				<line x1="12" y1="20" x2="12.01" y2="20"/>
			</svg>
			<span>You are offline</span>
		</div>
	</Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const isOffline = ref(!navigator.onLine)

function goOffline() {
	isOffline.value = true
}

function goOnline() {
	isOffline.value = false
}

onMounted(() => {
	window.addEventListener("offline", goOffline)
	window.addEventListener("online", goOnline)
})

onUnmounted(() => {
	window.removeEventListener("offline", goOffline)
	window.removeEventListener("online", goOnline)
})
</script>

<style scoped>
.offline-banner {
	position: fixed;
	bottom: 80px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 9999;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: rgba(239, 68, 68, 0.95);
	color: #fff;
	border-radius: 24px;
	font-size: 13px;
	font-weight: 600;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	pointer-events: none;
}

.offline-slide-enter-active {
	transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.offline-slide-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}
.offline-slide-enter-from {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}
.offline-slide-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(20px);
}
</style>
