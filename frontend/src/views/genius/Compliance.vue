<template>
	<BaseLayout :pageTitle="__('Compliance')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Overall Score -->
				<div v-if="compliance.data" class="bg-white dark:bg-white/10 rounded-2xl shadow-sm dark:shadow-none p-5">
					<div class="flex items-center justify-between mb-4">
						<div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ __("Compliance Score") }}</div>
						<div
							class="text-3xl font-black"
							:class="compliance.data.compliance_score >= 80 ? 'text-green-600 dark:text-green-300' : compliance.data.compliance_score >= 50 ? 'text-amber-600 dark:text-amber-300' : 'text-red-600 dark:text-red-300'"
						>
							{{ compliance.data.compliance_score || 0 }}%
						</div>
					</div>
					<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-3">
						<div
							class="h-3 rounded-full transition-all duration-700"
							:class="compliance.data.compliance_score >= 80 ? 'bg-green-500' : compliance.data.compliance_score >= 50 ? 'bg-amber-500' : 'bg-red-500'"
							:style="{ width: (compliance.data.compliance_score || 0) + '%' }"
						></div>
					</div>
				</div>

				<!-- Compliance Checks -->
				<div v-if="compliance.data?.checks && Object.keys(compliance.data.checks).length > 0">
					<div class="section-title mb-3">{{ __("Labor Law Checks") }}</div>
					<div class="flex flex-col gap-2">
						<div
							v-for="(check, key) in compliance.data.checks"
							:key="key"
							class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-3"
						>
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
								:class="check.compliant ? 'bg-green-100 dark:bg-green-800/40' : 'bg-orange-100 dark:bg-orange-800/40'"
							>
								<FeatherIcon
									:name="check.compliant ? 'check-circle' : 'alert-triangle'"
									class="w-5 h-5"
									:class="check.compliant ? 'text-green-600 dark:text-green-300' : 'text-orange-500 dark:text-orange-300'"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ formatCheckName(key) }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ getCheckDetail(key, check) }}</div>
							</div>
							<div
								class="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
								:class="check.compliant ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300'"
							>
								{{ check.compliant ? __('OK') : __('Alert') }}
							</div>
						</div>
					</div>
				</div>

				<!-- Data Privacy -->
				<div>
					<div class="section-title mb-3">{{ __("Data Privacy (PDPL)") }}</div>

					<div v-if="privacy.data" class="flex flex-col gap-2">
						<!-- Consents Status -->
						<div v-if="privacy.data.consents" class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
							<div class="flex items-center gap-2 mb-3">
								<span class="text-lg">&#x1F512;</span>
								<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Required Consents") }}</span>
							</div>
							<div class="flex flex-col gap-2">
								<div
									v-for="(consent, name) in privacy.data.consents"
									:key="name"
									class="flex items-center justify-between bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2.5"
								>
									<div class="flex items-center gap-2">
										<div
											class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
											:class="consent.status === 'granted' ? 'bg-green-100 dark:bg-green-800/40' : 'bg-red-100 dark:bg-red-800/40'"
										>
											<FeatherIcon
												:name="consent.status === 'granted' ? 'check' : 'x'"
												class="w-3.5 h-3.5"
												:class="consent.status === 'granted' ? 'text-green-600' : 'text-red-500'"
											/>
										</div>
										<span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ name }}</span>
									</div>
									<span
										class="text-[11px] font-bold px-2 py-0.5 rounded-full"
										:class="consent.status === 'granted' ? 'bg-green-100 dark:bg-green-800/40 text-green-700' : 'bg-red-100 dark:bg-red-800/40 text-red-600'"
									>
										{{ consent.status === 'granted' ? __('Granted') : __('Missing') }}
									</span>
								</div>
							</div>
							<div v-if="hasMissingConsents" class="mt-3">
								<button
									@click="grantConsent"
									class="w-full py-2.5 bg-icd-600 text-white rounded-lg text-sm font-semibold active:bg-icd-700 transition"
								>
									{{ __("Grant All Consents") }}
								</button>
							</div>
						</div>

						<!-- Encryption Info -->
						<div v-if="privacy.data.encryption" class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
							<div class="flex items-center gap-2 mb-3">
								<span class="text-lg">&#x1F510;</span>
								<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Data Encryption") }}</span>
							</div>
							<div class="flex flex-col gap-2">
								<div class="flex items-center justify-between text-xs">
									<span class="text-gray-700 dark:text-gray-400">{{ __("Algorithm") }}</span>
									<span class="font-bold text-green-600 dark:text-green-300">{{ privacy.data.encryption.algorithm }}</span>
								</div>
								<div class="grid grid-cols-2 gap-1.5">
									<div class="flex items-center gap-1.5 bg-green-50 dark:bg-green-800/20 rounded-lg px-2.5 py-2">
										<FeatherIcon name="map-pin" class="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
										<span class="text-[11px] text-green-700 dark:text-green-300">{{ __("GPS") }} {{ privacy.data.encryption.gps_encrypted ? '&#x2705;' : '&#x274C;' }}</span>
									</div>
									<div class="flex items-center gap-1.5 bg-green-50 dark:bg-green-800/20 rounded-lg px-2.5 py-2">
										<FeatherIcon name="camera" class="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
										<span class="text-[11px] text-green-700 dark:text-green-300">{{ __("Photo") }} {{ privacy.data.encryption.photo_encrypted ? '&#x2705;' : '&#x274C;' }}</span>
									</div>
									<div class="flex items-center gap-1.5 bg-green-50 dark:bg-green-800/20 rounded-lg px-2.5 py-2">
										<FeatherIcon name="smartphone" class="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
										<span class="text-[11px] text-green-700 dark:text-green-300">{{ __("Device") }} {{ privacy.data.encryption.device_encrypted ? '&#x2705;' : '&#x274C;' }}</span>
									</div>
									<div class="flex items-center gap-1.5 bg-green-50 dark:bg-green-800/20 rounded-lg px-2.5 py-2">
										<FeatherIcon name="user" class="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
										<span class="text-[11px] text-green-700 dark:text-green-300">{{ __("Bio") }} {{ privacy.data.encryption.biometric_encrypted ? '&#x2705;' : '&#x274C;' }}</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Biometric Policy -->
						<div v-if="privacy.data.biometric_policy" class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
							<div class="flex items-center gap-2 mb-2">
								<span class="text-lg">&#x1F9EC;</span>
								<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Biometric Policy") }}</span>
							</div>
							<div class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
								{{ privacy.data.biometric_policy.description }}
							</div>
							<div class="flex gap-2 mt-2">
								<span class="text-[11px] px-2 py-0.5 rounded-full font-bold" :class="privacy.data.biometric_policy.on_device_only ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
									{{ privacy.data.biometric_policy.on_device_only ? __('On-Device Only') : __('Server Processing') }}
								</span>
								<span class="text-[11px] px-2 py-0.5 rounded-full font-bold" :class="!privacy.data.biometric_policy.server_stores_biometric ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
									{{ !privacy.data.biometric_policy.server_stores_biometric ? __('No Server Storage') : __('Server Storage') }}
								</span>
							</div>
						</div>

						<!-- Export My Data -->
						<div class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="text-lg">&#x1F4E5;</span>
									<div>
										<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Export My Data") }}</div>
										<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Download all your attendance data") }}</div>
									</div>
								</div>
								<button
									@click="exportData"
									class="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-white/15"
									:disabled="exporting"
								>
									{{ exporting ? __('Exporting...') : __('Export') }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Retention Policy -->
				<div class="bg-icd-50 dark:bg-icd-900/30 rounded-xl p-4">
					<div class="flex items-center gap-2 mb-2">
						<FeatherIcon name="info" class="w-4 text-icd-500" />
						<span class="text-sm font-semibold text-icd-800 dark:text-icd-200">{{ __("Data Retention") }}</span>
					</div>
					<div class="text-xs text-icd-600 dark:text-icd-300">
						{{ __("Your attendance data is retained for the legally required period. Photos are automatically deleted after 90 days. You can request data deletion by contacting HR.") }}
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject } from "vue"
import { createResource, FeatherIcon, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { getDeviceInfo } from "@/data/genius.js"

const employee = inject("$employee")
const __ = inject("$translate")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const compliance = createResource({
	url: `${API_BASE}.compliance.get_compliance_status`,
	auto: true,
	cache: "genius:compliance:full",
	makeParams() { return { employee: employee.data?.name } },
})

const privacy = createResource({
	url: `${API_BASE}.compliance.get_data_privacy_status`,
	auto: true,
	cache: "genius:privacy",
	makeParams() { return { employee: employee.data?.name } },
})

const exporting = ref(false)

const hasMissingConsents = computed(() => {
	if (!privacy.data?.consents) return false
	return Object.values(privacy.data.consents).some(c => c.status !== "granted")
})

function formatCheckName(key) {
	const names = {
		working_hours: __("Working Hours"),
		leave_entitlement: __("Leave Entitlement"),
		overtime_rates: __("Overtime Rates"),
		grace_period: __("Grace Period"),
		rest_days: __("Rest Days"),
		probation: __("Probation"),
	}
	return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function getCheckDetail(key, check) {
	if (key === "working_hours") {
		return check.compliant
			? __("Within {0}hr daily limit", [check.max_daily_work_hours || 8])
			: __("Exceeds {0}hr daily limit", [check.max_daily_work_hours || 8])
	}
	if (key === "leave_entitlement") {
		return check.compliant
			? __("{0} days allocated (min {1})", [check.allocated || 0, check.minimum_required || 21])
			: __("Only {0} days (need {1})", [check.allocated || 0, check.minimum_required || 21])
	}
	if (key === "overtime_rates") {
		return check.compliant ? __("Proper overtime compensation") : __("Overtime rates need review")
	}
	if (key === "grace_period") {
		return check.compliant
			? __("{0} min grace period set", [check.grace_minutes || 15])
			: __("No grace period configured")
	}
	if (key === "rest_days") {
		return check.compliant ? __("Weekly rest day guaranteed") : __("Rest day policy missing")
	}
	if (key === "probation") {
		return check.compliant ? __("Within legal probation period") : __("Probation period exceeded")
	}
	return check.compliant ? __("Compliant") : __("Needs attention")
}

function grantConsent() {
	const deviceInfo = getDeviceInfo()
	const consent = createResource({
		url: `${API_BASE}.compliance.submit_biometric_consent`,
		makeParams() {
			return {
				consent_type: "biometric",
				device_info: JSON.stringify(deviceInfo),
			}
		},
		onSuccess() {
			privacy.reload()
		},
	})
	consent.submit()
}

function exportData() {
	exporting.value = true
	const exp = createResource({
		url: `${API_BASE}.compliance.export_my_data`,
		onSuccess(data) {
			exporting.value = false
			if (!data) return
			// Backend returns JSON data dict - convert to downloadable file
			const jsonStr = JSON.stringify(data, null, 2)
			const blob = new Blob([jsonStr], { type: "application/json" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `my-data-export-${data.employee_id || "employee"}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			setTimeout(() => URL.revokeObjectURL(url), 3000)
		},
		onError(e) {
			exporting.value = false
			toast({
				title: __("Export Failed"),
				text: e?.message || __("Could not export data"),
				icon: "alert-circle",
				position: "bottom-center",
				iconClasses: "text-red-500",
			})
		},
	})
	exp.submit()
}
</script>
