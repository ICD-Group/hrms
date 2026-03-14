<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 ml-1">{{ __("Disciplinary Actions") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">

					<!-- Summary Cards -->
					<div v-if="summary" class="grid grid-cols-3 gap-2">
						<div class="card-premium p-3 text-center">
							<div class="text-2xl font-black text-icd-600">{{ summary.active }}</div>
							<div class="text-[11px] font-bold text-gray-700 uppercase">{{ __("Active") }}</div>
						</div>
						<div class="card-premium p-3 text-center">
							<div class="text-2xl font-black text-icd-600">{{ summary.pending_defense }}</div>
							<div class="text-[11px] font-bold text-gray-700 uppercase">{{ __("Need Defense") }}</div>
						</div>
						<div class="card-premium p-3 text-center">
							<div class="text-2xl font-black text-icd-600">{{ summary.can_appeal }}</div>
							<div class="text-[11px] font-bold text-gray-700 uppercase">{{ __("Can Appeal") }}</div>
						</div>
					</div>

					<!-- Filter Tabs -->
					<div class="flex gap-2 overflow-x-auto pb-1">
						<button v-for="tab in filterTabs" :key="tab.value"
							@click="activeFilter = tab.value"
							class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
							:class="activeFilter === tab.value
								? 'bg-icd-600 text-white'
								: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
						>{{ tab.label }}</button>
					</div>

					<!-- Loading -->
					<div v-if="loading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Empty State -->
					<div v-else-if="filteredActions.length === 0" class="text-center py-10">
						<FeatherIcon name="shield" class="w-12 h-12 text-gray-700 mx-auto mb-3" />
						<div class="text-sm text-gray-700">{{ __("No disciplinary actions") }}</div>
					</div>

					<!-- Actions List -->
					<div v-else class="flex flex-col gap-2">
						<div v-for="(action, idx) in filteredActions" :key="action.name"
							@click="router.push({ name: 'DisciplinaryDetail', params: { id: action.name } })"
							class="card-premium p-4 active:bg-gray-100 cursor-pointer animate-slide-up"
							:class="severityBorder(action.severity)"
							:style="{ animationDelay: `${idx * 0.04}s` }"
						>
							<div class="flex items-start justify-between mb-2">
								<div>
									<div class="text-sm font-semibold text-gray-900">{{ action.action_type }}</div>
									<div class="text-[11px] text-gray-600">{{ action.name }}</div>
								</div>
								<div class="flex flex-col items-end gap-1">
									<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(action.status)">
										{{ action.status }}
									</span>
									<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="severityClass(action.severity)">
										{{ action.severity }}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-3 text-[11px] text-gray-700 mb-1">
								<span class="flex items-center gap-1">
									<FeatherIcon name="calendar" class="w-3" />
									{{ formatDate(action.incident_date) }}
								</span>
								<span v-if="action.incident_date" class="text-gray-600">{{ timeAgo(action.incident_date) }}</span>
							</div>

							<div v-if="action.penalty_type" class="flex items-center gap-2 mt-1.5">
								<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
									<FeatherIcon name="zap" class="w-2.5 h-2.5 inline -mt-px mr-0.5" />
									{{ action.penalty_type }}
								</span>
								<span v-if="action.deduction_days > 0" class="text-[11px] font-bold text-red-600">
									{{ action.deduction_days }}d deduction
								</span>
							</div>

							<!-- Action buttons for defense/appeal -->
							<div v-if="action.status === 'Pending Employee Defense'" class="mt-3">
								<button @click.stop="router.push({ name: 'DisciplinaryDefense', params: { id: action.name } })"
									class="w-full premium-submit text-xs" style="padding: 0.5rem; font-size: 0.75rem;">
									{{ __("Submit Defense") }}
								</button>
							</div>
							<div v-else-if="action.status === 'Approved' && !action.appeal_status && isWithinAppealWindow(action)" class="mt-3">
								<button @click.stop="router.push({ name: 'DisciplinaryAppeal', params: { id: action.name } })"
									class="w-full bg-orange-600 text-white rounded-lg py-2 text-xs font-bold active:bg-orange-700">
									{{ __("File Appeal") }}
									<span v-if="appealDaysLeft(action)" class="ml-1 opacity-75">({{ appealDaysLeft(action) }})</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import dayjs from "@/utils/dayjs"

const __ = inject("$translate")
const router = useRouter()

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const loading = ref(true)
const actions = ref([])
const summary = ref(null)
const activeFilter = ref("all")

const filterTabs = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "closed", label: "Closed" },
]

const filteredActions = computed(() => {
	if (activeFilter.value === "all") return actions.value
	if (activeFilter.value === "active") {
		return actions.value.filter(a =>
			!["Closed", "Rejected", "Cancelled"].includes(a.status)
		)
	}
	return actions.value.filter(a =>
		["Closed", "Rejected", "Cancelled"].includes(a.status)
	)
})

function statusClass(status) {
	const map = {
		"Draft": "bg-gray-100 text-gray-700",
		"Under Investigation": "bg-blue-100 text-blue-700",
		"Pending Employee Defense": "bg-orange-100 text-orange-700",
		"Pending HR": "bg-icd-50 text-icd-600",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Appealed": "bg-indigo-100 text-indigo-700",
		"Closed": "bg-gray-100 text-gray-600",
		"Cancelled": "bg-gray-100 text-gray-600",
	}
	return map[status] || "bg-gray-100 text-gray-600"
}

function severityClass(severity) {
	const map = {
		"Minor": "bg-yellow-100 text-yellow-700",
		"Moderate": "bg-orange-100 text-orange-700",
		"Major": "bg-red-100 text-red-700",
		"Critical": "bg-red-200 text-red-800",
	}
	return map[severity] || "bg-gray-100 text-gray-600"
}

function severityBorder(severity) {
	const map = {
		"Minor": "border-l-4 border-l-yellow-400",
		"Moderate": "border-l-4 border-l-orange-400",
		"Major": "border-l-4 border-l-red-500",
		"Critical": "border-l-4 border-l-red-700",
	}
	return map[severity] || ""
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function timeAgo(date) {
	if (!date) return ""
	return dayjs(date).fromNow()
}

function isWithinAppealWindow(action) {
	if (!action.appeal_deadline) return false
	return dayjs(action.appeal_deadline).isAfter(dayjs())
}

function appealDaysLeft(action) {
	if (!action.appeal_deadline) return ""
	const days = dayjs(action.appeal_deadline).diff(dayjs(), "day")
	if (days <= 0) return __("Last day")
	return __("{0}d left", [days])
}

async function loadData() {
	loading.value = true
	try {
		const [actRes, sumRes] = await Promise.all([
			call(`${API_BASE}.get_my_disciplinary_actions`, { limit: 50 }),
			call(`${API_BASE}.get_disciplinary_summary`),
		])
		actions.value = actRes?.actions || []
		summary.value = sumRes || null
	} catch (e) {
		_errToast(e, "Failed to load disciplinary actions")
	} finally {
		loading.value = false
	}
}

onMounted(loadData)
</script>
