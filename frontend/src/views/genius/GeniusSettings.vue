<template>
	<BaseLayout :pageTitle="__('Settings')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Notification Preferences -->
				<div>
					<div class="section-title mb-3">{{ __("Notifications") }}</div>
					<div class="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
						<ToggleRow :label="__('Check-in Reminder')" :subtitle="__('Before shift starts')" v-model="prefs.checkin_reminder" />
						<ToggleRow :label="__('Check-out Reminder')" :subtitle="__('Before shift ends')" v-model="prefs.checkout_reminder" />
						<ToggleRow :label="__('Late Warning')" :subtitle="__('When running late')" v-model="prefs.late_warning_alert" />
						<ToggleRow :label="__('Penalty Alert')" :subtitle="__('When penalty recorded')" v-model="prefs.penalty_alert" />
						<ToggleRow :label="__('Overtime Alert')" :subtitle="__('OT approval updates')" v-model="prefs.overtime_alert" />
						<ToggleRow :label="__('Leave Status')" :subtitle="__('Application updates')" v-model="prefs.leave_status_alert" />
						<ToggleRow :label="__('Salary Ready')" :subtitle="__('Slip available')" v-model="prefs.salary_ready_alert" />
						<ToggleRow :label="__('Commission Alert')" :subtitle="__('New commissions')" v-model="prefs.commission_alert" />
						<ToggleRow :label="__('Monthly Summary')" :subtitle="__('End of month report')" v-model="prefs.monthly_summary_alert" />
					</div>
				</div>

				<!-- Channels -->
				<div>
					<div class="section-title mb-3">{{ __("Channels") }}</div>
					<div class="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
						<ToggleRow :label="__('Push Notifications')" v-model="prefs.push_notifications" />
						<ToggleRow :label="__('Email Notifications')" v-model="prefs.email_notifications" />
						<ToggleRow :label="__('WhatsApp Notifications')" v-model="prefs.whatsapp_notifications" />
					</div>
				</div>

				<!-- Quiet Hours -->
				<div>
					<div class="section-title mb-3">{{ __("Quiet Hours") }}</div>
					<div class="bg-white rounded-xl shadow-sm overflow-hidden">
						<div class="p-4">
							<ToggleRow :label="__('Enable Quiet Hours')" :subtitle="__('Mute during set hours')" v-model="prefs.quiet_hours_enabled" />
						</div>
						<div v-if="prefs.quiet_hours_enabled" class="border-t border-gray-100 p-4 grid grid-cols-2 gap-3">
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("From") }}</label>
								<input type="time" v-model="prefs.quiet_start" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("To") }}</label>
								<input type="time" v-model="prefs.quiet_end" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
							</div>
						</div>
					</div>
				</div>

				<!-- Save Button -->
				<button
					@click="savePrefs"
					:disabled="saving.loading"
					class="w-full bg-icd-600 text-white rounded-xl py-3.5 font-bold text-sm active:bg-icd-700 shadow-md disabled:opacity-50"
				>
					{{ saving.loading ? __("Saving...") : __("Save Preferences") }}
				</button>

				<!-- Reminder Times -->
				<div>
					<div class="section-title mb-3">{{ __("Reminder Times") }}</div>
					<div class="bg-white rounded-xl shadow-sm overflow-hidden p-4 grid grid-cols-2 gap-3">
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-in Reminder") }}</label>
							<input type="time" v-model="prefs.checkin_reminder_time" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-out Reminder") }}</label>
							<input type="time" v-model="prefs.checkout_reminder_time" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
						</div>
					</div>
				</div>

				<!-- About -->
				<div>
					<div class="section-title mb-3">{{ __("About") }}</div>
					<div class="bg-white rounded-xl shadow-sm overflow-hidden p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm font-semibold text-gray-800">ICD HR</div>
								<div class="text-xs text-gray-500 mt-0.5">{{ __("Employee Self-Service") }}</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold text-icd-600 font-mono">v{{ appVersion }}</div>
								<div v-if="appBuild" class="text-[10px] text-gray-400 mt-0.5">{{ __("Build") }} {{ appBuild }}</div>
							</div>
						</div>
					</div>
				</div>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { reactive, inject, computed } from "vue"
import { createResource } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import ToggleRow from "@/components/GeniusToggleRow.vue"

const employee = inject("$employee")
const __ = inject("$translate")

const appVersion = typeof __APP_VERSION_NUM__ !== "undefined" ? __APP_VERSION_NUM__ : "1.0.1"
const appBuild = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__.split("+")[1]?.split(".")[0] || "" : ""

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const prefs = reactive({
	checkin_reminder: 1,
	checkout_reminder: 1,
	checkin_reminder_time: "08:45:00",
	checkout_reminder_time: "16:45:00",
	late_warning_alert: 1,
	penalty_alert: 1,
	overtime_alert: 1,
	leave_status_alert: 1,
	salary_ready_alert: 1,
	commission_alert: 1,
	monthly_summary_alert: 1,
	push_notifications: 1,
	email_notifications: 1,
	whatsapp_notifications: 0,
	quiet_hours_enabled: 0,
	quiet_start: "22:00:00",
	quiet_end: "07:00:00",
})

const fetchPrefs = createResource({
	url: `${API_BASE}.profile.get_notification_preferences`,
	auto: true,
	makeParams() { return { employee: employee.data?.name } },
	onSuccess(data) {
		if (data?.preferences) {
			Object.assign(prefs, data.preferences)
		}
	},
})

const saving = createResource({
	url: `${API_BASE}.profile.update_notification_preferences`,
	onSuccess() {
		window.frappe?.show_alert?.({ message: __("Preferences saved"), indicator: "green" })
	},
})

function savePrefs() {
	saving.submit({
		employee: employee.data?.name,
		preferences: JSON.stringify(prefs),
	})
}
</script>
