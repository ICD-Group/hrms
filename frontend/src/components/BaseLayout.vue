<template>
	<ion-page>
		<!-- White background -->
		<div class="app-bg-ambient"></div>

		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex items-center justify-between px-4 py-2.5 glass-header">
					<!-- Left: Back/Logo + Title -->
					<div class="flex items-center gap-2.5">
						<button v-if="props.showBack" @click="router.back()"
							class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 active:scale-90 transition-all duration-200">
							<FeatherIcon name="arrow-left" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
						</button>
						<img v-else :src="'/files/icd-apple-touch-icon.png?v=2'" alt="ICD" class="h-9 w-9 rounded-xl shadow-sm logo-animate" />
						<h2 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
							{{ props.pageTitle || "ICD HR" }}
						</h2>
					</div>
					<!-- Right: Mode Switcher + Bell + Avatar -->
					<div class="flex items-center gap-2">
						<!-- Mode Switcher (managers only) -->
						<button
							v-if="isManager"
							@click="toggleMode"
							class="mode-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 active:scale-90"
							:class="isManagerMode
								? 'mode-pill-manager'
								: 'mode-pill-employee'"
						>
							<FeatherIcon
								:name="isManagerMode ? 'shield' : 'user'"
								class="w-3.5 h-3.5"
								:class="isManagerMode ? 'text-white' : 'text-white'"
							/>
							<span
								class="text-[11px] font-bold leading-none text-white"
							>
								{{ isManagerMode ? __('Manager') : __('Employee') }}
							</span>
							<FeatherIcon name="repeat" class="w-3 h-3 text-white/70" />
						</button>
						<!-- Notifications Bell -->
						<router-link
							:to="isManagerMode ? { name: 'ManagerCommand', query: { tab: 'notifications' } } : { name: 'GeniusInbox' }"
							v-slot="{ navigate }"
						>
							<button class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition-all duration-200 active:scale-90 relative" @click="navigate">
								<FeatherIcon name="bell" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
								<span
									v-if="unreadNotificationsCount.data"
									class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 notification-dot"
								></span>
							</button>
						</router-link>
						<!-- Profile Avatar -->
						<router-link :to="{ name: 'Profile' }">
							<div class="w-9 h-9 rounded-full ring-2 ring-icd-100 dark:ring-icd-800 overflow-hidden active:scale-90 transition-transform duration-200">
								<Avatar
									:image="user.data?.user_image"
									:label="user.data?.first_name"
									size="xl"
									class="!w-full !h-full"
								/>
							</div>
						</router-link>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content class="ion-no-padding">
			<div class="flex flex-col min-h-full w-full">
				<slot name="body"></slot>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonHeader, IonContent, IonPage } from "@ionic/vue"
import { FeatherIcon, Avatar } from "frappe-ui"
import { useRouter } from "vue-router"
import { useManagerMode, hasManagerRole } from "@/composables/managerMode"

import { unreadNotificationsCount } from "@/data/notifications"

import { inject, computed } from "vue"

const __ = inject("$translate")
const user = inject("$user")
const router = useRouter()
const { isManagerMode, toggleManagerMode } = useManagerMode()

const isManager = computed(() => {
	// Access user.data explicitly to register Vue dependency
	const userData = user?.data
	if (!userData) return false
	return hasManagerRole(userData.roles || [])
})

function toggleMode() {
	toggleManagerMode()
	if (isManagerMode.value) {
		router.push("/manager/dashboard")
	} else {
		router.push("/home")
	}
}

const props = defineProps({
	pageTitle: {
		type: String,
		required: false,
		default: "",
	},
	showBack: {
		type: Boolean,
		default: false,
	},
})
</script>

<style scoped>
.logo-animate {
	transition: transform 0.2s ease;
}
.logo-animate:active {
	transform: scale(0.9) rotate(-5deg);
}
@keyframes notification-bounce {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.3); }
}
.notification-dot {
	animation: notification-bounce 2s ease-in-out infinite;
}
.mode-pill {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
}
.mode-pill-employee {
	background: linear-gradient(135deg, #4D067B 0%, #7B2FA0 100%);
	border: 1.5px solid rgba(255, 255, 255, 0.2);
}
.mode-pill-manager {
	background: linear-gradient(135deg, #059669 0%, #10b981 100%);
	border: 1.5px solid rgba(255, 255, 255, 0.2);
}
</style>
