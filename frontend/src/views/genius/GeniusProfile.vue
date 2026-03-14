<template>
	<BaseLayout :pageTitle="__('My Profile')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Profile Header -->
				<div class="bg-white dark:bg-white/10 rounded-2xl shadow-sm dark:shadow-none p-5 text-center">
					<div class="w-20 h-20 rounded-full bg-icd-100 dark:bg-icd-800/40 flex items-center justify-center text-3xl font-bold text-icd-600 dark:text-icd-300 mx-auto">
						{{ getInitials(employeeInfo.data?.employee_name) }}
					</div>
					<div class="text-lg font-bold text-gray-800 dark:text-gray-200 mt-3">{{ employeeInfo.data?.employee_name }}</div>
					<div class="text-sm text-gray-700 dark:text-gray-400">{{ employeeInfo.data?.designation }}</div>
					<div class="text-xs text-gray-600 dark:text-gray-500 mt-1">{{ employeeInfo.data?.department }}</div>
				</div>

				<!-- Employee Details -->
				<div v-if="employeeInfo.data" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
					<div class="p-3 border-b border-gray-100 dark:border-white/10">
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Details") }}</div>
					</div>
					<div class="divide-y divide-gray-50 dark:divide-white/10">
						<div class="flex justify-between p-3">
							<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Employee ID") }}</span>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ employeeInfo.data.name }}</span>
						</div>
						<div class="flex justify-between p-3">
							<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Company") }}</span>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ employeeInfo.data.company }}</span>
						</div>
						<div v-if="employeeInfo.data.date_of_joining" class="flex justify-between p-3">
							<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Joined") }}</span>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(employeeInfo.data.date_of_joining) }}</span>
						</div>
						<div v-if="employeeInfo.data.cell_phone" class="flex justify-between p-3">
							<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Phone") }}</span>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ employeeInfo.data.cell_phone }}</span>
						</div>
						<div v-if="employeeInfo.data.company_email || employeeInfo.data.personal_email" class="flex justify-between p-3">
							<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Email") }}</span>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate ml-4">{{ employeeInfo.data.company_email || employeeInfo.data.personal_email }}</span>
						</div>
					</div>
				</div>

				<!-- Emergency Contacts -->
				<div v-if="emergencyContacts.data?.contacts?.length > 0">
					<div class="section-title mb-3">{{ __("Emergency Contacts") }}</div>
					<div class="flex flex-col gap-2">
						<div
							v-for="c in emergencyContacts.data.contacts"
							:key="c.name"
							class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-3"
						>
							<div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800/40 flex items-center justify-center">
								<FeatherIcon name="phone" class="w-4 text-red-600 dark:text-red-400" />
							</div>
							<div class="flex-1">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ c.emergency_contact_name }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400">{{ c.relation }}</div>
							</div>
							<a
								:href="'tel:' + c.emergency_phone"
								class="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg text-xs font-medium text-red-700 dark:text-red-300"
							>
								{{ __("Call") }}
							</a>
						</div>
					</div>
				</div>

				<!-- Device Info -->
				<div>
					<div class="section-title mb-3">{{ __("Device") }}</div>
					<div class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
						<div class="divide-y divide-gray-50 dark:divide-white/10">
							<div class="flex justify-between p-3">
								<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Device") }}</span>
								<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ deviceInfo.device_name }}</span>
							</div>
							<div class="flex justify-between p-3">
								<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Model") }}</span>
								<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ deviceInfo.device_model }}</span>
							</div>
							<div class="flex justify-between p-3">
								<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("OS") }}</span>
								<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ deviceInfo.os_version }}</span>
							</div>
							<div class="flex justify-between p-3">
								<span class="text-sm text-gray-700 dark:text-gray-400">{{ __("Device ID") }}</span>
								<span class="text-sm font-mono text-gray-600 dark:text-gray-400">{{ deviceInfo.device_id }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Quick Links -->
				<div class="flex flex-col gap-2">
					<router-link :to="{ name: 'GeniusCompliance' }" class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-3">
						<FeatherIcon name="shield" class="w-5 text-icd-600 dark:text-icd-300" />
						<span class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{{ __("Compliance & Privacy") }}</span>
						<FeatherIcon name="chevron-right" class="w-4 text-gray-600 dark:text-gray-500" />
					</router-link>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject } from "vue"
import { createResource, FeatherIcon } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { getDeviceInfo } from "@/data/genius.js"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const employeeInfo = createResource({
	url: `${API_BASE}.checkin.get_employee_info`,
	auto: true,
	cache: "genius:profile:info",
})

const emergencyContacts = createResource({
	url: `${API_BASE}.profile.get_emergency_contacts`,
	auto: true,
	cache: "genius:profile:emergency",
	makeParams() { return { employee: employee.data?.name } },
})

const deviceInfo = getDeviceInfo()

function getInitials(name) {
	if (!name) return "?"
	return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}
</script>
