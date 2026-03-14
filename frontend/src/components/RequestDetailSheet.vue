<template>
	<Teleport to="body">
		<transition name="sheet">
			<div v-if="visible" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
				<!-- Backdrop -->
				<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

				<!-- Sheet -->
				<div class="sheet-content relative w-full sm:max-w-lg max-h-[92vh] flex flex-col z-10 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl sheet-glass">
					<!-- Handle bar (mobile) -->
					<div class="flex justify-center pt-3 pb-1 sm:hidden">
						<div class="w-12 h-1.5 rounded-full bg-gray-300/50"></div>
					</div>

					<!-- Type accent bar -->
					<div class="h-[3px]" :class="typeStyle.accent"></div>

					<!-- Header -->
					<div class="flex items-center justify-between px-5 py-3.5 border-b border-white/30">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" :class="typeStyle.bg">
								<FeatherIcon :name="typeStyle.icon" class="w-[18px] h-[18px]" :class="typeStyle.color" />
							</div>
							<div>
								<div class="text-sm font-bold text-gray-900">{{ typeStyle.label }}</div>
								<div class="text-[11px] text-gray-600 font-mono">{{ docname }}</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-[11px] font-bold px-2.5 py-1 rounded-full" :class="statusClass">
								{{ docData?.status || docData?.approval_status || docData?.workflow_state || __('Loading') }}
							</span>
							<button @click="close" class="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center active:bg-white/60 transition-colors">
								<FeatherIcon name="x" class="w-4 h-4 text-gray-700" />
							</button>
						</div>
					</div>

					<!-- Content (scrollable) -->
					<div class="flex-1 overflow-y-auto px-5 py-4">
						<!-- Loading -->
						<div v-if="loading" class="flex items-center justify-center py-16">
							<LoadingIndicator class="w-8 h-8 text-gray-600" />
						</div>

						<!-- Error -->
						<div v-else-if="error" class="text-center py-10">
							<div class="w-14 h-14 rounded-2xl bg-red-100/60 flex items-center justify-center mx-auto mb-3">
								<FeatherIcon name="alert-circle" class="w-7 h-7 text-red-400" />
							</div>
							<div class="text-sm font-semibold text-gray-600">{{ __("Could not load details") }}</div>
							<div class="text-xs text-gray-600 mt-1">{{ __("Please try again") }}</div>
						</div>

						<!-- Document Data -->
						<div v-else-if="docData" class="flex flex-col gap-3.5">
							<!-- Employee Info Card -->
							<div class="employee-glass-card rounded-2xl p-4">
								<div class="flex items-center gap-3">
									<EmployeeAvatar :employeeID="docData.employee" size="xl" />
									<div class="flex-1">
										<div class="text-sm font-bold text-gray-900">{{ docData.employee_name }}</div>
										<div class="text-xs text-gray-700">{{ docData.employee }}</div>
										<div v-if="docData.department" class="text-[11px] text-gray-600 mt-0.5">{{ docData.department }}</div>
									</div>
								</div>
							</div>

							<!-- WORK REQUEST Details -->
							<template v-if="doctype === 'ICD3S Work Request'">
								<div class="detail-card-glass bg-gradient-to-br from-indigo-50/80 to-indigo-100/30 border border-indigo-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Type')" :value="docData.request_type" />
										<FieldItem :label="__('Status')" :value="docData.status" />
										<FieldItem :label="__('From')" :value="formatDateTime(docData.from_datetime)" />
										<FieldItem :label="__('To')" :value="formatDateTime(docData.to_datetime)" />
										<FieldItem :label="__('Hours')" :value="docData.total_hours ? docData.total_hours + 'h' : '-'" />
										<FieldItem v-if="docData.mission_location" :label="__('Location')" :value="docData.mission_location" />
										<FieldItem v-if="docData.mission_client" :label="__('Client')" :value="docData.mission_client" class="col-span-2" />
									</div>
								</div>
								<ReasonBox v-if="docData.reason" :reason="docData.reason" />
							</template>

							<!-- LEAVE Details -->
							<template v-else-if="doctype === 'Leave Application'">
								<div class="detail-card-glass bg-gradient-to-br from-blue-50/80 to-blue-100/30 border border-blue-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Leave Type')" :value="docData.leave_type" class="col-span-2" />
										<FieldItem :label="__('From')" :value="docData.from_date" />
										<FieldItem :label="__('To')" :value="docData.to_date" />
										<FieldItem :label="__('Days')" :value="docData.total_leave_days" />
										<FieldItem :label="__('Status')" :value="docData.status" />
										<FieldItem v-if="docData.half_day" :label="__('Half Day')" :value="docData.half_day_date" />
									</div>
								</div>
								<ReasonBox v-if="docData.description" :reason="docData.description" :label="__('Reason')" />
							</template>

							<!-- EXPENSE CLAIM Details -->
							<template v-else-if="doctype === 'Expense Claim'">
								<div class="detail-card-glass bg-gradient-to-br from-green-50/80 to-green-100/30 border border-green-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Amount')" :value="'EGP ' + docData.total_claimed_amount" />
										<FieldItem :label="__('Date')" :value="docData.posting_date" />
										<FieldItem :label="__('Status')" :value="docData.approval_status || docData.status" />
									</div>
								</div>
								<!-- Expense items -->
								<div v-if="docData.expenses?.length" class="detail-card-glass bg-gradient-to-r from-gray-50/60 to-white/40 border border-gray-200/30">
									<div class="text-[11px] font-semibold text-gray-700/70 uppercase tracking-wider mb-2">{{ __("Items") }}</div>
									<div v-for="(exp, idx) in docData.expenses" :key="idx" class="flex justify-between text-xs py-1.5 border-b border-gray-200/20 last:border-0">
										<span class="text-gray-700">{{ exp.expense_type }}</span>
										<span class="font-bold text-gray-900">{{ exp.amount }}</span>
									</div>
								</div>
							</template>

							<!-- MEAL CLAIM Details -->
							<template v-else-if="doctype === 'ICD3S Meal Claim'">
								<div class="detail-card-glass bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 border border-emerald-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Restaurant')" :value="docData.restaurant_name" />
										<FieldItem :label="__('Meal Type')" :value="docData.meal_type" />
										<FieldItem :label="__('Amount')" :value="docData.amount" />
										<FieldItem :label="__('Date')" :value="docData.claim_date" />
										<FieldItem :label="__('Status')" :value="docData.status" />
									</div>
								</div>
								<ReasonBox v-if="docData.reason" :reason="docData.reason" />
							</template>

							<!-- ATTENDANCE CORRECTION Details -->
							<template v-else-if="doctype === 'ICD3S Attendance Correction'">
								<div class="detail-card-glass bg-gradient-to-br from-purple-50/80 to-purple-100/30 border border-purple-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Type')" :value="docData.correction_type" />
										<FieldItem :label="__('Date')" :value="docData.correction_date" />
										<FieldItem :label="__('Status')" :value="docData.status" />
										<FieldItem v-if="docData.corrected_check_in" :label="__('Check In')" :value="formatDateTime(docData.corrected_check_in)" />
										<FieldItem v-if="docData.corrected_check_out" :label="__('Check Out')" :value="formatDateTime(docData.corrected_check_out)" />
									</div>
								</div>
								<ReasonBox v-if="docData.reason" :reason="docData.reason" />
							</template>

							<!-- LATE PENALTY / EXCUSE Details -->
							<template v-else-if="doctype === 'ICD3S Late Penalty'">
								<div class="detail-card-glass bg-gradient-to-br from-orange-50/80 to-orange-100/30 border border-orange-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Penalty Type')" :value="docData.penalty_type" />
										<FieldItem :label="__('Level')" :value="docData.penalty_level" />
										<FieldItem :label="__('Date')" :value="docData.attendance_date" />
										<FieldItem :label="__('Deduction')" :value="docData.deduction_days ? docData.deduction_days + ' day(s)' : '0'" />
										<FieldItem v-if="docData.late_minutes" :label="__('Late Minutes')" :value="docData.late_minutes + ' min'" />
										<FieldItem v-if="docData.early_minutes" :label="__('Early Exit')" :value="docData.early_minutes + ' min'" />
										<FieldItem :label="__('Excuse Status')" :value="docData.excuse_status || __('None')" />
										<FieldItem v-if="docData.monthly_late_count" :label="__('Monthly Count')" :value="docData.monthly_late_count" />
									</div>
								</div>
								<div v-if="docData.actual_check_in || docData.actual_check_out" class="detail-card-glass bg-gradient-to-r from-gray-50/60 to-white/40 border border-gray-200/30">
									<div class="text-[11px] font-semibold text-gray-700/70 uppercase tracking-wider mb-2">{{ __("Timing") }}</div>
									<div class="grid grid-cols-2 gap-3">
										<FieldItem v-if="docData.shift_start_time" :label="__('Shift Start')" :value="docData.shift_start_time" />
										<FieldItem v-if="docData.actual_check_in" :label="__('Actual Check-in')" :value="formatDateTime(docData.actual_check_in)" />
										<FieldItem v-if="docData.shift_end_time" :label="__('Shift End')" :value="docData.shift_end_time" />
										<FieldItem v-if="docData.actual_check_out" :label="__('Actual Check-out')" :value="formatDateTime(docData.actual_check_out)" />
									</div>
								</div>
								<ReasonBox v-if="docData.excuse_reason" :reason="docData.excuse_reason" :label="__('Excuse Reason')" />
								<ReasonBox v-if="docData.excuse_rejection_reason" :reason="docData.excuse_rejection_reason" :label="__('Rejection Reason')" />
							</template>

							<!-- SHIFT SWAP Details -->
							<template v-else-if="doctype === 'ICD3S Shift Swap'">
								<div class="detail-card-glass bg-gradient-to-br from-pink-50/80 to-pink-100/30 border border-pink-200/30">
									<div class="flex items-center justify-between mb-3">
										<div class="text-center flex-1">
											<div class="text-xs font-semibold text-gray-900">{{ docData.requester_name }}</div>
											<div class="text-[11px] text-pink-600 mt-0.5">{{ docData.requester_shift_type }}</div>
										</div>
										<div class="mx-3">
											<div class="w-8 h-8 rounded-full bg-pink-100/60 flex items-center justify-center">
												<FeatherIcon name="repeat" class="w-4 h-4 text-pink-500" />
											</div>
										</div>
										<div class="text-center flex-1">
											<div class="text-xs font-semibold text-gray-900">{{ docData.target_employee_name }}</div>
											<div class="text-[11px] text-pink-600 mt-0.5">{{ docData.target_shift_type }}</div>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-3 pt-3 border-t border-pink-200/30">
										<FieldItem :label="__('Swap Date')" :value="docData.swap_date" />
										<FieldItem :label="__('Status')" :value="docData.status" />
									</div>
								</div>
								<ReasonBox v-if="docData.reason" :reason="docData.reason" />
							</template>

							<!-- DEVICE BINDING Details -->
							<template v-else-if="doctype === 'ICD3S Device Binding'">
								<div class="detail-card-glass bg-gradient-to-br from-amber-50/80 to-amber-100/30 border border-amber-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Device')" :value="docData.device_name || docData.device_model || '-'" />
										<FieldItem :label="__('Model')" :value="docData.device_model || '-'" />
										<FieldItem :label="__('OS')" :value="docData.os_version || '-'" />
										<FieldItem :label="__('Status')" :value="docData.status" />
										<FieldItem v-if="docData.registered_on" :label="__('Registered')" :value="docData.registered_on?.split(' ')[0]" />
									</div>
								</div>
							</template>

							<!-- ATTENDANCE REQUEST Details -->
							<template v-else-if="doctype === 'Attendance Request'">
								<div class="detail-card-glass bg-gradient-to-br from-teal-50/80 to-teal-100/30 border border-teal-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('From')" :value="docData.from_date" />
										<FieldItem :label="__('To')" :value="docData.to_date" />
										<FieldItem :label="__('Status')" :value="docData.workflow_state || docData.status" />
									</div>
								</div>
								<ReasonBox v-if="docData.reason" :reason="docData.reason" />
							</template>

							<!-- EMPLOYEE ADVANCE Details -->
							<template v-else-if="doctype === 'Employee Advance'">
								<div class="detail-card-glass bg-gradient-to-br from-cyan-50/80 to-cyan-100/30 border border-cyan-200/30">
									<div class="grid grid-cols-2 gap-3">
										<FieldItem :label="__('Amount')" :value="'EGP ' + docData.advance_amount" />
										<FieldItem :label="__('Date')" :value="docData.posting_date" />
										<FieldItem :label="__('Status')" :value="docData.status" />
									</div>
								</div>
								<ReasonBox v-if="docData.purpose" :reason="docData.purpose" :label="__('Purpose')" />
							</template>

							<!-- GENERIC FALLBACK -->
							<template v-else>
								<div class="detail-card-glass bg-gradient-to-r from-gray-50/60 to-white/40 border border-gray-200/30">
									<div class="grid grid-cols-2 gap-3">
										<template v-for="(val, key) in displayFields" :key="key">
											<FieldItem :label="formatLabel(key)" :value="val" />
										</template>
									</div>
								</div>
							</template>

							<!-- Timeline / Notes -->
							<div v-if="docData._comments?.length" class="detail-card-glass bg-gradient-to-r from-gray-50/60 to-white/40 border border-gray-200/30">
								<div class="text-[11px] font-semibold text-gray-700/70 uppercase tracking-wider mb-2">{{ __("Comments") }}</div>
								<div v-for="(c, idx) in parsedComments" :key="idx" class="text-xs text-gray-600 py-1.5 border-b border-gray-200/20 last:border-0">
									<span class="font-bold text-gray-800">{{ c.by }}</span>: {{ c.text }}
								</div>
							</div>
						</div>
					</div>

					<!-- Action Buttons (for manager) -->
					<div v-if="isManager && showActions && docData && isActionable" class="px-5 py-4 border-t border-white/30 action-bar-glass">
						<div class="flex gap-3">
							<button @click="$emit('approve', { doctype, name: docname, data: docData })" :disabled="processing"
								class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-green-500/20 active:shadow-sm active:from-green-600 active:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
								<FeatherIcon name="check" class="w-4 h-4" />
								{{ processing === 'approve' ? __("Approving...") : approveLabel }}
							</button>
							<button @click="$emit('reject', { doctype, name: docname, data: docData })" :disabled="processing"
								class="flex-1 bg-red-50/80 text-red-600 border border-red-200/50 rounded-2xl py-3.5 text-sm font-bold active:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
								<FeatherIcon name="x" class="w-4 h-4" />
								{{ processing === 'reject' ? __("Rejecting...") : __("Reject") }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup>
import { ref, computed, watch, inject } from "vue"
import { FeatherIcon, LoadingIndicator, call } from "frappe-ui"
import EmployeeAvatar from "@/components/EmployeeAvatar.vue"

const __ = inject("$translate")

const props = defineProps({
	visible: { type: Boolean, default: false },
	doctype: { type: String, default: "" },
	docname: { type: String, default: "" },
	isManager: { type: Boolean, default: false },
	showActions: { type: Boolean, default: true },
	processing: { type: [String, Boolean], default: false },
})

const emit = defineEmits(["close", "approve", "reject"])

const docData = ref(null)
const loading = ref(false)
const error = ref(false)

function close() {
	emit("close")
}

// Fetch document when opened
watch(() => props.visible, async (show) => {
	if (show && props.doctype && props.docname) {
		loading.value = true
		error.value = false
		docData.value = null
		try {
			const res = await call("frappe.client.get", {
				doctype: props.doctype,
				name: props.docname,
			})
			docData.value = res
		} catch (e) {
			console.error("[RequestDetail] Fetch error:", e)
			error.value = true
		} finally {
			loading.value = false
		}
	}
})

// Type styling
const TYPE_STYLES = {
	"ICD3S Work Request": { icon: "briefcase", bg: "bg-gradient-to-br from-indigo-100 to-indigo-50", color: "text-indigo-600", accent: "bg-gradient-to-r from-indigo-500 to-indigo-400", label: "Work Request" },
	"Leave Application": { icon: "calendar", bg: "bg-gradient-to-br from-blue-100 to-blue-50", color: "text-blue-600", accent: "bg-gradient-to-r from-blue-500 to-blue-400", label: "Leave" },
	"Expense Claim": { icon: "credit-card", bg: "bg-gradient-to-br from-green-100 to-green-50", color: "text-green-600", accent: "bg-gradient-to-r from-green-500 to-green-400", label: "Expense" },
	"ICD3S Meal Claim": { icon: "coffee", bg: "bg-gradient-to-br from-emerald-100 to-emerald-50", color: "text-emerald-600", accent: "bg-gradient-to-r from-emerald-500 to-emerald-400", label: "Meal Claim" },
	"ICD3S Attendance Correction": { icon: "edit-3", bg: "bg-gradient-to-br from-purple-100 to-purple-50", color: "text-purple-600", accent: "bg-gradient-to-r from-purple-500 to-purple-400", label: "Correction" },
	"ICD3S Shift Swap": { icon: "repeat", bg: "bg-gradient-to-br from-pink-100 to-pink-50", color: "text-pink-600", accent: "bg-gradient-to-r from-pink-500 to-pink-400", label: "Shift Swap" },
	"ICD3S Late Penalty": { icon: "clock", bg: "bg-gradient-to-br from-orange-100 to-orange-50", color: "text-orange-600", accent: "bg-gradient-to-r from-orange-500 to-orange-400", label: "Late Excuse" },
	"ICD3S Device Binding": { icon: "smartphone", bg: "bg-gradient-to-br from-amber-100 to-amber-50", color: "text-amber-600", accent: "bg-gradient-to-r from-amber-500 to-amber-400", label: "Device" },
	"Attendance Request": { icon: "check-circle", bg: "bg-gradient-to-br from-teal-100 to-teal-50", color: "text-teal-600", accent: "bg-gradient-to-r from-teal-500 to-teal-400", label: "Attendance" },
	"Employee Advance": { icon: "dollar-sign", bg: "bg-gradient-to-br from-cyan-100 to-cyan-50", color: "text-cyan-600", accent: "bg-gradient-to-r from-cyan-500 to-cyan-400", label: "Advance" },
	"Shift Request": { icon: "clock", bg: "bg-gradient-to-br from-orange-100 to-orange-50", color: "text-orange-600", accent: "bg-gradient-to-r from-orange-500 to-orange-400", label: "Shift Request" },
	"Salary Slip": { icon: "file-text", bg: "bg-gradient-to-br from-gray-100 to-gray-50", color: "text-gray-600", accent: "bg-gradient-to-r from-gray-500 to-gray-400", label: "Salary Slip" },
}

const typeStyle = computed(() => {
	return TYPE_STYLES[props.doctype] || { icon: "file", bg: "bg-gray-100", color: "text-gray-600", accent: "bg-gray-400", label: props.doctype }
})

const statusClass = computed(() => {
	const s = (docData.value?.status || docData.value?.approval_status || docData.value?.workflow_state || "").toLowerCase()
	const map = {
		"pending": "bg-orange-100/80 text-orange-700",
		"pending hr": "bg-orange-100/80 text-orange-700",
		"pending ceo": "bg-purple-100/80 text-purple-700",
		"approved": "bg-green-100/80 text-green-700",
		"active": "bg-blue-100/80 text-blue-700",
		"rejected": "bg-red-100/80 text-red-700",
		"cancelled": "bg-gray-100/80 text-gray-700",
		"draft": "bg-gray-100/80 text-gray-600",
		"open": "bg-blue-100/80 text-blue-700",
	}
	return map[s] || "bg-gray-100/80 text-gray-600"
})

// Check if document is actionable (not already approved/rejected)
const NON_ACTIONABLE = new Set(["approved", "rejected", "cancelled", "closed"])

const isActionable = computed(() => {
	if (!docData.value) return false
	const status = (docData.value.status || "").toLowerCase()
	const approvalStatus = (docData.value.approval_status || "").toLowerCase()
	const workflowState = (docData.value.workflow_state || "").toLowerCase()
	if (NON_ACTIONABLE.has(status) || NON_ACTIONABLE.has(approvalStatus) || NON_ACTIONABLE.has(workflowState)) return false
	// Employee Advance: docstatus 1 = already submitted/approved
	if (props.doctype === "Employee Advance" && docData.value.docstatus === 1) return false
	return true
})

const approveLabel = computed(() => {
	const s = docData.value?.status
	if (s === "Pending HR") return __("HR Approve")
	if (s === "Pending CEO") return __("CEO Approve")
	return __("Approve")
})

function formatDateTime(dt) {
	if (!dt) return "-"
	return dt.replace("T", " ").slice(0, 16)
}

function formatLabel(key) {
	return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// For generic fallback - show meaningful fields
const SKIP_FIELDS = new Set(["name", "doctype", "docstatus", "owner", "creation", "modified", "modified_by", "_user_tags", "_comments", "_assign", "_liked_by", "idx", "parent", "parenttype", "parentfield"])

const displayFields = computed(() => {
	if (!docData.value) return {}
	const result = {}
	let count = 0
	for (const [key, val] of Object.entries(docData.value)) {
		if (SKIP_FIELDS.has(key) || key.startsWith("_") || val === null || val === "" || typeof val === "object") continue
		if (count >= 12) break
		result[key] = val
		count++
	}
	return result
})

const parsedComments = computed(() => {
	if (!docData.value?._comments) return []
	try {
		const raw = typeof docData.value._comments === "string" ? JSON.parse(docData.value._comments) : docData.value._comments
		return raw.map(c => ({ by: c.comment_by?.split("@")[0] || "System", text: c.comment || "" })).slice(0, 5)
	} catch { return [] }
})
</script>

<!-- FieldItem sub-component -->
<script>
import { defineComponent, h } from "vue"
const FieldItem = defineComponent({
	props: { label: String, value: [String, Number] },
	setup(props) {
		return () => h("div", [
			h("div", { class: "text-[11px] font-semibold text-gray-700/70 uppercase tracking-wider" }, props.label),
			h("div", { class: "text-[13px] text-gray-900 font-semibold mt-0.5" }, props.value ?? "-"),
		])
	},
})
const ReasonBox = defineComponent({
	props: { reason: String, label: { type: String, default: "Reason" } },
	setup(props) {
		return () => h("div", { class: "detail-card-glass bg-gradient-to-r from-gray-50/70 to-white/40 border border-gray-200/30" }, [
			h("div", { class: "text-[11px] font-semibold text-gray-700/70 uppercase tracking-wider mb-1.5" }, props.label),
			h("div", { class: "text-[13px] text-gray-700 leading-relaxed" }, props.reason),
		])
	},
})
export { FieldItem, ReasonBox }
</script>

<style scoped>
.sheet-glass {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.95) 100%);
	backdrop-filter: blur(40px) saturate(180%);
	-webkit-backdrop-filter: blur(40px) saturate(180%);
}

.action-bar-glass {
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
}

.employee-glass-card {
	background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.4) 100%);
	border: 0.5px solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.detail-card-glass {
	border-radius: 1rem;
	padding: 1rem;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.sheet-enter-active,
.sheet-leave-active {
	transition: all 0.3s ease;
}
.sheet-enter-active .sheet-content,
.sheet-leave-active .sheet-content {
	transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
	opacity: 0;
}
.sheet-enter-from .sheet-content {
	transform: translateY(100%);
}
.sheet-leave-to .sheet-content {
	transform: translateY(100%);
}
</style>
