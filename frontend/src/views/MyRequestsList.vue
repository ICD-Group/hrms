<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900">{{ __('My Requests') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col p-4 gap-4">
				<!-- Filter Tabs -->
				<div class="flex gap-2 overflow-x-auto pb-1">
					<button v-for="tab in filterTabs" :key="tab.value"
						@click="activeFilter = tab.value"
						class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
						:class="activeFilter === tab.value ? 'bg-icd-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ tab.label }}
					</button>
				</div>

				<div v-if="requests.loading || daResource.loading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>
				<div v-else-if="!filteredRequests.length" class="text-center py-10 text-sm text-gray-700">
					{{ __("No requests found") }}
				</div>
				<div v-else class="flex flex-col gap-2">
					<div v-for="req in filteredRequests" :key="req.name"
						class="card-premium p-4 cursor-pointer active:scale-[0.98] transition-transform"
						@click="openDetail(req)">
						<div class="flex items-start justify-between mb-1.5">
							<div class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="typeIcon(req.type).bg">
									<FeatherIcon :name="typeIcon(req.type).icon" class="w-3.5 h-3.5" :class="typeIcon(req.type).color" />
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{{ req.type }}</div>
									<div class="text-xs text-gray-700">{{ req.detail }}</div>
								</div>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusCls(req.status)">
									{{ req.status }}
								</span>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700" />
							</div>
						</div>
						<div class="flex items-center justify-between mt-2">
							<div class="flex items-center gap-3 text-[11px] text-gray-600">
								<span class="flex items-center gap-1">
									<FeatherIcon name="calendar" class="w-3" />
									{{ req.date_info }}
								</span>
								<span class="text-gray-700">{{ req.name }}</span>
							</div>
							<button
								v-if="req.type === 'Work Request' && ['Pending', 'Approved'].includes(req.status)"
								@click.stop="cancelWorkRequest(req)"
								:disabled="req._cancelling"
								class="text-[11px] font-bold px-2 py-1 rounded-lg text-red-600 bg-red-50 active:bg-red-100 disabled:opacity-50"
							>
								{{ req._cancelling ? __("...") : __("Cancel") }}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Request Detail Sheet -->
			<RequestDetailSheet
				:visible="detailSheet.show"
				:doctype="detailSheet.doctype"
				:docname="detailSheet.docname"
				:isManager="false"
				:showActions="false"
				@close="detailSheet.show = false"
			/>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, reactive, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { FeatherIcon, LoadingIndicator, Button, createResource, call, toast } from "frappe-ui"
import RequestDetailSheet from "@/components/RequestDetailSheet.vue"

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

const activeFilter = ref("all")

const requests = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.get_my_requests",
	auto: true,
	makeParams() { return { limit: 100 } },
})

const daResource = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.get_my_disciplinary_actions",
	auto: true,
	cache: "genius:emp_da_requests",
})

// Map DA status to filter-compatible status
const DA_FILTER_STATUS = {
	"Under Investigation": "Pending",
	"Pending Employee Defense": "Pending",
	"Pending HR": "Pending",
	"Pending CEO": "Pending",
	"Appealed": "Pending",
	"Approved": "Approved",
	"Closed": "Approved",
}

const allRequests = computed(() => {
	const reqs = requests.data?.requests || []
	const daActions = daResource.data?.actions || []
	// Convert DA items to request format and prepend (urgent first)
	const daItems = daActions.map(da => ({
		name: da.name,
		type: "Disciplinary",
		detail: `${da.action_type || ""}${da.severity ? " · " + da.severity : ""}`,
		status: da.status,
		_filterStatus: DA_FILTER_STATUS[da.status] || "Pending",
		date_info: da.incident_date,
		_isDisciplinary: true,
	}))
	return [...daItems, ...reqs]
})

const filteredRequests = computed(() => {
	if (activeFilter.value === "all") return allRequests.value
	return allRequests.value.filter(r => {
		if (r._isDisciplinary) return r._filterStatus === activeFilter.value
		return r.status === activeFilter.value
	})
})

const filterTabs = computed(() => [
	{ label: __("All"), value: "all" },
	{ label: __("Pending"), value: "Pending" },
	{ label: __("Approved"), value: "Approved" },
	{ label: __("Active"), value: "Active" },
	{ label: __("Rejected"), value: "Rejected" },
])

function typeIcon(type) {
	const map = {
		"Disciplinary": { icon: "shield", bg: "bg-red-50", color: "text-red-600" },
		"Leave": { icon: "calendar", bg: "bg-blue-50", color: "text-blue-600" },
		"Correction": { icon: "edit-3", bg: "bg-purple-50", color: "text-purple-600" },
		"Attendance": { icon: "check-circle", bg: "bg-green-50", color: "text-green-600" },
		"Expense": { icon: "credit-card", bg: "bg-amber-50", color: "text-amber-600" },
		"Shift Swap": { icon: "repeat", bg: "bg-pink-50", color: "text-pink-600" },
		"Late Excuse": { icon: "clock", bg: "bg-orange-50", color: "text-orange-600" },
		"Meal Claim": { icon: "coffee", bg: "bg-emerald-50", color: "text-emerald-600" },
		"Work Request": { icon: "briefcase", bg: "bg-indigo-50", color: "text-indigo-600" },
		"Loan": { icon: "credit-card", bg: "bg-teal-50", color: "text-teal-600" },
		"Advance": { icon: "dollar-sign", bg: "bg-cyan-50", color: "text-cyan-600" },
	}
	return map[type] || { icon: "file", bg: "bg-gray-100", color: "text-gray-600" }
}

function statusCls(status) {
	return {
		"Pending": "bg-orange-100 text-orange-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Active": "bg-blue-100 text-blue-700",
		"Cancelled": "bg-gray-100 text-gray-700",
		// Disciplinary statuses
		"Under Investigation": "bg-amber-100 text-amber-700",
		"Pending Employee Defense": "bg-red-100 text-red-700",
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Appealed": "bg-blue-100 text-blue-700",
		"Closed": "bg-gray-100 text-gray-700",
	}[status] || "bg-gray-100 text-gray-600"
}

// Map request type names to DocType names
const TYPE_TO_DOCTYPE = {
	"Leave": "Leave Application",
	"Correction": "ICD3S Attendance Correction",
	"Attendance": "Attendance Request",
	"Expense": "Expense Claim",
	"Shift Swap": "ICD3S Shift Swap",
	"Late Excuse": "ICD3S Late Penalty",
	"Meal Claim": "ICD3S Meal Claim",
	"Work Request": "ICD3S Work Request",
	"Loan": "Loan Application",
	"Advance": "Employee Advance",
}

// Detail sheet
const detailSheet = reactive({
	show: false,
	doctype: "",
	docname: "",
})

function openDetail(req) {
	if (req._isDisciplinary) {
		router.push({ name: "DisciplinaryDetail", params: { id: req.name } })
		return
	}
	const doctype = TYPE_TO_DOCTYPE[req.type]
	if (!doctype || !req.name) return
	detailSheet.doctype = doctype
	detailSheet.docname = req.name
	detailSheet.show = true
}

async function cancelWorkRequest(req) {
	if (!confirm(__("Cancel this work request?"))) return
	req._cancelling = true
	try {
		await call("icd3s_attendance.icd3s_attendance.api.attendance.cancel_work_request", {
			request_name: req.name,
		})
		toast({ title: __("Request cancelled"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		requests.reload()
	} catch (e) {
		_errToast(e, "Failed to cancel request")
		req._cancelling = false
	}
}
</script>
