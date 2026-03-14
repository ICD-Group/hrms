<template>
	<BaseLayout :pageTitle="__('My History')">
		<template #body>
			<div class="flex flex-col mt-3 mb-7 px-4 gap-4">

				<!-- Tab Selector -->
				<div class="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
					<button
						v-for="tab in tabs"
						:key="tab.key"
						@click="activeTab = tab.key"
						class="flex-1 py-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
						:class="activeTab === tab.key
							? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none'
							: 'text-gray-600 dark:text-gray-400'"
					>
						<span>{{ tab.emoji }}</span>
						<span>{{ tab.label }}</span>
					</button>
				</div>

				<!-- Month Selector -->
				<div class="flex items-center gap-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-3">
					<button @click="changeMonth(-1)" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-left" class="w-4 text-gray-600 dark:text-gray-400" />
					</button>
					<div class="flex-1 text-center">
						<div class="text-sm font-bold text-gray-900 dark:text-white">{{ dayjs(selectedMonth).format("MMMM YYYY") }}</div>
					</div>
					<button @click="changeMonth(1)" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center active:bg-gray-200" :disabled="isCurrentMonth">
						<FeatherIcon name="chevron-right" class="w-4 text-gray-600 dark:text-gray-400" :class="isCurrentMonth ? 'opacity-30' : ''" />
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- ==================== TAB: DAYS ==================== -->
				<template v-else-if="activeTab === 'days'">

					<!-- Summary Cards -->
					<div class="grid grid-cols-4 gap-2">
						<div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-2.5 text-center border border-green-100 dark:border-green-800/30">
							<div class="text-lg font-bold text-green-700 dark:text-green-300">{{ daySummary.present }}</div>
							<div class="text-[10px] text-green-600 dark:text-green-400 font-medium">{{ __("Present") }}</div>
						</div>
						<div class="bg-red-50 dark:bg-red-900/30 rounded-xl p-2.5 text-center border border-red-100 dark:border-red-800/30">
							<div class="text-lg font-bold text-red-700 dark:text-red-300">{{ daySummary.absent }}</div>
							<div class="text-[10px] text-red-600 dark:text-red-400 font-medium">{{ __("Absent") }}</div>
						</div>
						<div class="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-2.5 text-center border border-orange-100 dark:border-orange-800/30">
							<div class="text-lg font-bold text-orange-700 dark:text-orange-300">{{ daySummary.leave }}</div>
							<div class="text-[10px] text-orange-600 dark:text-orange-400 font-medium">{{ __("Leave") }}</div>
						</div>
						<div class="bg-icd-50 dark:bg-icd-900/30 rounded-xl p-2.5 text-center border border-icd-100 dark:border-icd-800/30">
							<div class="text-lg font-bold text-icd-700 dark:text-icd-300">{{ daySummary.late }}</div>
							<div class="text-[10px] text-icd-600 dark:text-icd-400 font-medium">{{ __("Late") }}</div>
						</div>
					</div>

					<!-- Mini Calendar Grid (Clickable) -->
					<div class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-3">
						<div class="grid grid-cols-7 gap-0.5">
							<div v-for="d in dayHeaders" :key="d" class="text-[9px] text-center text-gray-500 dark:text-gray-500 font-semibold py-1">{{ d }}</div>
							<div v-for="i in firstDayOffset" :key="'e-'+i"></div>
							<div
								v-for="day in daysInMonth"
								:key="day"
								@click="selectDay(day)"
								class="w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all active:scale-90"
								:class="[
									getDayCellClass(day),
									selectedDay === day ? 'ring-2 ring-icd-500 ring-offset-1 dark:ring-offset-gray-900' : ''
								]"
							>
								{{ day }}
							</div>
						</div>
						<!-- Legend -->
						<div class="flex gap-3 mt-2.5 flex-wrap justify-center">
							<span class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
								<span class="w-2 h-2 rounded-full bg-green-500"></span> {{ __("Present") }}
							</span>
							<span class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
								<span class="w-2 h-2 rounded-full bg-red-500"></span> {{ __("Absent") }}
							</span>
							<span class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
								<span class="w-2 h-2 rounded-full bg-orange-400"></span> {{ __("Leave") }}
							</span>
							<span class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
								<span class="w-2 h-2 rounded-full bg-blue-400"></span> {{ __("Half Day") }}
							</span>
						</div>
					</div>

					<!-- Selected Day Detail Card -->
					<div v-if="selectedDay && selectedDayData" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4 border-l-4" :class="selectedDayBorderColor">
						<div class="flex items-center justify-between mb-3">
							<div class="text-sm font-bold text-gray-900 dark:text-white">
								{{ dayjs(selectedMonth).date(selectedDay).format("dddd, DD-MM") }}
							</div>
							<span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="getStatusBadgeClass(selectedDayData.status)">
								{{ __(selectedDayData.status || "No Record") }}
							</span>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Check-in") }}</div>
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ selectedDayData.check_in || "--:--" }}</div>
							</div>
							<div class="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Check-out") }}</div>
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ selectedDayData.check_out || "--:--" }}</div>
							</div>
							<div class="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Hours") }}</div>
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ selectedDayData.working_hours || "0" }}h</div>
							</div>
							<div class="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Late") }}</div>
								<div class="text-sm font-semibold" :class="selectedDayData.late_entry ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
									{{ selectedDayData.late_entry ? __("Yes") : __("No") }}
								</div>
							</div>
						</div>
						<!-- Penalty info if exists -->
						<div v-if="selectedDayPenalty" class="mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
							<div class="flex items-center justify-between">
								<span class="text-[11px] font-bold text-red-700 dark:text-red-300">
									{{ selectedDayPenalty.penalty_type }} - {{ selectedDayPenalty.penalty_level }}
								</span>
								<span v-if="selectedDayPenalty.deduction_days > 0" class="text-[11px] font-bold text-red-600 dark:text-red-400">
									-{{ selectedDayPenalty.deduction_days }}d
								</span>
							</div>
							<div v-if="selectedDayPenalty.excuse_status" class="text-[10px] mt-1"
								:class="selectedDayPenalty.excuse_status === 'Approved' ? 'text-green-600' : selectedDayPenalty.excuse_status === 'Rejected' ? 'text-red-500' : 'text-orange-500'">
								{{ __("Excuse") }}: {{ __(selectedDayPenalty.excuse_status) }}
							</div>
						</div>
					</div>

					<!-- Day-by-Day List -->
					<div class="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">{{ __("Daily Record") }}</div>
					<div v-if="dayByDayList.length === 0" class="text-center py-6 text-sm text-gray-500 dark:text-gray-500">
						{{ __("No attendance records this month") }}
					</div>
					<div v-else class="flex flex-col gap-1.5">
						<div
							v-for="day in dayByDayList"
							:key="day.date"
							class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none px-3.5 py-2.5 flex items-center gap-3"
							@click="selectDay(dayjs(day.date).date())"
						>
							<div class="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0" :class="getStatusBg(day.status)">
								<div class="text-[10px] font-bold leading-none opacity-70">{{ dayjs(day.date).format("ddd") }}</div>
								<div class="text-sm font-black leading-tight">{{ dayjs(day.date).format("D") }}</div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-1.5">
									<span class="text-[12px] font-semibold text-gray-900 dark:text-white">{{ __(day.status) }}</span>
									<span v-if="day.late_entry" class="text-[9px] font-bold bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-full">{{ __("LATE") }}</span>
									<span v-if="day.early_exit" class="text-[9px] font-bold bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-full">{{ __("EARLY") }}</span>
								</div>
								<div class="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
									{{ day.check_in || "--:--" }} → {{ day.check_out || "--:--" }}
									<span v-if="day.working_hours" class="ml-1 font-semibold">{{ day.working_hours }}h</span>
								</div>
							</div>
							<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
						</div>
					</div>
				</template>

				<!-- ==================== TAB: LATE (Penalties) ==================== -->
				<template v-else-if="activeTab === 'late'">

					<!-- Penalty Summary Card -->
					<div v-if="penaltySummary.data" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
						<div class="flex items-center justify-between mb-3">
							<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("This Month") }}</div>
							<div class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
								:class="penaltySummary.data.warning_level === 'danger' ? 'bg-red-100 dark:bg-red-800/30 text-red-700' : penaltySummary.data.warning_level === 'warning' ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-700' : 'bg-green-100 dark:bg-green-800/30 text-green-700'">
								{{ penaltySummary.data.late_count }}/{{ penaltySummary.data.threshold }} {{ __("late") }}
							</div>
						</div>
						<div class="flex gap-4">
							<div class="flex-1 text-center bg-gray-50 dark:bg-white/5 rounded-lg py-2">
								<div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ penaltySummary.data.late_count }}</div>
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Penalties") }}</div>
							</div>
							<div class="flex-1 text-center bg-gray-50 dark:bg-white/5 rounded-lg py-2">
								<div class="text-lg font-bold text-red-600 dark:text-red-400">{{ penaltySummary.data.total_deduction_days }}</div>
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ __("Deduction Days") }}</div>
							</div>
						</div>
					</div>

					<!-- Penalties List -->
					<div v-if="penalties.data?.penalties?.length > 0" class="flex flex-col gap-2">
						<div
							v-for="pen in penalties.data.penalties"
							:key="pen.name"
							class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-3.5"
						>
							<div class="flex items-start justify-between mb-2">
								<div>
									<div class="text-[12px] font-bold text-gray-900 dark:text-white">{{ dayjs(pen.attendance_date).format("ddd, DD-MM") }}</div>
									<div class="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">{{ __(pen.penalty_type) }}</div>
								</div>
								<div class="flex items-center gap-1.5">
									<span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="getPenaltyLevelClass(pen.penalty_level)">
										{{ __(pen.penalty_level) }}
									</span>
									<span v-if="pen.deduction_days > 0" class="text-[11px] font-bold text-red-600 dark:text-red-400">
										-{{ pen.deduction_days }}d
									</span>
								</div>
							</div>
							<!-- Timing detail -->
							<div class="grid grid-cols-2 gap-2 mb-2">
								<div v-if="pen.late_minutes" class="text-[10px] text-gray-600 dark:text-gray-400">
									<FeatherIcon name="clock" class="w-3 h-3 inline text-red-400" /> {{ __("Late") }}: {{ pen.late_minutes }}{{ __("min") }}
								</div>
								<div v-if="pen.early_minutes" class="text-[10px] text-gray-600 dark:text-gray-400">
									<FeatherIcon name="log-out" class="w-3 h-3 inline text-amber-400" /> {{ __("Early") }}: {{ pen.early_minutes }}{{ __("min") }}
								</div>
							</div>
							<!-- Shift vs actual -->
							<div v-if="pen.shift_start_time || pen.actual_check_in" class="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 mb-2">
								<div class="flex justify-between text-[10px]">
									<span class="text-gray-500 dark:text-gray-500">{{ __("Shift") }}: {{ formatShiftTime(pen.shift_start_time) }} → {{ formatShiftTime(pen.shift_end_time) }}</span>
								</div>
								<div class="flex justify-between text-[10px] mt-0.5">
									<span class="text-gray-700 dark:text-gray-300 font-medium">{{ __("Actual") }}: {{ formatDateTime(pen.actual_check_in) }} → {{ formatDateTime(pen.actual_check_out) }}</span>
								</div>
							</div>
							<!-- Excuse status -->
							<div v-if="pen.excuse_status"
								class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
								:class="pen.excuse_status === 'Approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
									: pen.excuse_status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
									: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'"
							>
								<FeatherIcon :name="pen.excuse_status === 'Approved' ? 'check-circle' : pen.excuse_status === 'Rejected' ? 'x-circle' : 'clock'" class="w-3.5 h-3.5" />
								{{ __("Excuse") }}: {{ __(pen.excuse_status) }}
								<span v-if="pen.excuse_reason" class="text-[10px] font-normal ml-1 truncate">- {{ pen.excuse_reason }}</span>
							</div>
							<div v-if="pen.excuse_status === 'Rejected' && pen.excuse_rejection_reason" class="text-[10px] text-red-500 dark:text-red-400 mt-1 px-1">
								{{ __("Reason") }}: {{ pen.excuse_rejection_reason }}
							</div>
						</div>
					</div>
					<div v-else class="text-center py-8 text-sm text-gray-500 dark:text-gray-500">
						{{ __("No penalties this month") }} &#x1F389;
					</div>
				</template>

				<!-- ==================== TAB: SUMMARY ==================== -->
				<template v-else-if="activeTab === 'summary'">

					<div v-if="monthlySummary.data?.summary" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ dayjs(selectedMonth).format("MMMM YYYY") }}</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
								<div class="text-xl font-bold text-green-700 dark:text-green-300">{{ monthlySummary.data.summary.present_days || 0 }}</div>
								<div class="text-[10px] text-green-600 dark:text-green-400 font-medium">{{ __("Present") }}</div>
							</div>
							<div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
								<div class="text-xl font-bold text-red-600 dark:text-red-400">{{ monthlySummary.data.summary.absent_days || 0 }}</div>
								<div class="text-[10px] text-red-500 dark:text-red-400 font-medium">{{ __("Absent") }}</div>
							</div>
							<div class="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
								<div class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ monthlySummary.data.summary.leave_days || 0 }}</div>
								<div class="text-[10px] text-orange-500 dark:text-orange-400 font-medium">{{ __("Leave") }}</div>
							</div>
							<div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
								<div class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ monthlySummary.data.summary.half_days || 0 }}</div>
								<div class="text-[10px] text-blue-500 dark:text-blue-400 font-medium">{{ __("Half Day") }}</div>
							</div>
						</div>
					</div>

					<!-- Additional Details -->
					<div v-if="monthlySummary.data?.summary" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Details") }}</div>
						<div class="flex flex-col gap-2.5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<FeatherIcon name="clock" class="w-4 h-4 text-icd-500" />
									<span class="text-[12px] text-gray-700 dark:text-gray-300">{{ __("Late Entries") }}</span>
								</div>
								<span class="text-[12px] font-bold" :class="(monthlySummary.data.summary.late_entries || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
									{{ monthlySummary.data.summary.late_entries || 0 }}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<FeatherIcon name="log-out" class="w-4 h-4 text-amber-500" />
									<span class="text-[12px] text-gray-700 dark:text-gray-300">{{ __("Early Exits") }}</span>
								</div>
								<span class="text-[12px] font-bold" :class="(monthlySummary.data.summary.early_exits || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">
									{{ monthlySummary.data.summary.early_exits || 0 }}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<FeatherIcon name="activity" class="w-4 h-4 text-blue-500" />
									<span class="text-[12px] text-gray-700 dark:text-gray-300">{{ __("Total Hours") }}</span>
								</div>
								<span class="text-[12px] font-bold text-gray-800 dark:text-gray-200">
									{{ Math.round(monthlySummary.data.summary.total_hours || 0) }}h
								</span>
							</div>
						</div>
					</div>

					<!-- Penalty Summary for this month -->
					<div v-if="penaltySummary.data && penaltySummary.data.late_count > 0" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Penalty Impact") }}</div>
						<div class="flex gap-4">
							<div class="flex-1 text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2.5">
								<div class="text-lg font-bold text-red-600 dark:text-red-400">{{ penaltySummary.data.late_count }}</div>
								<div class="text-[10px] text-red-500 dark:text-red-400">{{ __("Late") }}</div>
							</div>
							<div class="flex-1 text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2.5">
								<div class="text-lg font-bold text-red-600 dark:text-red-400">{{ penaltySummary.data.total_deduction_days }}</div>
								<div class="text-[10px] text-red-500 dark:text-red-400">{{ __("Deducted") }}</div>
							</div>
						</div>
					</div>

					<div v-if="!monthlySummary.data?.summary || (!monthlySummary.data.summary.present_days && !monthlySummary.data.summary.absent_days && !monthlySummary.data.summary.leave_days && !monthlySummary.data.summary.half_days)" class="text-center py-8 text-sm text-gray-500 dark:text-gray-500">
						{{ __("No attendance records for this month") }}
					</div>
				</template>

				<!-- ==================== TAB: LOGS ==================== -->
				<template v-else-if="activeTab === 'logs'">

					<div v-if="logEntries.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-500">
						{{ __("No check-in logs this month") }}
					</div>
					<div v-else class="flex flex-col gap-1.5">
						<div
							v-for="log in logEntries"
							:key="log.date + log.log_type"
							class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none px-3.5 py-2.5 flex items-center gap-3"
						>
							<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
								:class="log.log_type === 'Check-in' ? 'bg-green-100 dark:bg-green-800/30' : 'bg-blue-100 dark:bg-blue-800/30'">
								<FeatherIcon
									:name="log.log_type === 'Check-in' ? 'log-in' : 'log-out'"
									class="w-4 h-4"
									:class="log.log_type === 'Check-in' ? 'text-green-600' : 'text-blue-600'"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-[12px] font-semibold text-gray-900 dark:text-white">{{ __(log.log_type) }}</div>
								<div class="text-[10px] text-gray-500 dark:text-gray-500">{{ dayjs(log.date).format("ddd, DD-MM") }}</div>
							</div>
							<div class="text-right flex-shrink-0">
								<div class="text-[12px] font-bold text-gray-800 dark:text-gray-200">{{ formatDateTime(log.first_time) }}</div>
								<div v-if="log.log_count > 1" class="text-[9px] text-gray-400 dark:text-gray-500">{{ log.log_count }} {{ __("logs") }}</div>
							</div>
						</div>
					</div>
				</template>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { createResource, FeatherIcon, LoadingIndicator, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const dayjs = inject("$dayjs")
const __ = inject("$translate")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

function _onApiError(e) {
	let msg = __("Failed to load data")
	try { if (e?.message) msg = e.message } catch (_) {}
	toast({ title: msg, icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// ==================== STATE ====================
const activeTab = ref("days")
const selectedMonth = ref(dayjs().startOf("month").format("YYYY-MM-DD"))
const selectedDay = ref(null)
const isLoading = computed(() =>
	calendarEvents.loading || attendanceHistory.loading ||
	penalties.loading || penaltySummary.loading || monthlySummary.loading
)

const tabs = [
	{ key: "days", emoji: "\u{1F4CB}", label: __("Days") },
	{ key: "late", emoji: "\u{26A0}\u{FE0F}", label: __("Late") },
	{ key: "summary", emoji: "\u{1F4CA}", label: __("Summary") },
	{ key: "logs", emoji: "\u{1F552}", label: __("Logs") },
]

// ==================== MONTH NAVIGATION ====================
const isCurrentMonth = computed(() => dayjs(selectedMonth.value).isSame(dayjs(), "month"))
const daysInMonth = computed(() => dayjs(selectedMonth.value).daysInMonth())
const firstDayOffset = computed(() => dayjs(selectedMonth.value).startOf("month").day())

const dayHeaders = computed(() => {
	const getFirst = (s) => Array.from(s.trim())[0]
	return [
		getFirst(__("Sunday")), getFirst(__("Monday")), getFirst(__("Tuesday")),
		getFirst(__("Wednesday")), getFirst(__("Thursday")), getFirst(__("Friday")),
		getFirst(__("Saturday"))
	]
})

function changeMonth(offset) {
	const d = dayjs(selectedMonth.value).add(offset, "month")
	if (d.isAfter(dayjs(), "month")) return
	selectedMonth.value = d.startOf("month").format("YYYY-MM-DD")
	selectedDay.value = null
}

// ==================== API RESOURCES ====================

// Calendar events (for calendar colors)
const calendarEvents = createResource({
	url: "hrms.api.get_attendance_calendar_events",
	auto: true,
	onError: _onApiError,
	makeParams() {
		return {
			employee: employee.data?.name,
			from_date: dayjs(selectedMonth.value).startOf("month").format("YYYY-MM-DD"),
			to_date: dayjs(selectedMonth.value).endOf("month").format("YYYY-MM-DD"),
		}
	},
})

// Attendance history (day-by-day + logs)
const attendanceHistory = createResource({
	url: `${API_BASE}.checkin.get_attendance_history`,
	auto: true,
	onError: _onApiError,
	makeParams() {
		return {
			employee: employee.data?.name,
			from_date: dayjs(selectedMonth.value).startOf("month").format("YYYY-MM-DD"),
			to_date: dayjs(selectedMonth.value).endOf("month").format("YYYY-MM-DD"),
		}
	},
})

// Penalties for this month
const penalties = createResource({
	url: `${API_BASE}.salary.get_penalties`,
	auto: true,
	onError: _onApiError,
	makeParams() {
		const d = dayjs(selectedMonth.value)
		return { employee: employee.data?.name, month: d.month() + 1, year: d.year() }
	},
})

// Penalty summary (lightweight)
const penaltySummary = createResource({
	url: `${API_BASE}.salary.get_penalty_summary`,
	auto: true,
	onError: _onApiError,
	makeParams() {
		const d = dayjs(selectedMonth.value)
		return { employee: employee.data?.name, month: d.month() + 1, year: d.year() }
	},
})

// Monthly summary
const monthlySummary = createResource({
	url: `${API_BASE}.leaves.get_monthly_summary`,
	auto: true,
	onError: _onApiError,
	makeParams() {
		const d = dayjs(selectedMonth.value)
		return { employee: employee.data?.name, month: d.month() + 1, year: d.year() }
	},
})

// Reload all when month changes
watch(selectedMonth, () => {
	calendarEvents.reload()
	attendanceHistory.reload()
	penalties.reload()
	penaltySummary.reload()
	monthlySummary.reload()
})

// ==================== COMPUTED: DAYS TAB ====================

const daySummary = computed(() => {
	const data = { present: 0, absent: 0, leave: 0, late: 0 }
	if (!calendarEvents.data) return data
	for (const status of Object.values(calendarEvents.data)) {
		if (status === "Present" || status === "Work From Home") data.present++
		else if (status === "Absent") data.absent++
		else if (status === "On Leave") data.leave++
		else if (status === "Half Day") data.present++ // Half Day counts as partial present
	}
	// Late count from attendance history
	if (attendanceHistory.data?.attendance) {
		data.late = attendanceHistory.data.attendance.filter(a => a.late_entry).length
	}
	return data
})

const dayByDayList = computed(() => {
	if (!attendanceHistory.data?.attendance) return []
	const logs = attendanceHistory.data.logs || []

	return attendanceHistory.data.attendance.map(att => {
		const dateStr = att.attendance_date
		const checkInLog = logs.find(l => l.date === dateStr && (l.log_type === "Check-in" || l.log_type === "IN"))
		const checkOutLog = logs.find(l => l.date === dateStr && (l.log_type === "Check-out" || l.log_type === "OUT"))

		return {
			date: dateStr,
			status: att.status,
			late_entry: att.late_entry,
			early_exit: att.early_exit,
			working_hours: att.working_hours ? Number(att.working_hours).toFixed(1) : null,
			check_in: checkInLog ? formatDateTime(checkInLog.first_time) : null,
			check_out: checkOutLog ? formatDateTime(checkOutLog.last_time || checkOutLog.first_time) : null,
		}
	})
})

// ==================== SELECTED DAY ====================

function selectDay(day) {
	selectedDay.value = selectedDay.value === day ? null : day
}

const selectedDayData = computed(() => {
	if (!selectedDay.value) return null
	const dateStr = dayjs(selectedMonth.value).date(selectedDay.value).format("YYYY-MM-DD")
	const att = dayByDayList.value.find(d => d.date === dateStr)
	if (att) return att

	// Check calendar for status even if no attendance record
	const status = calendarEvents.data?.[dateStr]
	if (status) {
		return { status, check_in: null, check_out: null, hours: null, late_entry: false }
	}
	return { status: null, check_in: null, check_out: null, hours: null, late_entry: false }
})

const selectedDayPenalty = computed(() => {
	if (!selectedDay.value || !penalties.data?.penalties) return null
	const dateStr = dayjs(selectedMonth.value).date(selectedDay.value).format("YYYY-MM-DD")
	return penalties.data.penalties.find(p => p.attendance_date === dateStr)
})

const selectedDayBorderColor = computed(() => {
	if (!selectedDayData.value?.status) return "border-gray-200 dark:border-gray-700"
	const s = selectedDayData.value.status
	if (s === "Present" || s === "Work From Home") return "border-green-400"
	if (s === "Absent") return "border-red-400"
	if (s === "On Leave") return "border-orange-400"
	if (s === "Half Day") return "border-blue-400"
	return "border-gray-200 dark:border-gray-700"
})

// ==================== COMPUTED: LOGS TAB ====================

const logEntries = computed(() => {
	if (!attendanceHistory.data?.logs) return []
	return attendanceHistory.data.logs
})

// ==================== HELPERS ====================

function getDayCellClass(day) {
	if (!calendarEvents.data) return "bg-gray-100 dark:bg-white/5 text-gray-500"
	const dateStr = dayjs(selectedMonth.value).date(day).format("YYYY-MM-DD")
	const status = calendarEvents.data[dateStr]
	if (!status) return "bg-gray-100 dark:bg-white/5 text-gray-500"
	if (status === "Present" || status === "Work From Home") return "bg-green-500 text-white"
	if (status === "Absent") return "bg-red-500 text-white"
	if (status === "On Leave") return "bg-orange-400 text-white"
	if (status === "Half Day") return "bg-blue-400 text-white"
	if (status === "Holiday") return "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
	return "bg-gray-100 dark:bg-white/5 text-gray-500"
}

function getStatusBadgeClass(status) {
	if (status === "Present" || status === "Work From Home") return "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300"
	if (status === "Absent") return "bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400"
	if (status === "On Leave") return "bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300"
	if (status === "Half Day") return "bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300"
	return "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
}

function getStatusBg(status) {
	if (status === "Present" || status === "Work From Home") return "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300"
	if (status === "Absent") return "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300"
	if (status === "On Leave") return "bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300"
	if (status === "Half Day") return "bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300"
	return "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
}

function getPenaltyLevelClass(level) {
	if (level === "Warning") return "bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300"
	if (level === "Minor") return "bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300"
	if (level === "Major") return "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300"
	if (level === "Accumulated") return "bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300"
	return "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
}

function formatDateTime(dt) {
	if (!dt) return null
	const d = dayjs(dt)
	if (!d.isValid()) return null
	return d.format("hh:mm A")
}

function formatShiftTime(t) {
	if (!t) return "--:--"
	// Shift times come as HH:MM:SS or timedelta string
	const parts = String(t).split(":")
	if (parts.length >= 2) {
		let h = parseInt(parts[0])
		const m = parts[1]
		const ampm = h >= 12 ? "PM" : "AM"
		if (h > 12) h -= 12
		if (h === 0) h = 12
		return `${h}:${m} ${ampm}`
	}
	return t
}
</script>
