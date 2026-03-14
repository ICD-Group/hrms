<template>
	<ion-app>
		<ion-router-outlet id="main-content" />
		<Toasts />

		<InstallPrompt v-if="!hasUpdate" />
		<OfflineBanner />
		<UpdateBanner @update-available="hasUpdate = true" />
	</ion-app>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonApp, IonRouterOutlet } from "@ionic/vue"

import { Toasts } from "frappe-ui"

import InstallPrompt from "@/components/InstallPrompt.vue"
import OfflineBanner from "@/components/OfflineBanner.vue"
import UpdateBanner from "@/components/UpdateBanner.vue"
import { showNotification } from "@/utils/pushNotifications"

const hasUpdate = ref(false)

onMounted(() => {
	// Remove inline splash screen once Vue has mounted
	const splash = document.getElementById("app-splash")
	if (splash) {
		splash.style.opacity = "0"
		setTimeout(() => splash.remove(), 350)
	}

	window?.frappePushNotification?.onMessage((payload) => {
		showNotification(payload)
	})
})
</script>
