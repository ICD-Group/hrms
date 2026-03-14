<template>
	<BaseLayout :pageTitle="__('Payroll Actions')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Period Selector -->
				<div class="flex items-center gap-3 card-premium p-3">
					<FeatherIcon name="calendar" class="w-5 h-5 text-icd-600 flex-shrink-0" />
					<select v-model="selectedMonth" @change="loadData"
						class="flex-1 bg-transparent text-gray-800 text-sm font-semibold border-0 outline-none">
						<option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
					</select>
					<select v-model="selectedYear" @change="loadData"
						class="w-20 bg-transparent text-gray-800 text-sm font-semibold border-0 outline-none">
						<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
					</select>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<template v-else>
					<!-- Workflow Status -->
					<div class="card-premium p-3.5">
						<div class="flex items-center gap-2 mb-3">
							<FeatherIcon name="git-branch" class="w-5 h-5 text-icd-600" />
							<div>
								<div class="text-sm font-bold text-gray-800">Workflow Status</div>
								<div class="text-xs text-gray-600">{{ mpData ? mpData.name : 'Not created yet' }}</div>
							</div>
						</div>
						<div class="flex flex-col gap-0">
							<div v-for="(step, idx) in wfSteps" :key="step.key"
								class="flex items-center gap-3 relative" :class="idx < wfSteps.length - 1 ? 'pb-4' : ''">
								<div v-if="idx < wfSteps.length - 1"
									class="absolute left-[11px] top-[24px] w-0.5 h-[calc(100%-12px)]"
									:class="stepReached(step.key) ? 'bg-green-400' : 'bg-gray-200'"></div>
								<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2"
									:class="stepCircle(step.key)">
									<FeatherIcon v-if="stepReached(step.key) && !stepActive(step.key)" name="check" class="w-3 h-3 text-white" />
									<div v-else-if="stepActive(step.key)" class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold" :class="stepActive(step.key) ? 'text-icd-600' : stepReached(step.key) ? 'text-green-700' : 'text-gray-600'">
										{{ step.label }}
									</div>
									<div v-if="step.info" class="text-xs text-gray-600">{{ step.info }}</div>
								</div>
								<span v-if="stepActive(step.key)" class="text-xs font-bold px-2 py-0.5 rounded-full bg-icd-100 text-icd-600">
									CURRENT
								</span>
								<FeatherIcon v-if="stepReached(step.key) && !stepActive(step.key)" name="check-circle" class="w-4 h-4 text-green-500 flex-shrink-0" />
							</div>
						</div>
					</div>

					<!-- Payroll Summary -->
					<div v-if="mpData" class="grid grid-cols-3 gap-2">
						<div class="bg-green-50 rounded-xl p-3 text-center border border-green-100">
							<div class="text-lg font-bold text-green-700">{{ fmt(mpData.total_gross_earnings) }}</div>
							<div class="text-xs text-green-600 font-medium">Gross</div>
						</div>
						<div class="bg-red-50 rounded-xl p-3 text-center border border-red-100">
							<div class="text-lg font-bold text-red-700">{{ fmt(mpData.total_deductions) }}</div>
							<div class="text-xs text-red-600 font-medium">Deductions</div>
						</div>
						<div class="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
							<div class="text-lg font-bold text-blue-700">{{ fmt(mpData.total_net_payroll) }}</div>
							<div class="text-xs text-blue-600 font-medium">Net</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="card-premium p-3.5">
						<div class="flex items-center gap-2 mb-3">
							<FeatherIcon name="zap" class="w-5 h-5 text-icd-600" />
							<div class="text-sm font-bold text-gray-800">Actions</div>
						</div>

						<div class="flex flex-col gap-2.5">
							<button v-if="!mpData" @click="createMP"
								class="w-full py-3.5 bg-icd-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'create' ? __('Creating...') : __('Create Monthly Payroll') }}
							</button>

							<button v-if="mpData && mpData.status === 'Draft'" @click="doGenerate"
								class="w-full py-3.5 bg-icd-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'generate' ? __('Generating...') : __('Generate Reviews') }}
							</button>

							<button v-if="canHRApprove" @click="doAction('hr_approve')"
								class="w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'hr_approve' ? __('Approving...') : __('HR Approve All') }}
							</button>

							<button v-if="canCEOApprove" @click="doAction('ceo_approve')"
								class="w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'ceo_approve' ? __('Approving...') : __('CEO Approve') }}
							</button>

							<button v-if="canFullApprove" @click="doAction('full_approve')"
								class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-purple-600/20"
								:disabled="isProcessing">
								{{ isProcessing === 'full_approve' ? __('Approving...') : __('Full Approve (HR + CEO)') }}
							</button>

							<button v-if="canReject" @click="showRejectSheet = true"
								class="w-full py-3.5 bg-red-50 text-red-600 border border-red-200/50 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
								:disabled="isProcessing">
								{{ __('Reject') }}
							</button>

							<button v-if="mpData && mpData.status === 'Approved'" @click="doAction('sync')"
								class="w-full py-3.5 bg-purple-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'sync' ? __('Syncing...') : __('Sync to Salary') }}
							</button>

							<button v-if="mpData && mpData.status === 'Synced'" @click="doCreatePayrollEntry"
								class="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ isProcessing === 'payroll_entry' ? __('Creating Payroll Entry...') : __('Create ERPNext Payroll Entry') }}
							</button>

							<button v-if="canRefresh" @click="doRefresh"
								class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
								:disabled="isProcessing">
								{{ __('Refresh from Reviews') }}
							</button>

							<button v-if="mpData && empCount > 0" @click="doExport"
								class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform">
								{{ __('Export Excel') }}
							</button>
						</div>
					</div>

					<!-- Audit Trail -->
					<div v-if="mpData && (mpData.hr_approved_by || mpData.ceo_approved_by)" class="card-premium p-3.5">
						<div class="flex items-center gap-2 mb-3">
							<FeatherIcon name="file-text" class="w-5 h-5 text-icd-600" />
							<div class="text-sm font-bold text-gray-800">Audit Trail</div>
						</div>
						<div class="flex flex-col gap-3">
							<div v-if="mpData.hr_approved_by" class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="check" class="w-4 h-4 text-green-600" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-bold text-gray-800">HR Approved</div>
									<div class="text-xs text-gray-600">by {{ mpData.hr_approved_by }}</div>
								</div>
								<span class="text-xs text-gray-600">{{ mpData.hr_approved_on }}</span>
							</div>
							<div v-if="mpData.ceo_approved_by" class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="award" class="w-4 h-4 text-purple-600" />
								</div>
								<div class="flex-1">
									<div class="text-sm font-bold text-gray-800">CEO Approved</div>
									<div class="text-xs text-gray-600">by {{ mpData.ceo_approved_by }}</div>
								</div>
								<span class="text-xs text-gray-600">{{ mpData.ceo_approved_on }}</span>
							</div>
						</div>
					</div>
				</template>
			</div>

			<!-- Reject Bottom Sheet -->
			<Teleport to="body">
				<Transition name="sheet">
					<div v-if="showRejectSheet" class="sheet-overlay" @click.self="showRejectSheet = false">
						<div class="sheet-panel">
							<div class="flex justify-center pt-2 pb-1">
								<div class="w-9 h-[5px] rounded-full bg-black/15"></div>
							</div>
							<div class="sheet-hdr" style="background: linear-gradient(135deg, rgba(244,63,94,0.85) 0%, rgba(225,29,72,0.7) 100%);">
								<FeatherIcon name="x-circle" class="w-5 h-5 text-white" />
								<div class="flex-1">
									<div class="text-base font-bold text-white">{{ __('Reject Payroll') }}</div>
									<div class="text-xs font-medium text-white/70">{{ mpData?.name }}</div>
								</div>
								<button @click="showRejectSheet = false" class="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white">
									<FeatherIcon name="x" class="w-4 h-4" />
								</button>
							</div>
							<div class="sheet-body">
								<div class="bg-white rounded-xl p-3.5 mb-2 border-0.5 border-white/90 shadow-sm">
									<textarea v-model="rejectNotes" :placeholder="__('Rejection reason (required)')"
										class="w-full border border-gray-200 rounded-xl p-3 text-sm h-24 resize-none"></textarea>
									<div class="flex gap-2 mt-3">
										<button @click="showRejectSheet = false"
											class="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-bold">
											{{ __('Cancel') }}
										</button>
										<button @click="doReject" :disabled="!rejectNotes.trim() || isProcessing"
											class="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
											{{ __('Reject') }}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Transition>
			</Teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRoute } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { userResource } from "@/data/user"

const __ = inject("$translate")
const employee = inject("$employee")
const route = useRoute()
const API = "icd3s_attendance.icd3s_attendance.api.modules.monthly_payroll"

const now = new Date()
const selectedMonth = ref(Number(route.query.month) || now.getMonth() + 1)
const selectedYear = ref(Number(route.query.year) || now.getFullYear())
const isLoading = ref(false)
const isProcessing = ref(false)

const mpData = ref(null)
const empCount = ref(0)
const showRejectSheet = ref(false)
const rejectNotes = ref("")

const months = [
	{ value: 1, label: "Jan" }, { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
	{ value: 4, label: "Apr" }, { value: 5, label: "May" }, { value: 6, label: "Jun" },
	{ value: 7, label: "Jul" }, { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
	{ value: 10, label: "Oct" }, { value: 11, label: "Nov" }, { value: 12, label: "Dec" },
]
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

const WF_ORDER = ["Draft", "Generated", "Pending HR Review", "Pending CEO Approval", "Approved", "Synced"]
const wfSteps = computed(() => [
	{ key: "Draft", label: "Draft", info: "Monthly payroll created" },
	{ key: "Generated", label: "Generated", info: "Employee reviews created" },
	{ key: "Pending HR Review", label: "HR Review", info: mpData.value?.hr_approved_by ? `Approved by ${mpData.value.hr_approved_by}` : "Waiting for HR Manager" },
	{ key: "Pending CEO Approval", label: "CEO Approval", info: mpData.value?.ceo_approved_by ? `Approved by ${mpData.value.ceo_approved_by}` : "Waiting for CEO" },
	{ key: "Approved", label: "Approved", info: "Ready to sync to salary" },
	{ key: "Synced", label: "Synced", info: "Additional salary entries created" },
])

function stepReached(key) {
	if (!mpData.value) return false
	if (mpData.value.status === "Rejected") return key === "Draft" || key === "Generated"
	return WF_ORDER.indexOf(key) <= WF_ORDER.indexOf(mpData.value.status)
}
function stepActive(key) {
	if (!mpData.value) return key === "Draft"
	if (mpData.value.status === "Rejected") return false
	return mpData.value.status === key
}
function stepCircle(key) {
	if (stepActive(key)) return "border-icd-600 bg-icd-600"
	if (stepReached(key)) return "border-green-500 bg-green-500"
	return "border-gray-200 bg-white"
}

const isSystemManager = computed(() => (userResource.data?.roles || []).includes("System Manager"))
const canHRApprove = computed(() => ["Generated", "Pending HR Review", "Rejected"].includes(mpData.value?.status))
const canCEOApprove = computed(() => mpData.value?.status === "Pending CEO Approval")
const canFullApprove = computed(() => isSystemManager.value && ["Generated", "Pending HR Review", "Pending CEO Approval", "Rejected"].includes(mpData.value?.status))
const canReject = computed(() => ["Generated", "Pending HR Review", "Pending CEO Approval"].includes(mpData.value?.status))
const canRefresh = computed(() => ["Generated", "Pending HR Review", "Rejected"].includes(mpData.value?.status))

async function loadData() {
	isLoading.value = true
	try {
		const data = await call(`${API}.get_review_matrix`, {
			month: selectedMonth.value, year: selectedYear.value
		})
		mpData.value = data?.monthly_payroll || null
		empCount.value = data?.totals?.count || 0
	} catch (e) { _errToast(e, "Failed to load payroll data") }
	isLoading.value = false
}

async function createMP() {
	isProcessing.value = "create"
	try {
		await call(`${API}.create_monthly_payroll`, { month: selectedMonth.value, year: selectedYear.value })
		await loadData()
	} catch (e) { _errToast(e, "Failed to create monthly payroll") }
	isProcessing.value = false
}

async function doGenerate() {
	if (!mpData.value?.name) return
	isProcessing.value = "generate"
	try {
		await call(`${API}.generate_reviews`, { monthly_payroll_name: mpData.value.name })
		await loadData()
	} catch (e) { _errToast(e, "Failed to generate reviews") }
	isProcessing.value = false
}

async function doAction(action) {
	if (!mpData.value?.name) return
	isProcessing.value = action
	try {
		const methods = {
			hr_approve: `${API}.bulk_hr_approve`,
			ceo_approve: `${API}.bulk_ceo_approve`,
			full_approve: `${API}.bulk_full_approve`,
			sync: `${API}.sync_to_salary`,
		}
		await call(methods[action], { monthly_payroll_name: mpData.value.name })
		await loadData()
	} catch (e) { _errToast(e, "Action failed") }
	isProcessing.value = false
}

async function doRefresh() {
	isProcessing.value = "refresh"
	try {
		await call("frappe.client.run_doc_method", {
			dt: "ICD3S Monthly Payroll", dn: mpData.value.name, method: "refresh_from_reviews"
		})
		await loadData()
	} catch (e) { await loadData() }
	isProcessing.value = false
}

async function doReject() {
	if (!mpData.value?.name || !rejectNotes.value.trim()) return
	isProcessing.value = "reject"
	showRejectSheet.value = false
	try {
		await call(`${API}.bulk_reject`, {
			monthly_payroll_name: mpData.value.name, notes: rejectNotes.value.trim()
		})
		await loadData()
	} catch (e) { _errToast(e, "Failed to reject") }
	isProcessing.value = false
}

async function doCreatePayrollEntry() {
	if (!mpData.value?.name) return
	isProcessing.value = "payroll_entry"
	try {
		const monthStr = String(selectedMonth.value).padStart(2, "0")
		const startDate = `${selectedYear.value}-${monthStr}-01`
		const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
		const endDate = `${selectedYear.value}-${monthStr}-${lastDay}`
		const company = employee.data?.company || "ICD"

		const result = await call("frappe.client.insert", {
			doc: {
				doctype: "Payroll Entry",
				company: company,
				posting_date: endDate,
				payroll_frequency: "Monthly",
				start_date: startDate,
				end_date: endDate,
			}
		})
		if (result?.name) {
			toast({ title: __("Payroll Entry created: ") + result.name, icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		}
	} catch (e) {
		toast({ title: e.message || __("Failed to create Payroll Entry"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	}
	isProcessing.value = false
}

function doExport() {
	window.open(`/api/method/${API}.export_review_excel?month=${selectedMonth.value}&year=${selectedYear.value}`, "_blank")
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) { /* ignore parse errors */ }
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

watch(() => employee.data?.company, (c) => { if (c) loadData() }, { immediate: true })
</script>
