<template>
	<BaseLayout :pageTitle="__('Team')">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Top Tabs: Team / Devices -->
				<div class="flex bg-gray-100 rounded-xl p-1 gap-1">
					<button
						@click="viewMode = 'team'"
						class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
						:class="viewMode === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700'"
					>
						<FeatherIcon name="users" class="w-3.5" />
						{{ __("Team") }}
						<span v-if="employees.length" class="text-[11px] opacity-60">{{ employees.length }}</span>
					</button>
					<button
						@click="viewMode = 'devices'; loadDevices()"
						class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
						:class="viewMode === 'devices' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700'"
					>
						<FeatherIcon name="smartphone" class="w-3.5" />
						{{ __("Devices") }}
						<span v-if="deviceStats.registered" class="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
							:class="deviceStats.registered === deviceStats.total ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
							{{ deviceStats.registered }}/{{ deviceStats.total }}
						</span>
					</button>
				</div>

				<!-- =============== TEAM VIEW =============== -->
				<template v-if="viewMode === 'team'">
					<!-- Search -->
					<div class="relative">
						<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-gray-600" />
						<input
							v-model="searchQuery"
							type="text"
							:placeholder="__('Search employees...')"
							class="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:border-icd-400 focus:ring-1 focus:ring-icd-200"
						/>
					</div>

					<!-- Attendance Filter Pills -->
					<div class="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
						<button
							v-for="tab in filterTabs"
							:key="tab.value"
							@click="activeFilter = tab.value"
							class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all"
							:class="activeFilter === tab.value
								? 'bg-gray-900 text-white shadow-sm'
								: 'bg-white/80 text-gray-600 border border-gray-100'"
						>
							<span v-if="tab.dot" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="tab.dot"></span>
							{{ tab.label }}
							<span v-if="tab.count > 0" class="text-[11px] opacity-60">{{ tab.count }}</span>
						</button>
					</div>

					<!-- Loading -->
					<div v-if="isLoading" class="flex items-center justify-center py-16">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Empty State -->
					<div v-else-if="filteredEmployees.length === 0" class="text-center py-16">
						<FeatherIcon name="users" class="w-10 h-10 text-gray-700 mx-auto mb-2" />
						<div class="text-sm text-gray-700">{{ __("No employees found") }}</div>
					</div>

					<!-- Employee Cards Grid (2 columns) -->
					<div v-else class="grid grid-cols-2 gap-2">
						<div
							v-for="emp in filteredEmployees"
							:key="emp.name"
							@click="openEmployeeDetail(emp)"
							class="team-card"
						>
							<!-- Top color accent bar -->
							<div class="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-xl" :class="getStatus(emp).bar"></div>

							<!-- Row 1: Avatar + Name -->
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 overflow-hidden"
									:class="getStatus(emp).avatarBg">
									<img v-if="emp.image" :src="emp.image" class="w-full h-full object-cover" />
									<span v-else class="text-white">{{ (emp.employee_name || '?')[0] }}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-[12px] font-bold text-gray-900 truncate leading-tight">{{ emp.employee_name }}</div>
									<div class="text-[11px] text-gray-700 truncate leading-tight mt-0.5">{{ emp.designation || emp.department || '-' }}</div>
								</div>
							</div>

							<!-- Row 2: Attendance info -->
							<div class="mt-2 pt-2 border-t border-gray-50">
								<!-- Status + Time -->
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1">
										<span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getStatus(emp).dot"></span>
										<span class="text-[11px] font-bold leading-none" :class="getStatus(emp).text">{{ getStatus(emp).label }}</span>
									</div>
									<span v-if="emp._checkIn" class="text-[11px] font-semibold text-gray-600">{{ formatTime(emp._checkIn) }}</span>
								</div>

								<!-- Late badge -->
								<div v-if="emp._lateMinutes > 0" class="mt-1.5">
									<span class="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
										{{ formatLateTime(emp._lateMinutes) }} late
									</span>
								</div>

								<!-- Working hours (for present/late/checked_out) -->
								<div v-if="emp._workingHours && emp._workingHours > 0" class="flex items-center gap-1 mt-1">
									<FeatherIcon name="clock" class="w-2.5 h-2.5 text-gray-700" />
									<span class="text-[11px] text-gray-600 font-medium">{{ emp._workingHours.toFixed(1) }}h worked</span>
								</div>

								<!-- Check-out time (for checked_out) -->
								<div v-if="emp._attStatus === 'checked_out' && emp._checkOut" class="flex items-center gap-1 mt-0.5">
									<FeatherIcon name="log-out" class="w-2.5 h-2.5 text-gray-700" />
									<span class="text-[11px] text-gray-600 font-medium">Out {{ formatTime(emp._checkOut) }}</span>
								</div>

								<!-- Leave type -->
								<div v-if="emp._attStatus === 'on_leave' && emp._leaveType" class="mt-1.5">
									<span class="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
										{{ emp._leaveType }}
									</span>
								</div>
							</div>
						</div>
					</div>
				</template>

				<!-- =============== DEVICES VIEW =============== -->
				<template v-if="viewMode === 'devices'">
					<!-- Summary Cards -->
					<div class="grid grid-cols-3 gap-2">
						<div class="bg-white rounded-xl p-3 text-center border border-gray-100">
							<div class="text-lg font-bold text-green-600">{{ deviceStats.registered }}</div>
							<div class="text-[11px] text-gray-700 font-medium">{{ __("Registered") }}</div>
						</div>
						<div class="bg-white rounded-xl p-3 text-center border border-gray-100">
							<div class="text-lg font-bold text-amber-500">{{ deviceStats.unregistered }}</div>
							<div class="text-[11px] text-gray-700 font-medium">{{ __("No Device") }}</div>
						</div>
						<div class="bg-white rounded-xl p-3 text-center border border-gray-100">
							<div class="text-lg font-bold text-gray-700">{{ deviceStats.total }}</div>
							<div class="text-[11px] text-gray-700 font-medium">{{ __("Total") }}</div>
						</div>
					</div>

					<!-- Device Search & Filter -->
					<div class="flex gap-2">
						<div class="relative flex-1">
							<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-gray-600" />
							<input
								v-model="deviceSearch"
								type="text"
								:placeholder="__('Search by name...')"
								class="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:border-icd-400 focus:ring-1 focus:ring-icd-200"
							/>
						</div>
						<button
							@click="loadDevices"
							class="px-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100"
						>
							<FeatherIcon name="refresh-cw" class="w-4 text-gray-700" :class="{ 'animate-spin': devicesLoading }" />
						</button>
					</div>

					<!-- Device Filter -->
					<div class="flex gap-2">
						<button
							v-for="f in deviceFilters"
							:key="f.value"
							@click="activeDeviceFilter = f.value"
							class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
							:class="activeDeviceFilter === f.value
								? 'bg-icd-600 text-white'
								: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
						>
							{{ f.label }}
						</button>
					</div>

					<!-- Devices Loading -->
					<div v-if="devicesLoading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Devices Empty -->
					<div v-else-if="filteredDevices.length === 0" class="text-center py-10 text-sm text-gray-700">
						{{ __("No employees found") }}
					</div>

					<!-- Device Cards -->
					<div v-else class="flex flex-col gap-2">
						<div
							v-for="emp in filteredDevices"
							:key="emp.employee"
							class="bg-white rounded-xl border border-gray-100 overflow-hidden"
						>
							<!-- Employee header -->
							<div class="p-3 flex items-center gap-3">
								<div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
									:class="emp.has_device ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'">
									<img v-if="emp.image" :src="emp.image" class="w-full h-full object-cover" />
									<span v-else>{{ (emp.employee_name || "?")[0] }}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5">
										<div class="text-sm font-semibold text-gray-900 truncate">{{ emp.employee_name }}</div>
										<span class="text-[11px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
											:class="emp.has_device
												? 'bg-green-100 text-green-700'
												: 'bg-gray-200 text-gray-700'">
											{{ emp.has_device ? __("Locked") : __("Open") }}
										</span>
									</div>
									<div class="text-[11px] text-gray-700 truncate">{{ emp.designation || emp.department || emp.user }}</div>
								</div>
								<button
									v-if="emp.has_device"
									@click="resetDevice(emp)"
									class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-500 bg-red-50 active:bg-red-100 flex-shrink-0"
								>
									{{ __("Reset") }}
								</button>
							</div>

							<!-- Device details (only if registered) -->
							<div v-if="emp.has_device" class="px-3 pb-3 pt-0">
								<div class="bg-gray-100 rounded-lg p-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
									<div v-if="emp.device_os">
										<div class="text-[11px] text-gray-600 uppercase tracking-wider">{{ __("OS") }}</div>
										<div class="text-xs font-medium text-gray-700 mt-0.5 flex items-center gap-1">
											<span v-if="emp.device_os.includes('iOS') || emp.device_os.includes('iPhone')">&#63743;</span>
											<span v-else-if="emp.device_os.includes('Android')">&#129302;</span>
											<span v-else-if="emp.device_os.includes('Windows')">&#128187;</span>
											<span v-else-if="emp.device_os.includes('Mac') || emp.device_os.includes('mac')">&#63743;</span>
											<span v-else>&#128241;</span>
											{{ emp.device_os }}
										</div>
									</div>
									<div v-if="emp.device_browser">
										<div class="text-[11px] text-gray-600 uppercase tracking-wider">{{ __("Browser") }}</div>
										<div class="text-xs font-medium text-gray-700 mt-0.5">{{ emp.device_browser }}</div>
									</div>
									<div v-if="!emp.device_os && !emp.device_browser && emp.device_info">
										<div class="text-[11px] text-gray-600 uppercase tracking-wider">{{ __("Device") }}</div>
										<div class="text-xs font-medium text-gray-700 mt-0.5">{{ emp.device_info }}</div>
									</div>
									<div>
										<div class="text-[11px] text-gray-600 uppercase tracking-wider">{{ __("Registered") }}</div>
										<div class="text-xs font-medium text-gray-700 mt-0.5">{{ formatDate(emp.registered_on) }}</div>
									</div>
									<div>
										<div class="text-[11px] text-gray-600 uppercase tracking-wider">{{ __("Login") }}</div>
										<div class="text-xs font-medium text-gray-700 mt-0.5 truncate">{{ emp.user }}</div>
									</div>
								</div>
							</div>

							<!-- No device message -->
							<div v-else class="px-3 pb-3 pt-0">
								<div class="bg-amber-50 rounded-lg p-2.5 text-[11px] text-amber-700 text-center font-medium">
									{{ __("No device registered. Will auto-register on first HRMS login.") }}
								</div>
							</div>
						</div>
					</div>
				</template>
			</div>

			<!-- ========== Employee Detail Modal ========== -->
			<ion-modal
				class="glass-detail-modal"
				:is-open="showDetailModal"
				@didDismiss="showDetailModal = false"
				:initial-breakpoint="0.92"
				:breakpoints="[0, 0.92, 1]"
			>
				<div v-if="selectedEmployee" class="p-5 pb-8 employee-modal-content">
					<!-- Header -->
					<div class="flex items-center gap-3 mb-4">
						<div class="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 overflow-hidden"
							:class="getStatus(selectedEmployee).avatarBg">
							<img v-if="selectedEmployee.image" :src="selectedEmployee.image" class="w-full h-full object-cover" />
							<span v-else class="text-white">{{ (selectedEmployee.employee_name || '?')[0] }}</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-base font-bold text-gray-900">{{ selectedEmployee.employee_name }}</div>
							<div class="text-sm text-gray-700">{{ selectedEmployee.designation }}</div>
							<div class="text-xs text-gray-600">{{ selectedEmployee.name }}</div>
						</div>
						<span class="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" :class="getStatus(selectedEmployee).badge">
							{{ getStatus(selectedEmployee).label }}
						</span>
					</div>

					<!-- Today's Attendance Card -->
					<div class="rounded-xl overflow-hidden border" :class="getStatus(selectedEmployee).cardBorder">
						<div class="px-3 py-2 flex items-center gap-2" :class="getStatus(selectedEmployee).cardHeaderBg">
							<FeatherIcon name="activity" class="w-3.5 h-3.5" :class="getStatus(selectedEmployee).text" />
							<span class="text-[11px] font-bold" :class="getStatus(selectedEmployee).text">{{ __("Today's Attendance") }}</span>
							<span v-if="selectedEmployee._lateMinutes > 0" class="ml-auto text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
								{{ formatLateTime(selectedEmployee._lateMinutes) }} late
							</span>
						</div>
						<div class="p-3 bg-white/70">
							<div class="grid grid-cols-3 gap-3">
								<div class="text-center">
									<div class="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{{ __("Check In") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-1">{{ formatTime(selectedEmployee._checkIn) || '--:--' }}</div>
								</div>
								<div class="text-center">
									<div class="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{{ __("Check Out") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-1">{{ formatTime(selectedEmployee._checkOut) || '--:--' }}</div>
								</div>
								<div class="text-center">
									<div class="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{{ __("Hours") }}</div>
									<div class="text-sm font-bold text-gray-800 mt-1">{{ selectedEmployee._workingHours ? selectedEmployee._workingHours.toFixed(1) + 'h' : '--' }}</div>
								</div>
							</div>
							<!-- Leave type info -->
							<div v-if="selectedEmployee._attStatus === 'on_leave' && selectedEmployee._leaveType" class="mt-2 pt-2 border-t border-gray-50 text-center">
								<span class="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{ selectedEmployee._leaveType }}</span>
							</div>
						</div>
					</div>

					<!-- Employee Info Grid -->
					<div class="grid grid-cols-2 gap-2.5 mt-4">
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Department") }}</div>
							<div class="text-[13px] font-semibold text-gray-800 mt-0.5">{{ selectedEmployee.department || "-" }}</div>
						</div>
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Branch") }}</div>
							<div class="text-[13px] font-semibold text-gray-800 mt-0.5">{{ selectedEmployee.branch || "-" }}</div>
						</div>
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Joined") }}</div>
							<div class="text-[13px] font-semibold text-gray-800 mt-0.5">{{ formatJoinDate(selectedEmployee.date_of_joining) }}</div>
						</div>
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Type") }}</div>
							<div class="text-[13px] font-semibold text-gray-800 mt-0.5">{{ selectedEmployee.employment_type || "-" }}</div>
						</div>
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Status") }}</div>
							<div class="text-[13px] font-semibold mt-0.5" :class="selectedEmployee.status === 'Active' ? 'text-green-700' : 'text-gray-700'">{{ selectedEmployee.status || "-" }}</div>
						</div>
						<div class="bg-white/50 rounded-xl p-2.5 border border-white/60">
							<div class="text-[11px] text-gray-600 font-medium">{{ __("Reports To") }}</div>
							<div class="text-[13px] font-semibold text-gray-800 mt-0.5 truncate">{{ selectedEmployee.reports_to || "-" }}</div>
						</div>
					</div>

					<!-- WFH Configuration -->
					<div class="mt-4 rounded-xl border border-indigo-100 overflow-hidden">
						<div class="px-3 py-2 flex items-center gap-2 bg-indigo-50">
							<FeatherIcon name="home" class="w-3.5 h-3.5 text-indigo-600" />
							<span class="text-[11px] font-bold text-indigo-700">{{ __("Work From Home") }}</span>
						</div>
						<div class="p-3 bg-white/70">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-xs font-semibold text-gray-700">{{ __("WFH Enabled") }}</div>
									<div class="text-[11px] text-gray-600 mt-0.5">{{ __("Allow remote check-in without geofence") }}</div>
								</div>
								<button
								@click="toggleWfh(selectedEmployee)"
								:disabled="wfhUpdating"
								class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50"
								:class="selectedEmployee._isWfh ? 'bg-indigo-600' : 'bg-gray-300'"
							>
								<span
									class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
									:class="selectedEmployee._isWfh ? 'translate-x-5' : 'translate-x-0'"
								></span>
							</button>
							</div>
							<div v-if="selectedEmployee._isWfh" class="mt-3 pt-3 border-t border-gray-50">
								<div class="flex items-center justify-between">
									<div class="text-xs text-gray-600">{{ __("Required Office Days/Month") }}</div>
									<div class="flex items-center gap-1.5">
										<button @click="adjustOfficeDays(selectedEmployee, -1)" class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 text-sm font-bold">-</button>
										<span class="text-sm font-bold text-indigo-700 w-6 text-center">{{ selectedEmployee._wfhOfficeDays || 2 }}</span>
										<button @click="adjustOfficeDays(selectedEmployee, 1)" class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 text-sm font-bold">+</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Contact Actions -->
					<div class="flex gap-2 mt-4">
						<a
							v-if="selectedEmployee.cell_number"
							:href="`tel:${selectedEmployee.cell_number}`"
							class="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold active:bg-green-700 transition-colors"
						>
							<FeatherIcon name="phone" class="w-4" />
							{{ __("Call") }}
						</a>
						<a
							v-if="selectedEmployee.company_email || selectedEmployee.personal_email"
							:href="`mailto:${selectedEmployee.company_email || selectedEmployee.personal_email}`"
							class="flex-1 flex items-center justify-center gap-2 bg-icd-600 text-white rounded-xl py-3 text-sm font-semibold active:bg-icd-700 transition-colors"
						>
							<FeatherIcon name="mail" class="w-4" />
							{{ __("Email") }}
						</a>
					</div>

					<!-- Contact Info -->
					<div v-if="selectedEmployee.cell_number || selectedEmployee.company_email || selectedEmployee.personal_email" class="mt-3 bg-white/50 rounded-xl p-3 border border-white/60">
						<div class="text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wider">{{ __("Contact") }}</div>
						<div v-if="selectedEmployee.cell_number" class="flex items-center gap-2 text-xs text-gray-700 mb-1.5">
							<FeatherIcon name="phone" class="w-3 text-gray-600" />
							{{ selectedEmployee.cell_number }}
						</div>
						<div v-if="selectedEmployee.company_email" class="flex items-center gap-2 text-xs text-gray-700 mb-1.5">
							<FeatherIcon name="mail" class="w-3 text-gray-600" />
							{{ selectedEmployee.company_email }}
						</div>
						<div v-if="selectedEmployee.personal_email && selectedEmployee.personal_email !== selectedEmployee.company_email" class="flex items-center gap-2 text-xs text-gray-700">
							<FeatherIcon name="mail" class="w-3 text-gray-600" />
							{{ selectedEmployee.personal_email }}
						</div>
					</div>
				</div>
			</ion-modal>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onActivated } from "vue"
import { useRouter } from "vue-router"
import { IonModal } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, toast, call } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList } = useManagerApi()
import BaseLayout from "@/components/BaseLayout.vue"

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")

// ===== SHARED STATE =====
const viewMode = ref("team")

// ===== TEAM VIEW =====
const searchQuery = ref("")
const activeFilter = ref("all")
const showDetailModal = ref(false)
const selectedEmployee = ref(null)
const employees = ref([])
const isLoading = ref(false)
const attCounts = ref({})
const wfhUpdating = ref(false)

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// Status config helper
function getStatus(emp) {
	const s = emp._attStatus
	switch (s) {
		case 'present': return {
			label: 'On Time', dot: 'bg-emerald-500', text: 'text-emerald-700', bar: 'bg-emerald-500',
			avatarBg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',
			cardBorder: 'border-emerald-100', cardHeaderBg: 'bg-emerald-50',
		}
		case 'late': return {
			label: 'Late', dot: 'bg-amber-500', text: 'text-amber-700', bar: 'bg-amber-500',
			avatarBg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700',
			cardBorder: 'border-amber-100', cardHeaderBg: 'bg-amber-50',
		}
		case 'not_arrived': return {
			label: 'Absent', dot: 'bg-red-500', text: 'text-red-600', bar: 'bg-red-500',
			avatarBg: 'bg-red-400', badge: 'bg-red-100 text-red-700',
			cardBorder: 'border-red-100', cardHeaderBg: 'bg-red-50',
		}
		case 'on_leave': return {
			label: emp._leaveType || 'On Leave', dot: 'bg-blue-500', text: 'text-blue-700', bar: 'bg-blue-500',
			avatarBg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700',
			cardBorder: 'border-blue-100', cardHeaderBg: 'bg-blue-50',
		}
		case 'checked_out': return {
			label: 'Left', dot: 'bg-purple-400', text: 'text-purple-600', bar: 'bg-purple-400',
			avatarBg: 'bg-purple-400', badge: 'bg-purple-100 text-purple-700',
			cardBorder: 'border-purple-100', cardHeaderBg: 'bg-purple-50',
		}
		default: return {
			label: 'N/A', dot: 'bg-gray-300', text: 'text-gray-600', bar: 'bg-gray-300',
			avatarBg: 'bg-icd-100 !text-icd-700', badge: 'bg-gray-100 text-gray-700',
			cardBorder: 'border-gray-100', cardHeaderBg: 'bg-gray-100',
		}
	}
}

// Filter tabs (dynamic counts)
const filterTabs = computed(() => {
	const c = attCounts.value
	return [
		{ label: __("All"), value: "all", count: employees.value.length, dot: null },
		{ label: __("On Time"), value: "present", count: c.present || 0, dot: 'bg-emerald-500' },
		{ label: __("Late"), value: "late", count: c.late || 0, dot: 'bg-amber-500' },
		{ label: __("Absent"), value: "not_arrived", count: c.not_arrived || 0, dot: 'bg-red-500' },
		{ label: __("Leave"), value: "on_leave", count: c.on_leave || 0, dot: 'bg-blue-500' },
		{ label: __("Left"), value: "checked_out", count: c.checked_out || 0, dot: 'bg-purple-400' },
	]
})

async function loadEmployees() {
	const company = employee.data?.company
	if (!company) return
	isLoading.value = true
	try {
		// Parallel fetch: employee list + today's attendance
		const [empData, attRes] = await Promise.all([
			getList({
				doctype: "Employee",
				filters: { company: company, status: "Active" },
				fields: [
					"name", "employee_name", "designation", "department",
					"branch", "status", "image", "date_of_joining",
					"employment_type", "cell_number", "company_email",
					"personal_email", "reports_to",
					"custom_is_wfh", "custom_wfh_office_days",
				],
				order_by: "employee_name asc",
				limit_page_length: 0,
			}),
			fetch("/api/method/icd3s_attendance.icd3s_attendance.api.attendance.get_manager_dashboard_summary", {
				headers: {
					"X-Frappe-CSRF-Token": window.csrf_token || window.frappe?.csrf_token || "",
					"Accept": "application/json",
				},
			}).then(r => r.ok ? r.json() : null).catch(() => null),
		])

		// Build attendance map from dashboard cards
		const attMap = {}
		const counts = {}
		if (attRes?.message?.cards) {
			for (const card of attRes.message.cards) {
				counts[card.key] = card.count || 0
				for (const emp of card.employees || []) {
					attMap[emp.employee] = {
						_attStatus: card.key,
						_checkIn: emp.check_in_time,
						_checkOut: emp.check_out_time,
						_lateMinutes: emp.late_minutes || 0,
						_workingHours: emp.working_hours,
						_leaveType: emp.leave_type,
						_lastAction: emp.last_action,
						_lastTime: emp.last_time,
						_earlyExit: emp.early_exit,
					}
				}
			}
		}

		// Merge employee data with attendance + WFH flags
		employees.value = (empData || []).map(emp => ({
			...emp,
			...(attMap[emp.name] || { _attStatus: 'unknown' }),
			_isWfh: emp.custom_is_wfh ? true : false,
			_wfhOfficeDays: emp.custom_wfh_office_days || 2,
		}))

		attCounts.value = counts
	} catch (e) {
		_errToast(e, "Failed to load employees")
		employees.value = []
	} finally {
		isLoading.value = false
	}
}

// Load on mount + re-entry + company change (same pattern as Dashboard)
onMounted(() => { loadEmployees() })
onActivated(() => { loadEmployees() })
watch(() => employee.data?.company, (c) => { if (c) loadEmployees() })

const filteredEmployees = computed(() => {
	let list = employees.value

	if (activeFilter.value !== "all") {
		list = list.filter((e) => e._attStatus === activeFilter.value)
	}

	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase()
		list = list.filter(
			(e) =>
				(e.employee_name || "").toLowerCase().includes(q) ||
				(e.name || "").toLowerCase().includes(q) ||
				(e.designation || "").toLowerCase().includes(q) ||
				(e.department || "").toLowerCase().includes(q)
		)
	}

	return list
})

function openEmployeeDetail(emp) {
	selectedEmployee.value = emp
	showDetailModal.value = true
}

// WFH Management
async function toggleWfh(emp) {
	wfhUpdating.value = true
	try {
		const newVal = !emp._isWfh
		await call(`${API_BASE}.update_employee_wfh`, {
			employee: emp.name,
			is_wfh: newVal ? 1 : 0,
			wfh_office_days: emp._wfhOfficeDays || 2,
		})
		emp._isWfh = newVal
		toast({ title: newVal ? __("WFH enabled") : __("WFH disabled"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
	} catch (e) {
		console.error("[Employees] WFH toggle error:", e)
		toast({ title: __("Failed to update WFH"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		wfhUpdating.value = false
	}
}

async function adjustOfficeDays(emp, delta) {
	const newVal = Math.max(0, Math.min(30, (emp._wfhOfficeDays || 2) + delta))
	if (newVal === emp._wfhOfficeDays) return
	wfhUpdating.value = true
	try {
		await call(`${API_BASE}.update_employee_wfh`, {
			employee: emp.name,
			is_wfh: emp._isWfh ? 1 : 0,
			wfh_office_days: newVal,
		})
		emp._wfhOfficeDays = newVal
	} catch (e) {
		_errToast(e, "Failed to update office days")
	} finally {
		wfhUpdating.value = false
	}
}

// Time formatting
function formatTime(ts) {
	if (!ts) return null
	try {
		const d = new Date(ts)
		if (isNaN(d.getTime())) return null
		let h = d.getHours()
		const m = d.getMinutes().toString().padStart(2, '0')
		const ampm = h >= 12 ? 'PM' : 'AM'
		h = h % 12 || 12
		return `${h}:${m} ${ampm}`
	} catch { return null }
}

function formatLateTime(minutes) {
	if (!minutes && minutes !== 0) return ''
	const m = parseInt(minutes)
	if (m >= 60) {
		const h = Math.floor(m / 60)
		const rm = m % 60
		return rm > 0 ? h + 'h ' + rm + 'm' : h + 'h'
	}
	return m + ' min'
}

function formatJoinDate(dt) {
	if (!dt) return "-"
	try {
		const d = new Date(dt)
		return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
	} catch { return dt }
}

// ===== DEVICES VIEW =====
const devicesLoading = ref(false)
const deviceList = ref([])
const deviceSearch = ref("")
const activeDeviceFilter = ref("all")

const deviceFilters = [
	{ label: __("All"), value: "all" },
	{ label: __("Registered"), value: "registered" },
	{ label: __("No Device"), value: "unregistered" },
]

const deviceStats = computed(() => {
	const total = deviceList.value.length
	const registered = deviceList.value.filter(e => e.has_device).length
	return { total, registered, unregistered: total - registered }
})

const filteredDevices = computed(() => {
	let list = deviceList.value

	if (activeDeviceFilter.value === "registered") {
		list = list.filter(e => e.has_device)
	} else if (activeDeviceFilter.value === "unregistered") {
		list = list.filter(e => !e.has_device)
	}

	if (deviceSearch.value.trim()) {
		const q = deviceSearch.value.toLowerCase()
		list = list.filter(e =>
			(e.employee_name || "").toLowerCase().includes(q) ||
			(e.user || "").toLowerCase().includes(q) ||
			(e.device_info || "").toLowerCase().includes(q)
		)
	}

	return list
})

async function loadDevices() {
	devicesLoading.value = true
	try {
		const res = await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.get_registered_employees", {
			headers: { "X-Frappe-CSRF-Token": window.csrf_token || window.frappe?.csrf_token || "", "Accept": "application/json" },
		})
		if (res.ok) {
			const json = await res.json()
			deviceList.value = json.message || []
		}
	} catch (e) {
		console.warn("[Devices] Failed to load:", e)
	}
	devicesLoading.value = false
}

async function resetDevice(emp) {
	if (!confirm(__("Reset {0}'s device? They will need to re-register from their phone.", [emp.employee_name]))) return
	try {
		const res = await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.reset_employee_device", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": window.csrf_token || window.frappe?.csrf_token || "" },
			body: JSON.stringify({ employee: emp.employee }),
		})
		if (res.ok) {
			const idx = deviceList.value.findIndex(e => e.employee === emp.employee)
			if (idx >= 0) {
				deviceList.value[idx].has_device = false
				deviceList.value[idx].device_info = ""
				deviceList.value[idx].device_os = ""
				deviceList.value[idx].device_browser = ""
				deviceList.value[idx].registered_on = null
			}
			toast({ title: __("Device Reset"), text: __("{0}'s device has been reset", [emp.employee_name]), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		}
	} catch (e) {
		console.warn("[Devices] Reset error:", e)
	}
}

function formatDate(dt) {
	if (!dt) return "-"
	const d = new Date(dt)
	const now = new Date()
	const diff = Math.floor((now - d) / 1000)
	if (diff < 60) return __("Just now")
	if (diff < 3600) return __("{0}m ago", [Math.floor(diff / 60)])
	if (diff < 86400) return __("{0}h ago", [Math.floor(diff / 3600)])
	const days = Math.floor(diff / 86400)
	if (days === 1) return __("Yesterday")
	if (days < 7) return __("{0}d ago", [days])
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
</script>

<style scoped>
.team-card {
	position: relative;
	background: rgba(255, 255, 255, 0.65);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.5);
	padding: 10px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03);
	transition: transform 0.15s ease, box-shadow 0.15s ease;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
}
.team-card:active {
	transform: scale(0.97);
	box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.employee-modal-content {
	background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.88) 100%);
	min-height: 100%;
}
</style>

<!-- Non-scoped for Ionic shadow DOM -->
<style>
.glass-detail-modal::part(content) {
	background: rgba(248, 250, 252, 0.92);
	backdrop-filter: blur(40px) saturate(180%);
	-webkit-backdrop-filter: blur(40px) saturate(180%);
}
.glass-detail-modal::part(handle) {
	background: rgba(180, 180, 200, 0.4);
	width: 48px;
}
</style>
