<template>
	<!-- Install PWA dialog -->
	<Dialog v-model="showDialog">
		<template #body-title>
			<h2 class="text-lg font-bold">{{ __("Install ICD HR") }} </h2>
		</template>
		<template #body-content>
			<p>{{ __("Get the app on your device for easy access & a better experience!") }} </p>
		</template>
		<template #actions>
			<Button variant="solid" @click="() => install()" class="py-5 w-full">
				<template #prefix><FeatherIcon name="download" class="w-4" /></template>
				{{ __("Install") }}
			</Button>
		</template>
	</Dialog>

	<!-- iOS installation info message -->
	<Popover :show="iosInstallMessage" placement="bottom">
		<template #body>
			<div
				class="mt-[calc(100vh-15rem)] flex flex-col gap-3 mx-2 rounded py-5 bg-icd-100 drop-shadow-xl"
			>
				<div
					class="flex flex-row text-center items-center justify-between mb-1 px-3"
				>
					<span class="text-base text-gray-900 font-bold">
						{{ __("Install ICD HR") }}
					</span>
					<span class="inline-flex items-baseline">
						<FeatherIcon
							name="x"
							class="ml-auto h-4 w-4 text-gray-700"
							@click="dismissIos"
						/>
					</span>
				</div>
				<div class="text-xs text-gray-800 px-3">
					<span class="flex flex-col gap-2">
						<span>
							{{ __("Get the app on your iPhone for easy access & a better experience") }}
						</span>
						<span class="inline-flex items-start whitespace-nowrap">
							<span>Tap&nbsp;</span>
							<FeatherIcon name="share" class="h-4 w-4 text-icd-600" />
							<span>&nbsp;and then "Add to Home Screen"</span>
						</span>
					</span>
				</div>
			</div>
		</template>
	</Popover>
</template>

<script setup>
import { ref } from "vue"

import { Dialog, Popover, FeatherIcon } from "frappe-ui"

const DISMISS_KEY = "icd_install_dismissed"

const deferredPrompt = ref(null)
const showDialog = ref(false)
const iosInstallMessage = ref(false)

function wasDismissed() {
	try {
		const ts = localStorage.getItem(DISMISS_KEY)
		if (!ts) return false
		// Show again after 30 days
		return Date.now() - parseInt(ts) < 30 * 24 * 60 * 60 * 1000
	} catch { return false }
}

function saveDismiss() {
	try { localStorage.setItem(DISMISS_KEY, Date.now().toString()) } catch {}
}

function dismissIos() {
	iosInstallMessage.value = false
	saveDismiss()
}

const isIos = () => {
	const userAgent = window.navigator.userAgent.toLowerCase()
	return /iphone|ipad|ipod/.test(userAgent)
}

const isInStandaloneMode = () =>
	"standalone" in window.navigator && window.navigator.standalone

if (isIos() && !isInStandaloneMode() && !wasDismissed()) {
	iosInstallMessage.value = true
}

window.addEventListener("beforeinstallprompt", (e) => {
	e.preventDefault()
	deferredPrompt.value = e
	if (wasDismissed()) return
	if (isIos() && !isInStandaloneMode()) {
		iosInstallMessage.value = true
	} else {
		showDialog.value = true
	}
})

window.addEventListener("appinstalled", () => {
	showDialog.value = false
	deferredPrompt.value = null
	saveDismiss()
})

async function install() {
	deferredPrompt.value.prompt()
	showDialog.value = false
	saveDismiss()
}
</script>
