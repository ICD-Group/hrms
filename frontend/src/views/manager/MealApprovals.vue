<template>
	<BaseLayout :pageTitle="__('Meal Approvals')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Summary -->
				<div v-if="summary" class="grid grid-cols-3 gap-2">
					<div class="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
						<div class="text-lg font-bold text-orange-700">{{ summary.pending_hr }}</div>
						<div class="text-[11px] text-orange-600 font-medium">Pending HR</div>
					</div>
					<div class="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
						<div class="text-lg font-bold text-purple-700">{{ summary.pending_ceo }}</div>
						<div class="text-[11px] text-purple-600 font-medium">Pending CEO</div>
					</div>
					<div class="bg-green-50 rounded-xl p-3 text-center border border-green-100">
						<div class="text-lg font-bold text-green-700">{{ fmt(summary.total_amount) }}</div>
						<div class="text-[11px] text-green-600 font-medium">Total Amount</div>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!requests.length" class="text-center py-16">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<FeatherIcon name="check-circle" class="w-8 h-8 text-gray-700" />
					</div>
					<div class="text-sm font-semibold text-gray-700">{{ __("All Clear") }}</div>
					<div class="text-xs text-gray-700 mt-1">{{ __("No pending meal requests") }}</div>
				</div>

				<!-- Request Cards -->
				<div v-else class="flex flex-col gap-2">
					<div v-for="req in requests" :key="req.name" class="card-premium p-3.5">
						<div class="flex items-start justify-between mb-2">
							<div>
								<div class="text-base font-bold text-gray-900">{{ req.employee_name }}</div>
								<div class="text-sm text-gray-700">{{ req.department }}</div>
							</div>
							<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusCls(req.status)">
								{{ req.status }}
							</span>
						</div>

						<div class="flex flex-col gap-1.5 mb-2.5">
							<div class="flex items-center justify-between text-xs">
								<span class="text-gray-700">Restaurant</span>
								<span class="font-bold text-gray-800">{{ req.restaurant_name }}</span>
							</div>
							<div class="flex items-center justify-between text-xs">
								<span class="text-gray-700">Type</span>
								<span class="font-semibold text-gray-700">{{ req.meal_type }}</span>
							</div>
							<div class="flex items-center justify-between text-xs">
								<span class="text-gray-700">Amount</span>
								<span class="font-black text-emerald-700">{{ fmt(req.amount) }} EGP</span>
							</div>
							<div class="flex items-center justify-between text-xs">
								<span class="text-gray-700">Date</span>
								<span class="font-semibold text-gray-700">{{ req.request_date }}</span>
							</div>
							<div v-if="req.paid_by" class="flex items-center justify-between text-xs">
								<span class="text-gray-700">Paid By</span>
								<span class="font-semibold text-gray-700">{{ req.paid_by }}</span>
							</div>
							<div v-if="req.meal_description" class="text-xs text-gray-600 italic mt-0.5">
								{{ req.meal_description }}
							</div>
							<div v-if="req.reason" class="text-xs text-gray-600 italic">
								Reason: {{ req.reason }}
							</div>
						</div>

						<!-- Actions -->
						<div v-if="req.status === 'Pending HR' || req.status === 'Pending CEO'" class="flex gap-2 mt-2">
							<button @click="approveMeal(req)" :disabled="req._processing"
								class="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
								{{ req._processing === 'approve' ? '...' : (req.status === 'Pending HR' ? 'HR Approve' : 'CEO Approve') }}
							</button>
							<button @click="openRejectSheet(req)" :disabled="req._processing"
								class="flex-1 bg-red-50 text-red-600 border border-red-200/50 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
								Reject
							</button>
						</div>
					</div>
				</div>

				<!-- Bulk HR Approve -->
				<div v-if="pendingHRCount > 1"
					class="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex justify-center shadow-lg z-10 rounded-xl">
					<button @click="bulkApproveHR" :disabled="bulkProcessing"
						class="flex-1 bg-green-600 text-white rounded-xl py-3 text-xs font-bold disabled:opacity-50">
						{{ bulkProcessing ? '...' : `Approve ALL Pending HR (${pendingHRCount})` }}
					</button>
				</div>
			</div>

			<!-- Reject Reason Bottom Sheet -->
			<div v-if="rejectSheet.show" class="fixed inset-0 z-50 flex items-end justify-center">
				<div class="absolute inset-0 bg-black/30" @click="rejectSheet.show = false"></div>
				<div class="relative bg-white rounded-t-2xl w-full max-w-lg p-5 pb-8 z-10">
					<div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
					<div class="text-base font-bold text-gray-900 mb-1">Reject Meal Request</div>
					<div class="text-xs text-gray-700 mb-3">{{ rejectSheet.empName }}</div>
					<textarea v-model="rejectSheet.reason" rows="3" placeholder="Enter reason for rejection..."
						class="w-full p-3 text-sm bg-gray-100 rounded-xl border border-gray-200 outline-none text-gray-800 resize-none mb-3"></textarea>
					<div class="flex gap-2">
						<button @click="confirmReject" :disabled="rejectSheet.processing"
							class="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
							{{ rejectSheet.processing ? '...' : 'Confirm Reject' }}
						</button>
						<button @click="rejectSheet.show = false"
							class="px-6 bg-gray-100 text-gray-600 rounded-xl py-3 text-sm font-bold">
							Cancel
						</button>
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from "vue"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const isLoading = ref(false)
const bulkProcessing = ref(false)
const requests = ref([])
const summary = ref(null)

const rejectSheet = reactive({ show: false, empName: "", reqName: "", reason: "", processing: false })

const pendingHRCount = computed(() => requests.value.filter(r => r.status === "Pending HR").length)

async function loadData() {
	isLoading.value = true
	try {
		const res = await call(`${API}.get_pending_meal_approvals`)
		requests.value = (res?.requests || []).map(r => ({ ...r, _processing: null }))
		summary.value = res?.summary || null
	} catch (e) { _errToast(e, "Failed to load meal approvals") }
	isLoading.value = false
}

async function approveMeal(req) {
	req._processing = "approve"
	try {
		const method = req.status === "Pending HR" ? `${API}.hr_approve_meal` : `${API}.ceo_approve_meal`
		await call(method, { claim_name: req.name })
		await loadData()
	} catch (e) { _errToast(e, "Failed to approve meal") }
	req._processing = null
}

function openRejectSheet(req) {
	rejectSheet.empName = req.employee_name
	rejectSheet.reqName = req.name
	rejectSheet.reason = ""
	rejectSheet.processing = false
	rejectSheet.show = true
}

async function confirmReject() {
	rejectSheet.processing = true
	try {
		await call(`${API}.reject_meal`, {
			claim_name: rejectSheet.reqName,
			reason: rejectSheet.reason || undefined
		})
		rejectSheet.show = false
		await loadData()
	} catch (e) { _errToast(e, "Failed to reject meal") }
	rejectSheet.processing = false
}

async function bulkApproveHR() {
	bulkProcessing.value = true
	try {
		const names = requests.value.filter(r => r.status === "Pending HR").map(r => r.name)
		await call(`${API}.bulk_approve_meals`, { request_names: JSON.stringify(names), level: "hr" })
		await loadData()
	} catch (e) { _errToast(e, "Bulk approve failed") }
	bulkProcessing.value = false
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function statusCls(status) {
	return {
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Ordered": "bg-blue-100 text-blue-700",
		"Delivered": "bg-emerald-100 text-emerald-700",
	}[status] || "bg-gray-100 text-gray-600"
}

onMounted(loadData)
</script>
