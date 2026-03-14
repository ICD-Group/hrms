<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("My Permissions") }}</h2>
				<div class="ml-auto">
					<button @click="router.push({ name: 'GeniusPermission' })"
						class="w-8 h-8 flex items-center justify-center rounded-full bg-icd-500 active:bg-icd-600 transition-colors">
						<FeatherIcon name="plus" class="w-4 h-4 text-white" />
					</button>
				</div>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<!-- Loading -->
			<div v-if="loading" class="flex items-center justify-center py-16">
				<div class="w-6 h-6 border-2 border-icd-500 border-t-transparent rounded-full animate-spin"></div>
			</div>

			<!-- Empty -->
			<div v-else-if="!permissions.length" class="flex flex-col items-center justify-center py-16 px-6 text-center">
				<FeatherIcon name="shield" class="w-12 h-12 text-gray-300 mb-3" />
				<div class="text-sm font-bold text-gray-500">{{ __("No permissions yet") }}</div>
				<div class="text-xs text-gray-400 mt-1">{{ __("Request a permission to get started") }}</div>
				<button @click="router.push({ name: 'GeniusPermission' })"
					class="mt-4 px-4 py-2 bg-icd-500 text-white text-sm font-bold rounded-lg">
					{{ __("Request Permission") }}
				</button>
			</div>

			<!-- List -->
			<div v-else class="px-4 py-3 space-y-3">
				<div v-for="p in permissions" :key="p.name"
					class="card-premium p-3.5 flex items-start gap-3">
					<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
						:class="statusBg(p.status)">
						<FeatherIcon :name="categoryIcon(p.permission_category)" class="w-5 h-5"
							:class="statusIcon(p.status)" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between">
							<div class="text-sm font-bold text-gray-900 truncate">{{ __(p.permission_category) }}</div>
							<span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
								:class="statusBadge(p.status)">
								{{ __(p.status) }}
							</span>
						</div>
						<div class="text-xs text-gray-500 mt-0.5">
							{{ p.permission_date }} &middot; {{ formatTime(p.from_time) }} - {{ formatTime(p.to_time) }}
							<span v-if="p.total_minutes" class="text-gray-400">({{ p.total_minutes }}min)</span>
						</div>
						<div v-if="p.reason" class="text-[11px] text-gray-400 mt-1 line-clamp-1">{{ p.reason }}</div>
						<div v-if="p.auto_approved" class="text-[10px] text-green-600 font-bold mt-1">
							{{ __("Auto-approved (grace)") }}
						</div>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, inject, onMounted } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { FeatherIcon, call } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()
const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const loading = ref(true)
const permissions = ref([])

onMounted(async () => {
	try {
		const res = await call(`${API_BASE}.get_my_permissions`, { limit: 50 })
		permissions.value = res?.permissions || []
	} catch (_) {}
	loading.value = false
})

function categoryIcon(cat) {
	if (cat === "Late Arrival") return "clock"
	if (cat === "Early Leave") return "log-out"
	if (cat === "Short Leave") return "coffee"
	return "shield"
}

function formatTime(t) {
	if (!t) return ""
	return String(t).slice(0, 5)
}

function statusBg(s) {
	if (s === "Approved") return "bg-green-100"
	if (s === "Rejected") return "bg-red-100"
	if (s === "Cancelled") return "bg-gray-100"
	return "bg-amber-100"
}

function statusIcon(s) {
	if (s === "Approved") return "text-green-600"
	if (s === "Rejected") return "text-red-600"
	if (s === "Cancelled") return "text-gray-500"
	return "text-amber-600"
}

function statusBadge(s) {
	if (s === "Approved") return "bg-green-100 text-green-700"
	if (s === "Rejected") return "bg-red-100 text-red-700"
	if (s === "Cancelled") return "bg-gray-100 text-gray-600"
	return "bg-amber-100 text-amber-700"
}
</script>
