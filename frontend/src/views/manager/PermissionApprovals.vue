<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Permission Approvals") }}</h2>
				<span v-if="permissions.length" class="ml-auto text-xs font-bold text-white bg-icd-500 px-2 py-0.5 rounded-full">
					{{ permissions.length }}
				</span>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<!-- Loading -->
			<div v-if="loading" class="flex items-center justify-center py-16">
				<div class="w-6 h-6 border-2 border-icd-500 border-t-transparent rounded-full animate-spin"></div>
			</div>

			<!-- Empty -->
			<div v-else-if="!permissions.length" class="flex flex-col items-center justify-center py-16 px-6 text-center">
				<FeatherIcon name="check-circle" class="w-12 h-12 text-green-300 mb-3" />
				<div class="text-sm font-bold text-gray-700">{{ __("All caught up!") }}</div>
				<div class="text-xs text-gray-700 mt-1">{{ __("No pending permission requests") }}</div>
			</div>

			<!-- Permission Cards -->
			<div v-else class="px-4 py-3 space-y-4">
				<div v-for="p in permissions" :key="p.name" class="card-premium overflow-hidden">
					<!-- Header -->
					<div class="px-4 py-3 flex items-center gap-3 bg-gray-50 border-b border-gray-100">
						<div class="w-10 h-10 rounded-xl flex items-center justify-center"
							:class="categoryBg(p.permission_category)">
							<FeatherIcon :name="categoryIcon(p.permission_category)" class="w-5 h-5 text-white" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 truncate">{{ p.employee_name }}</div>
							<div class="text-[11px] text-gray-700">{{ p.department }} &middot; {{ __(p.permission_category) }}</div>
						</div>
						<span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
							:class="p.status === 'Pending HR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'">
							{{ __(p.status) }}
						</span>
					</div>

					<!-- Details -->
					<div class="px-4 py-3 space-y-2">
						<div class="flex items-center gap-2 text-xs text-gray-600">
							<FeatherIcon name="calendar" class="w-3.5 h-3.5 text-gray-700" />
							<span class="font-semibold">{{ p.permission_date }}</span>
							<span class="text-gray-700">&middot;</span>
							<FeatherIcon name="clock" class="w-3.5 h-3.5 text-gray-700" />
							<span>{{ formatTime(p.from_time) }} - {{ formatTime(p.to_time) }}</span>
							<span class="text-gray-700">({{ p.total_minutes }}min)</span>
						</div>

						<!-- Flags -->
						<div class="flex flex-wrap gap-1.5">
							<span v-if="p.within_grace" class="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
								{{ __("Within Grace") }}
							</span>
							<span v-if="p.quota_exceeded" class="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
								{{ __("Quota Exceeded") }} ({{ p.monthly_count }}x)
							</span>
							<span v-if="p.waives_penalty" class="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
								{{ __("Waives Penalty") }}
							</span>
						</div>

						<!-- Reason -->
						<div v-if="p.reason" class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
							<span class="font-bold text-gray-700">{{ __("Reason") }}:</span> {{ p.reason }}
						</div>
					</div>

					<!-- Actions -->
					<div class="px-4 py-3 flex gap-2 border-t border-gray-100">
						<button v-if="p.status === 'Pending HR'"
							@click="approve(p, 'hr')" :disabled="processing === p.name"
							class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-green-500 active:bg-green-600 disabled:opacity-50 transition-colors">
							{{ processing === p.name ? '...' : __("HR Approve") }}
						</button>
						<button v-if="p.status === 'Pending CEO'"
							@click="approve(p, 'ceo')" :disabled="processing === p.name"
							class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-green-500 active:bg-green-600 disabled:opacity-50 transition-colors">
							{{ processing === p.name ? '...' : __("CEO Approve") }}
						</button>
						<button @click="showRejectModal(p)" :disabled="processing === p.name"
							class="flex-1 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 active:bg-red-100 disabled:opacity-50 transition-colors">
							{{ __("Reject") }}
						</button>
					</div>
				</div>
			</div>

			<!-- Reject Modal -->
			<div v-if="rejectTarget" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
				@click.self="rejectTarget = null">
				<div class="w-full max-w-lg bg-white rounded-t-2xl p-5 space-y-4 animate-slide-up">
					<div class="text-base font-bold text-gray-900">{{ __("Reject Permission") }}</div>
					<div class="text-xs text-gray-700">
						{{ rejectTarget.employee_name }} - {{ __(rejectTarget.permission_category) }} on {{ rejectTarget.permission_date }}
					</div>
					<textarea v-model="rejectReason" :placeholder="__('Reason for rejection (optional)')"
						class="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-red-200"
						rows="3"></textarea>
					<div class="flex gap-3">
						<button @click="rejectTarget = null"
							class="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100">
							{{ __("Cancel") }}
						</button>
						<button @click="doReject" :disabled="processing"
							class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 disabled:opacity-50">
							{{ processing ? '...' : __("Reject") }}
						</button>
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
import { FeatherIcon, call, toast } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()
const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const loading = ref(true)
const permissions = ref([])
const processing = ref(null)
const rejectTarget = ref(null)
const rejectReason = ref("")

onMounted(() => loadData())

async function loadData() {
	loading.value = true
	try {
		const res = await call(`${API_BASE}.get_pending_permissions`)
		permissions.value = res?.pending_permissions || []
	} catch (_) {}
	loading.value = false
}

function categoryIcon(cat) {
	if (cat === "Late Arrival") return "clock"
	if (cat === "Early Leave") return "log-out"
	if (cat === "Short Leave") return "coffee"
	return "shield"
}

function categoryBg(cat) {
	if (cat === "Late Arrival") return "bg-amber-500"
	if (cat === "Early Leave") return "bg-blue-500"
	if (cat === "Short Leave") return "bg-purple-500"
	return "bg-gray-500"
}

function formatTime(t) {
	if (!t) return ""
	return String(t).slice(0, 5)
}

async function approve(p, level) {
	processing.value = p.name
	try {
		const method = level === "hr" ? "hr_approve_permission" : "ceo_approve_permission"
		await call(`${API_BASE}.${method}`, { permission_name: p.name })
		toast({ title: __("Permission approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		permissions.value = permissions.value.filter(x => x.name !== p.name)
	} catch (e) {
		let msg = "Approval failed"
		try { msg = JSON.parse(e.messages[0]).message || msg } catch (_) {}
		toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	processing.value = null
}

function showRejectModal(p) {
	rejectTarget.value = p
	rejectReason.value = ""
}

async function doReject() {
	if (!rejectTarget.value) return
	processing.value = rejectTarget.value.name
	try {
		await call(`${API_BASE}.reject_permission`, {
			permission_name: rejectTarget.value.name,
			rejection_reason: rejectReason.value || null,
		})
		toast({ title: __("Permission rejected"), icon: "x-circle", position: "bottom-center", iconClasses: "text-red-500" })
		permissions.value = permissions.value.filter(x => x.name !== rejectTarget.value.name)
		rejectTarget.value = null
	} catch (e) {
		let msg = "Rejection failed"
		try { msg = JSON.parse(e.messages[0]).message || msg } catch (_) {}
		toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	processing.value = null
}
</script>

<style scoped>
@keyframes slide-up {
	from { transform: translateY(100%); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}
.animate-slide-up { animation: slide-up 0.25s ease-out; }
</style>
