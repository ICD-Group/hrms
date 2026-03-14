<template>
	<div class="glass-section rounded-xl p-3">
		<div class="flex items-center justify-between mb-2">
			<div class="flex items-center gap-2">
				<div class="w-9 h-9 rounded-md bg-icd-50 flex items-center justify-center">
					<FeatherIcon name="file-text" class="w-5 h-5 text-icd-600" />
				</div>
				<span class="text-[15px] font-bold text-gray-900">{{ __("Recent Requests") }}</span>
			</div>
			<button @click="router.push('/my-requests')" class="text-xs font-semibold text-icd-600 active:text-icd-800">
				{{ __("See All") }}
			</button>
		</div>

		<div v-if="requests.loading && !items.length" class="py-3 text-center">
			<LoadingIndicator class="w-5 h-5 text-gray-700 mx-auto" />
		</div>
		<div v-else-if="!items.length" class="text-center py-3 text-xs text-gray-600">
			{{ __("No requests yet") }}
		</div>
		<div v-else class="flex flex-col gap-0.5">
			<button v-for="req in items" :key="req.name" class="flex items-center gap-2.5 py-1.5 px-1.5 rounded-lg active:bg-white/50 transition-colors text-left w-full">
				<div class="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" :style="{ backgroundColor: typeStyle(req.type).bgLight }">
					<FeatherIcon :name="typeStyle(req.type).icon" style="width:22px;height:22px" :style="{ color: typeStyle(req.type).color }" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold text-gray-900 truncate">{{ req.type }}</div>
					<div class="text-xs text-gray-700 truncate">{{ req.detail }}</div>
				</div>
				<span class="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" :class="statusCls(req.status)">
					{{ req.status }}
				</span>
			</button>
		</div>
	</div>
</template>

<script setup>
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { FeatherIcon, LoadingIndicator, createResource } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()

const requests = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.get_my_requests",
	auto: true,
	cache: "genius:my_requests",
	makeParams() { return { limit: 5 } },
})

const items = computed(() => requests.data?.requests || [])

function typeStyle(type) {
	const map = {
		"Leave":        { icon: "calendar",    color: "#2563eb", bgLight: "#eff6ff" },
		"Correction":   { icon: "edit-3",      color: "#7c3aed", bgLight: "#f5f3ff" },
		"Attendance":   { icon: "check-circle", color: "#16a34a", bgLight: "#f0fdf4" },
		"Expense":      { icon: "credit-card", color: "#d97706", bgLight: "#fffbeb" },
		"Shift Swap":   { icon: "repeat",      color: "#db2777", bgLight: "#fdf2f8" },
		"Late Excuse":  { icon: "clock",       color: "#ea580c", bgLight: "#fff7ed" },
		"Meal Claim":   { icon: "coffee",      color: "#059669", bgLight: "#ecfdf5" },
		"Work Request": { icon: "briefcase",   color: "#4f46e5", bgLight: "#eef2ff" },
	}
	return map[type] || { icon: "file", color: "#6b7280", bgLight: "#f9fafb" }
}

function statusCls(status) {
	return {
		"Pending": "bg-orange-100 text-orange-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Cancelled": "bg-gray-100 text-gray-700",
		"Draft": "bg-gray-100 text-gray-700",
	}[status] || "bg-gray-100 text-gray-600"
}
</script>
