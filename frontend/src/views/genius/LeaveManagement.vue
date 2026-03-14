<template>
	<BaseLayout :pageTitle="__('Leaves & Corrections')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-6">

				<!-- Leave Balances -->
				<section>
					<div class="section-title mb-3">{{ __("Leave Balance") }}</div>
					<div v-if="balance.data?.balances" class="grid grid-cols-2 gap-3">
						<div
							v-for="(bal, type) in balance.data.balances"
							:key="type"
							class="info-card text-center"
						>
							<div class="text-2xl font-black text-icd-600 dark:text-icd-300">{{ bal }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-400 mt-1.5 leading-tight font-medium">{{ type }}</div>
						</div>
					</div>
					<div v-else class="info-card text-center">
						<div class="text-sm text-gray-600 dark:text-gray-500">{{ __("No leave balances available") }}</div>
					</div>
				</section>

				<!-- Pending Applications -->
				<section v-if="balance.data?.pending_applications?.length > 0">
					<div class="section-title mb-3">{{ __("Pending Requests") }}</div>
					<div class="info-card !p-0 overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
						<div v-for="app in balance.data.pending_applications" :key="app.name" class="p-3.5 flex items-center gap-3">
							<div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
								<FeatherIcon name="clock" class="w-5 text-amber-500" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{{ app.leave_type }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ formatDay(app.from_date) }} - {{ formatDay(app.to_date) }}</div>
							</div>
							<div class="status-badge bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200">
								{{ app.total_leave_days }}d
							</div>
						</div>
					</div>
				</section>

				<!-- Monthly Attendance Summary -->
				<section>
					<div class="section-title mb-3">{{ __("Monthly Attendance") }}</div>
					<div v-if="monthly.data?.summary" class="info-card !p-0 overflow-hidden">
						<div class="stat-grid grid-cols-4 p-4">
							<div class="text-center">
								<div class="text-lg font-bold text-green-600 dark:text-green-300">{{ monthly.data.summary.present_days || 0 }}</div>
								<div class="text-[0.6875rem] text-gray-700 dark:text-gray-400 font-medium mt-0.5">{{ __("Present") }}</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-red-500 dark:text-red-300">{{ monthly.data.summary.absent_days || 0 }}</div>
								<div class="text-[0.6875rem] text-gray-700 dark:text-gray-400 font-medium mt-0.5">{{ __("Absent") }}</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-icd-600 dark:text-icd-300">{{ monthly.data.summary.leave_days || 0 }}</div>
								<div class="text-[0.6875rem] text-gray-700 dark:text-gray-400 font-medium mt-0.5">{{ __("Leave") }}</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-amber-600 dark:text-amber-300">{{ monthly.data.summary.late_entries || 0 }}</div>
								<div class="text-[0.6875rem] text-gray-700 dark:text-gray-400 font-medium mt-0.5">{{ __("Late") }}</div>
							</div>
						</div>
						<div class="border-t border-gray-100 dark:border-white/10 px-4 py-3 flex items-center justify-between">
							<span class="text-xs text-gray-700 dark:text-gray-400 font-medium">{{ __("Total Hours") }}</span>
							<span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ parseFloat(monthly.data.summary.total_hours || 0).toFixed(1) }}h</span>
						</div>
					</div>
				</section>

				<!-- Action Buttons -->
				<section class="flex flex-col gap-3">
					<button
						@click="showLeaveDialog = true"
						class="premium-submit"
					>
						<FeatherIcon name="calendar" class="w-4 mr-2 inline" />
						{{ __("Apply for Leave") }}
					</button>
					<button
						@click="showCorrectionDialog = true"
						class="premium-submit-outline"
					>
						<FeatherIcon name="edit-3" class="w-4 mr-2 inline" />
						{{ __("Request Attendance Correction") }}
					</button>
				</section>

				<!-- Correction Requests -->
				<section v-if="corrections.data?.corrections?.length > 0">
					<div class="section-title mb-3">{{ __("Correction History") }}</div>
					<div class="info-card !p-0 overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
						<div v-for="c in corrections.data.corrections" :key="c.name" class="p-3.5 flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
								:class="c.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/30' : c.status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'"
							>
								<FeatherIcon
									:name="c.status === 'Approved' ? 'check' : c.status === 'Rejected' ? 'x' : 'clock'"
									class="w-5"
									:class="c.status === 'Approved' ? 'text-green-600' : c.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ c.correction_type }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ formatDay(c.correction_date) }} &bull; {{ c.reason?.substring(0, 40) }}</div>
							</div>
							<div
								class="status-badge border"
								:class="c.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200' : c.status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200'"
							>
								{{ c.status }}
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- Leave Application Dialog -->
			<ion-modal :is-open="showLeaveDialog" @did-dismiss="showLeaveDialog = false">
				<ion-header>
					<ion-toolbar class="premium-modal-header">
						<ion-title class="premium-modal-title">{{ __("Apply for Leave") }}</ion-title>
						<ion-buttons slot="end">
							<ion-button class="premium-modal-close" @click="showLeaveDialog = false">{{ __("Close") }}</ion-button>
						</ion-buttons>
					</ion-toolbar>
				</ion-header>
				<ion-content class="ion-padding">
					<div class="flex flex-col gap-5 p-4">
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="tag" class="field-icon" />
								{{ __("Leave Type") }}
							</label>
							<select v-model="leaveForm.leave_type" class="premium-select">
								<option value="">{{ __("Select leave type...") }}</option>
								<option v-for="(bal, type) in (balance.data?.balances || {})" :key="type" :value="type">
									{{ type }} ({{ bal }} {{ __("available") }})
								</option>
							</select>
						</div>
						<div class="field-row">
							<div class="field-group">
								<label class="field-label">
									<FeatherIcon name="calendar" class="field-icon" />
									{{ __("From") }}
								</label>
								<input type="date" v-model="leaveForm.from_date" class="premium-input" />
							</div>
							<div class="field-group">
								<label class="field-label">
									<FeatherIcon name="calendar" class="field-icon" />
									{{ __("To") }}
								</label>
								<input type="date" v-model="leaveForm.to_date" class="premium-input" />
							</div>
						</div>
						<div class="premium-checkbox">
							<input type="checkbox" v-model="leaveForm.half_day" id="halfDay" />
							<label for="halfDay">{{ __("Half Day") }}</label>
						</div>
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="file-text" class="field-icon" />
								{{ __("Reason") }}
							</label>
							<textarea v-model="leaveForm.reason" rows="3" class="premium-textarea" :placeholder="__('Enter reason for leave...')"></textarea>
						</div>
						<button
							@click="submitLeave"
							:disabled="leaveSubmit.loading"
							class="premium-submit"
						>
							{{ leaveSubmit.loading ? __("Submitting...") : __("Submit Leave Request") }}
						</button>
					</div>
				</ion-content>
			</ion-modal>

			<!-- Correction Dialog -->
			<ion-modal :is-open="showCorrectionDialog" @did-dismiss="showCorrectionDialog = false">
				<ion-header>
					<ion-toolbar class="premium-modal-header">
						<ion-title class="premium-modal-title">{{ __("Attendance Correction") }}</ion-title>
						<ion-buttons slot="end">
							<ion-button class="premium-modal-close" @click="showCorrectionDialog = false">{{ __("Close") }}</ion-button>
						</ion-buttons>
					</ion-toolbar>
				</ion-header>
				<ion-content class="ion-padding">
					<div class="flex flex-col gap-5 p-4">
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="calendar" class="field-icon" />
								{{ __("Date") }}
							</label>
							<input type="date" v-model="corrForm.correction_date" class="premium-input" />
						</div>
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="list" class="field-icon" />
								{{ __("Correction Type") }}
							</label>
							<select v-model="corrForm.correction_type" class="premium-select">
								<option value="">{{ __("Select type...") }}</option>
								<option value="Missed Check-in">{{ __("Missed Check-in") }}</option>
								<option value="Missed Check-out">{{ __("Missed Check-out") }}</option>
								<option value="Wrong Status">{{ __("Wrong Status") }}</option>
								<option value="Time Correction">{{ __("Time Correction") }}</option>
								<option value="Remove Absence">{{ __("Remove Absence") }}</option>
							</select>
						</div>
						<div class="field-row">
							<div class="field-group">
								<label class="field-label">
									<FeatherIcon name="log-in" class="field-icon" />
									{{ __("Check-in Time") }}
								</label>
								<input type="time" v-model="corrForm.corrected_check_in" class="premium-input" />
							</div>
							<div class="field-group">
								<label class="field-label">
									<FeatherIcon name="log-out" class="field-icon" />
									{{ __("Check-out Time") }}
								</label>
								<input type="time" v-model="corrForm.corrected_check_out" class="premium-input" />
							</div>
						</div>
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="file-text" class="field-icon" />
								{{ __("Reason") }}
							</label>
							<textarea v-model="corrForm.reason" rows="3" class="premium-textarea" :placeholder="__('Minimum 10 characters...')"></textarea>
						</div>
						<button
							@click="submitCorrection"
							:disabled="corrSubmit.loading"
							class="premium-submit"
						>
							{{ corrSubmit.loading ? __("Submitting...") : __("Submit Correction") }}
						</button>
					</div>
				</ion-content>
			</ion-modal>

		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, inject } from "vue"
import { createResource, FeatherIcon, toast } from "frappe-ui"
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from "@ionic/vue"
import BaseLayout from "@/components/BaseLayout.vue"
import soundManager from "@/utils/sounds"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const showLeaveDialog = ref(false)
const showCorrectionDialog = ref(false)

const leaveForm = reactive({
	leave_type: "",
	from_date: "",
	to_date: "",
	half_day: false,
	reason: "",
})

const corrForm = reactive({
	correction_date: "",
	correction_type: "",
	corrected_check_in: "",
	corrected_check_out: "",
	reason: "",
})

const balance = createResource({
	url: `${API_BASE}.leaves.get_leave_balance`,
	auto: true,
	makeParams() { return { employee: employee.data?.name } },
})

const now = new Date()

const monthly = createResource({
	url: `${API_BASE}.leaves.get_monthly_summary`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: now.getMonth() + 1, year: now.getFullYear() } },
})

const corrections = createResource({
	url: `${API_BASE}.leaves.get_correction_requests`,
	auto: true,
	makeParams() { return { employee: employee.data?.name } },
})

const leaveSubmit = createResource({
	url: `${API_BASE}.leaves.submit_leave_request`,
	onSuccess() {
		soundManager.playSuccess()
		showLeaveDialog.value = false
		leaveForm.leave_type = ""
		leaveForm.from_date = ""
		leaveForm.to_date = ""
		leaveForm.half_day = false
		leaveForm.reason = ""
		balance.reload()
	},
})

const corrSubmit = createResource({
	url: `${API_BASE}.leaves.request_attendance_correction`,
	onSuccess() {
		soundManager.playSuccess()
		showCorrectionDialog.value = false
		corrForm.correction_date = ""
		corrForm.correction_type = ""
		corrForm.corrected_check_in = ""
		corrForm.corrected_check_out = ""
		corrForm.reason = ""
		corrections.reload()
	},
})

function submitLeave() {
	if (!leaveForm.leave_type) {
		soundManager.playError()
		toast({ title: __("Please select a leave type"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	if (!leaveForm.from_date || !leaveForm.to_date) {
		soundManager.playError()
		toast({ title: __("Please select from and to dates"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	if (leaveForm.from_date > leaveForm.to_date) {
		soundManager.playError()
		toast({ title: __("From date cannot be after to date"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	leaveSubmit.submit({
		employee: employee.data?.name,
		leave_type: leaveForm.leave_type,
		from_date: leaveForm.from_date,
		to_date: leaveForm.to_date,
		half_day: leaveForm.half_day ? 1 : 0,
		reason: leaveForm.reason,
	})
}

function submitCorrection() {
	if (!corrForm.correction_date) {
		soundManager.playError()
		toast({ title: __("Please select a date"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	if (!corrForm.correction_type) {
		soundManager.playError()
		toast({ title: __("Please select correction type"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	if (!corrForm.reason || corrForm.reason.trim().length < 10) {
		soundManager.playError()
		toast({ title: __("Reason must be at least 10 characters"), icon: "alert-circle", iconClasses: "text-red-600" })
		return
	}
	corrSubmit.submit({
		employee: employee.data?.name,
		correction_date: corrForm.correction_date,
		correction_type: corrForm.correction_type,
		corrected_check_in: corrForm.corrected_check_in || null,
		corrected_check_out: corrForm.corrected_check_out || null,
		reason: corrForm.reason,
	})
}

function formatDay(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM")
}
</script>
