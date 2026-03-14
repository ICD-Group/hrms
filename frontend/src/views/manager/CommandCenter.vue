<template>
	<BaseLayout :pageTitle="__('Command')">
		<template #body>
			<div class="flex flex-col mt-2 mb-7 gap-0">

				<!-- Tab Pills -->
				<div class="flex gap-2 px-4 pb-3 overflow-x-auto">
					<button
						v-for="tab in tabs"
						:key="tab.key"
						@click="activeTab = tab.key"
						class="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95"
						:class="activeTab === tab.key
							? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
							: 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-300'"
					>
						<FeatherIcon :name="tab.icon" class="w-4 h-4" />
						<span>{{ tab.label }}</span>
						<span
							v-if="tab.count > 0"
							class="min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[11px] font-black"
							:class="activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-red-500 text-white'"
						>{{ tab.count > 99 ? '99+' : tab.count }}</span>
					</button>
				</div>

				<!-- ==================== TAB 1: APPROVALS ==================== -->
				<div v-if="activeTab === 'approvals'" class="flex flex-col gap-3 px-4 pt-2">

					<!-- Summary -->
					<div v-if="approvalSummary.total > 0" class="flex items-center gap-2">
						<div class="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-sm">
							<div class="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse"></div>
							<span class="text-sm font-bold">{{ __("{0} pending approvals", [approvalSummary.total]) }}</span>
						</div>
					</div>

					<!-- Type Cards -->
					<div v-if="approvalCards.length === 0 && !approvalsData.loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
						<div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mx-auto mb-3">
							<FeatherIcon name="check-circle" class="w-7 h-7 text-green-600" />
						</div>
						<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ __("All Clear") }}</div>
						<div class="text-sm text-gray-600 dark:text-gray-700 mt-1">{{ __("No pending approvals") }}</div>
					</div>

					<div v-else class="flex flex-col gap-2.5">
						<div
							v-for="card in approvalCards"
							:key="card.type"
							class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-transform"
							@click="goToApprovals(card.type)"
						>
							<div class="flex items-center gap-3.5">
								<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="card.bg">
									<FeatherIcon :name="card.icon" class="w-6 h-6" :class="card.color" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-[15px] font-bold text-gray-900 dark:text-gray-100">{{ card.label }}</div>
									<div class="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{{ __("{0} pending", [card.count]) }}</div>
								</div>
								<div
									class="min-w-[32px] h-[32px] flex items-center justify-center rounded-full text-sm font-black bg-red-500 text-white shadow-sm"
								>{{ card.count }}</div>
								<FeatherIcon name="chevron-right" class="w-5 h-5 text-gray-700 dark:text-gray-700" />
							</div>
						</div>
					</div>

					<!-- View All Link -->
					<button
						@click="router.push({ name: 'ManagerApprovals' })"
						class="w-full bg-green-600 text-white rounded-xl py-3.5 text-sm font-bold active:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<FeatherIcon name="list" class="w-4 h-4" />
						{{ __("Open Full Approvals") }}
					</button>
				</div>

				<!-- ==================== TAB 2: NOTIFICATIONS ==================== -->
				<div v-if="activeTab === 'notifications'" class="flex flex-col gap-0 pt-2">

					<!-- Filter Chips -->
					<div class="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar">
						<button v-for="f in notifFilters" :key="f.key"
							@click="activeFilter = f.key"
							class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
							:class="activeFilter === f.key
								? 'bg-green-600 text-white shadow-sm'
								: 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-300'"
						>
							<span>{{ f.label }}</span>
							<span v-if="f.key !== 'all' && getFilterCount(f) > 0"
								class="min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-black"
								:class="activeFilter === f.key ? 'bg-white/25 text-white' : 'bg-gray-400/40 dark:bg-white/15 text-gray-800 dark:text-gray-200'"
							>{{ getFilterCount(f) }}</span>
						</button>
					</div>

					<!-- Mark All Read -->
					<div v-if="unreadNotificationsCount.data > 0" class="flex items-center justify-between mb-1 px-4">
						<div class="inline-flex items-center gap-2 bg-green-600 text-white px-3.5 py-1.5 rounded-full shadow-sm">
							<div class="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
							<span class="text-sm font-bold">{{ __("{0} unread", [unreadNotificationsCount.data]) }}</span>
						</div>
						<button
							@click="markAllRead.submit"
							class="text-sm font-bold text-green-600 dark:text-green-300 active:opacity-60"
						>{{ __("Mark all read") }}</button>
					</div>

					<!-- Time-Grouped Notifications -->
					<template v-if="visibleGroups.length">
						<div v-for="group in visibleGroups" :key="group.key" class="mb-1">
							<div class="px-4 py-2">
								<span class="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-700">{{ group.label }}</span>
							</div>
							<div class="flex flex-col gap-2 px-4">
								<div v-for="item in group.items" :key="item.name"
									class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-0 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
									@click="openNotification(item)"
								>
									<div class="flex items-start gap-3 p-4" :class="!item.read ? 'border-l-[3px] border-l-green-500' : ''">
										<!-- Icon -->
										<div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
											:class="getIconBg(item.reference_document_type)">
											<component
												v-if="getCustomIcon(item.reference_document_type)"
												:is="getCustomIcon(item.reference_document_type)"
												class="w-5 h-5"
												:class="getIconColor(item.reference_document_type)"
											/>
											<FeatherIcon
												v-else
												:name="getFeatherIcon(item.reference_document_type)"
												class="w-5 h-5"
												:class="getIconColor(item.reference_document_type)"
											/>
										</div>
										<!-- Content -->
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between gap-2">
												<div class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{{ parseNotifName(item) }}</div>
												<span
													v-if="docStatuses[`${item.reference_document_type}:${item.reference_document_name}`]"
													class="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
													:class="statusClass(docStatuses[`${item.reference_document_type}:${item.reference_document_name}`])"
												>{{ docStatuses[`${item.reference_document_type}:${item.reference_document_name}`] }}</span>
											</div>
											<div class="text-[13px] text-gray-800 dark:text-gray-300 mt-0.5 leading-snug">{{ parseNotifSummary(item) }}</div>
											<div class="flex items-center gap-2 mt-1.5">
												<span class="text-xs text-gray-600 dark:text-gray-700">{{ dayjs(item.creation).fromNow() }}</span>
												<span v-if="item.reference_document_type"
													class="text-[11px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
													:class="getTypeChipClass(item.reference_document_type)"
												>{{ getTypeLabel(item.reference_document_type) }}</span>
											</div>
										</div>
										<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 dark:text-gray-700 flex-shrink-0 mt-2" />
									</div>
								</div>
							</div>
						</div>
					</template>

					<!-- Load More -->
					<div v-if="notifications.data?.length && notifications.hasNextPage" class="flex justify-center pt-2 px-4">
						<button @click="loadMoreNotifs" class="px-5 py-2.5 rounded-full bg-gray-200 dark:bg-white/10 text-sm font-bold text-gray-800 dark:text-gray-300 active:bg-gray-300 transition-colors">
							{{ __("Load more") }}
						</button>
					</div>

					<!-- Empty -->
					<div v-if="!filteredNotifications.length && !notifications.loading" class="flex flex-col items-center justify-center py-16 px-4">
						<div class="w-14 h-14 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center mb-3">
							<FeatherIcon name="bell-off" class="w-7 h-7 text-gray-700 dark:text-gray-700" />
						</div>
						<div class="text-base font-bold text-gray-700 dark:text-gray-300">{{ __("No notifications") }}</div>
					</div>
				</div>

				<!-- ==================== TAB 3: PAYROLL ==================== -->
				<div v-if="activeTab === 'payroll'" class="flex flex-col gap-3 px-4 pt-2">

					<!-- Quick Payroll Status -->
					<div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center">
								<FeatherIcon name="dollar-sign" class="w-6 h-6 text-emerald-600" />
							</div>
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ __("Payroll Overview") }}</div>
								<div class="text-sm text-gray-700 dark:text-gray-300">{{ dayjs().format("MMMM YYYY") }}</div>
							</div>
						</div>
						<div v-if="payrollStatus.loading" class="py-4">
							<LoadingIndicator class="w-6 h-6 text-gray-700 mx-auto" />
						</div>
						<div v-else-if="payrollStatus.data">
							<div class="grid grid-cols-3 gap-2.5 mb-4">
								<div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 text-center">
									<div class="text-xl font-black text-gray-900 dark:text-gray-100">{{ payrollStatus.data.total_employees || 0 }}</div>
									<div class="text-xs text-gray-700 dark:text-gray-300 font-semibold mt-0.5">{{ __("Employees") }}</div>
								</div>
								<div class="bg-green-50 dark:bg-green-800/15 rounded-xl p-3 text-center">
									<div class="text-xl font-black text-green-600">{{ payrollStatus.data.approved || 0 }}</div>
									<div class="text-xs text-green-700 dark:text-green-300 font-semibold mt-0.5">{{ __("Approved") }}</div>
								</div>
								<div class="bg-orange-50 dark:bg-orange-800/15 rounded-xl p-3 text-center">
									<div class="text-xl font-black text-orange-600">{{ payrollStatus.data.pending || 0 }}</div>
									<div class="text-xs text-orange-700 dark:text-orange-300 font-semibold mt-0.5">{{ __("Pending") }}</div>
								</div>
							</div>
							<div v-if="payrollStatus.data.current_stage" class="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-800/15 rounded-xl p-3.5 mb-4">
								<FeatherIcon name="info" class="w-4 h-4 text-emerald-600 flex-shrink-0" />
								<span class="text-sm text-emerald-800 dark:text-emerald-200 font-medium">{{ payrollStatus.data.current_stage }}</span>
							</div>
						</div>
						<button
							@click="router.push({ name: 'ManagerSalary' })"
							class="w-full bg-emerald-600 text-white rounded-xl py-3.5 text-sm font-bold active:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
						>
							<FeatherIcon name="external-link" class="w-4 h-4" />
							{{ __("Open Payroll Hub") }}
						</button>
					</div>
				</div>

				<!-- ==================== TAB 4: TEAM INTEL ==================== -->
				<div v-if="activeTab === 'intel'" class="flex flex-col gap-3 px-4 pt-2">

					<!-- Staffing Suggestions -->
					<div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
								<FeatherIcon name="users" class="w-5 h-5 text-blue-600" />
							</div>
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ __("Staffing Insights") }}</div>
								<div class="text-sm text-gray-700 dark:text-gray-300">{{ __("AI-powered team recommendations") }}</div>
							</div>
						</div>
						<div v-if="staffing.loading" class="py-4"><LoadingIndicator class="w-6 h-6 text-gray-700 mx-auto" /></div>
						<div v-else-if="staffing.data?.departments?.length">
							<div v-for="dept in staffingAlerts" :key="dept.department"
								class="flex items-center justify-between bg-blue-50 dark:bg-blue-800/15 rounded-xl p-3.5 mb-2">
								<div class="min-w-0">
									<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ dept.department }}</div>
									<div class="text-[13px] text-gray-700 dark:text-gray-300 mt-0.5">{{ dept.headcount }} staff &middot; {{ dept.recommendations?.[0] || 'On track' }}</div>
								</div>
								<span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
									:class="dept.health === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300' : dept.health === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300'"
								>{{ dept.health }}</span>
							</div>
						</div>
						<div v-else class="text-sm text-gray-600 dark:text-gray-700 text-center py-4">{{ __("No staffing insights available") }}</div>
					</div>

					<!-- Team Burnout Overview -->
					<div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center">
								<FeatherIcon name="activity" class="w-5 h-5 text-orange-600" />
							</div>
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ __("Team Wellbeing") }}</div>
								<div class="text-sm text-gray-700 dark:text-gray-300">{{ __("Burnout risk across your team") }}</div>
							</div>
						</div>
						<div v-if="teamBurnout.loading" class="py-4"><LoadingIndicator class="w-6 h-6 text-gray-700 mx-auto" /></div>
						<div v-else-if="teamBurnout.data">
							<!-- Summary -->
							<div class="flex items-center gap-2.5 mb-3">
								<div class="flex-1 text-center bg-red-50 dark:bg-red-800/20 rounded-xl p-3">
									<div class="text-xl font-black text-red-600">{{ teamBurnout.data.high_risk_count || 0 }}</div>
									<div class="text-xs font-bold text-red-700 dark:text-red-300 mt-0.5">HIGH</div>
								</div>
								<div class="flex-1 text-center bg-amber-50 dark:bg-amber-800/20 rounded-xl p-3">
									<div class="text-xl font-black text-amber-600">{{ teamBurnout.data.medium_risk_count || 0 }}</div>
									<div class="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">MEDIUM</div>
								</div>
								<div class="flex-1 text-center bg-green-50 dark:bg-green-800/20 rounded-xl p-3">
									<div class="text-xl font-black text-green-600">{{ teamBurnout.data.low_risk_count || 0 }}</div>
									<div class="text-xs font-bold text-green-700 dark:text-green-300 mt-0.5">LOW</div>
								</div>
							</div>
							<!-- High risk employees -->
							<div v-if="teamBurnout.data.high_risk?.length" class="flex flex-col gap-2">
								<div v-for="emp in teamBurnout.data.high_risk.slice(0, 5)" :key="emp.employee"
									class="flex items-center justify-between bg-red-50 dark:bg-red-800/15 rounded-xl p-3.5">
									<div class="min-w-0">
										<span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ emp.employee_name }}</span>
										<div class="text-[13px] text-gray-700 dark:text-gray-300 mt-0.5">{{ emp.overtime_hours }}h OT &middot; {{ emp.late_days }} late</div>
									</div>
									<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300">{{ emp.risk_score }}%</span>
								</div>
							</div>
							<div v-else class="flex items-center gap-2.5 bg-green-50 dark:bg-green-800/15 rounded-xl p-3.5">
								<FeatherIcon name="heart" class="w-5 h-5 text-green-600" />
								<span class="text-sm text-green-800 dark:text-green-200 font-semibold">{{ __("Team wellbeing looks good") }}</span>
							</div>
						</div>
						<div v-else class="text-sm text-gray-600 dark:text-gray-700 text-center py-4">{{ __("No data available") }}</div>
					</div>

					<!-- Weather Impact on Team -->
					<div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-800/30 flex items-center justify-center">
								<FeatherIcon name="cloud" class="w-5 h-5 text-sky-600" />
							</div>
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ __("Weather & Attendance") }}</div>
								<div class="text-sm text-gray-700 dark:text-gray-300">{{ __("Environmental impact on team") }}</div>
							</div>
						</div>
						<div v-if="teamWeather.loading" class="py-4"><LoadingIndicator class="w-6 h-6 text-gray-700 mx-auto" /></div>
						<div v-else-if="teamWeather.data?.day_of_week_impact?.length">
							<div class="flex flex-wrap gap-2">
								<div v-for="day in teamWeather.data.day_of_week_impact" :key="day.day"
									class="flex-1 min-w-[55px] text-center rounded-xl p-2.5"
									:class="day.impact === 'high' ? 'bg-red-50 dark:bg-red-800/20' : day.impact === 'medium' ? 'bg-amber-50 dark:bg-amber-800/20' : 'bg-green-50 dark:bg-green-800/20'">
									<div class="text-xs font-bold text-gray-800 dark:text-gray-300">{{ day.day.slice(0,3) }}</div>
									<div class="text-base font-black" :class="day.impact === 'high' ? 'text-red-600' : day.impact === 'medium' ? 'text-amber-600' : 'text-green-600'">{{ day.late_rate }}%</div>
									<div class="text-[11px] font-medium text-gray-600 dark:text-gray-700">late</div>
								</div>
							</div>
							<div v-if="teamWeather.data.peak_late_day" class="mt-3 text-sm text-gray-700 dark:text-gray-300 text-center">
								Peak: <span class="font-bold text-gray-900 dark:text-gray-100">{{ teamWeather.data.peak_late_day.day }}</span> ({{ teamWeather.data.peak_late_day.late_rate }}% late rate)
							</div>
						</div>
						<div v-else class="text-sm text-gray-600 dark:text-gray-700 text-center py-4">{{ __("No weather data") }}</div>
					</div>
				</div>

			</div>
		</template>

		<!-- Doc Detail Bottom Sheet -->
		<teleport to="#modals">
			<div v-if="docDetail" class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50" @click.self="closeDocDetail">
				<div class="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl p-5 pb-safe-bottom animate-slide-up">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="getIconBg(docDetail.type)">
								<component v-if="getCustomIcon(docDetail.type)" :is="getCustomIcon(docDetail.type)" class="w-5 h-5" :class="getIconColor(docDetail.type)" />
							<FeatherIcon v-else :name="getFeatherIcon(docDetail.type)" class="w-5 h-5" :class="getIconColor(docDetail.type)" />
							</div>
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-white">{{ getTypeLabel(docDetail.type) }}</div>
								<div class="text-sm text-gray-700 dark:text-gray-300">{{ docDetail.docName }}</div>
							</div>
						</div>
						<span v-if="docDetail.status" class="text-xs font-bold px-2.5 py-1 rounded-full" :class="statusClass(docDetail.status)">{{ docDetail.status }}</span>
					</div>
					<div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
						<div class="text-sm text-gray-900 dark:text-gray-200 leading-relaxed">{{ docDetail.message }}</div>
						<div class="text-sm text-gray-600 dark:text-gray-700 mt-2">{{ docDetail.time }}</div>
					</div>
					<div class="flex gap-2.5">
						<button @click="closeDocDetail" class="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 active:bg-gray-300">{{ __("Close") }}</button>
						<button @click="goToManagerApprovals" class="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 text-white active:bg-green-700 transition-colors shadow-sm">{{ __("Approvals") }}</button>
					</div>
				</div>
			</div>
		</teleport>
	</BaseLayout>
</template>

<script setup>
import { computed, inject, onMounted, onActivated, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { createResource, FeatherIcon, LoadingIndicator, call } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import {
	unreadNotificationsCount,
	notifications,
} from "@/data/notifications"

import LeaveIcon from "@/components/icons/LeaveIcon.vue"
import ExpenseIcon from "@/components/icons/ExpenseIcon.vue"
import SalaryIcon from "@/components/icons/SalaryIcon.vue"
import AttendanceIcon from "@/components/icons/AttendanceIcon.vue"
import HomeIcon from "@/components/icons/HomeIcon.vue"
import ShiftIcon from "@/components/icons/ShiftIcon.vue"
import EmployeeAdvanceIcon from "@/components/icons/EmployeeAdvanceIcon.vue"

const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const route = useRoute()
const router = useRouter()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"
const ATT_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

// ==================== TAB STATE ====================

const activeTab = ref(route.query.tab || "approvals")

const tabs = computed(() => [
	{ key: "approvals", icon: "check-circle", label: __("Approvals"), count: approvalSummary.value.total },
	{ key: "notifications", icon: "bell", label: __("Updates"), count: unreadNotificationsCount.data || 0 },
	{ key: "payroll", icon: "dollar-sign", label: __("Payroll"), count: 0 },
	{ key: "intel", icon: "cpu", label: __("Intel"), count: 0 },
])

// ==================== TAB 1: APPROVALS ====================

const approvalsData = createResource({
	url: `${ATT_BASE}.get_manager_dashboard_summary`,
	auto: true,
	cache: "cmd:mgr_dashboard",
})

const mgrDaData = createResource({
	url: `${ATT_BASE}.get_disciplinary_summary`,
	auto: true,
	cache: "cmd:mgr_da",
})

const approvalSummary = computed(() => {
	const p = approvalsData.data?.pending || {}
	const da = mgrDaData.data || {}
	const daCount = (da.mgr_pending_hr || 0) + (da.mgr_pending_ceo || 0) + (da.mgr_appeals || 0)
	const total = (p.leaves || 0) + (p.expenses || 0) + (p.corrections || 0)
		+ (p.swaps || 0) + (p.devices || 0) + (p.meals || 0)
		+ (p.work_requests || 0) + (p.attendance || 0) + (p.advances || 0) + (p.excuses || 0) + (p.permissions || 0) + daCount
	return { total, ...p, disciplinary: daCount }
})

const APPROVAL_TYPES = [
	{ key: "leaves", label: "Leave", icon: "calendar", bg: "bg-blue-100 dark:bg-blue-800/30", color: "text-blue-600" },
	{ key: "expenses", label: "Expense", icon: "credit-card", bg: "bg-green-100 dark:bg-green-800/30", color: "text-green-600" },
	{ key: "corrections", label: "Correction", icon: "edit-3", bg: "bg-purple-100 dark:bg-purple-800/30", color: "text-purple-600" },
	{ key: "swaps", label: "Shift Swap", icon: "repeat", bg: "bg-pink-100 dark:bg-pink-800/30", color: "text-pink-600" },
	{ key: "devices", label: "Device", icon: "smartphone", bg: "bg-amber-100 dark:bg-amber-800/30", color: "text-amber-600" },
	{ key: "meals", label: "Meal", icon: "coffee", bg: "bg-emerald-100 dark:bg-emerald-800/30", color: "text-emerald-600" },
	{ key: "work_requests", label: "WFH", icon: "home", bg: "bg-indigo-100 dark:bg-indigo-800/30", color: "text-indigo-600" },
	{ key: "attendance", label: "Attendance", icon: "check-square", bg: "bg-teal-100 dark:bg-teal-800/30", color: "text-teal-600" },
	{ key: "disciplinary", label: "Disciplinary", icon: "shield", bg: "bg-red-100 dark:bg-red-800/30", color: "text-red-600" },
	{ key: "advances", label: "Advance", icon: "dollar-sign", bg: "bg-cyan-100 dark:bg-cyan-800/30", color: "text-cyan-600" },
	{ key: "excuses", label: "Late Excuse", icon: "clock", bg: "bg-orange-100 dark:bg-orange-800/30", color: "text-orange-600" },
	{ key: "permissions", label: "Permission", icon: "shield", bg: "bg-violet-100 dark:bg-violet-800/30", color: "text-violet-600" },
]

const approvalCards = computed(() => {
	const d = approvalSummary.value
	return APPROVAL_TYPES
		.filter(t => (d[t.key] || 0) > 0)
		.map(t => ({ type: t.key, label: __(t.label), count: d[t.key], icon: t.icon, bg: t.bg, color: t.color }))
})

// Navigate to Approvals with correct tab pre-selected
const CARD_TAB_MAP = { work_requests: "work" }
function goToApprovals(type) {
	if (type === "excuses") { router.push({ name: "ManagerLateExcuses" }); return }
	if (type === "permissions") { router.push({ name: "PermissionApprovals" }); return }
	const tab = CARD_TAB_MAP[type] || type
	router.push({ name: "ManagerApprovals", query: { tab } })
}

// ==================== TAB 2: NOTIFICATIONS ====================

const markAllRead = createResource({
	url: "hrms.api.mark_all_notifications_as_read",
	onSuccess() { notifications.reload() },
})

// -- Doc status badges --
const docStatuses = ref({})
const STATUS_FIELD_MAP = {
	"ICD3S Work Request": "status", "Leave Application": "status",
	"Expense Claim": "approval_status", "ICD3S Meal Claim": "status",
	"ICD3S Attendance Correction": "status", "ICD3S Shift Swap": "status",
	"ICD3S Device Binding": "approval_status", "ICD3S Late Penalty": "status",
	"Attendance Request": "workflow_state", "Employee Advance": "status",
	"ICD3S Payroll Review": "status", "Salary Slip": "docstatus",
	"ICD3S Monthly Attendance Summary": "status", "ICD3S Attendance Log": "status",
	"ICD3S Employee Permission": "status",
}

async function fetchDocStatuses() {
	const items = notifications.data || []
	const batch = []
	for (const item of items) {
		if (!item.reference_document_type || !item.reference_document_name) continue
		const key = `${item.reference_document_type}:${item.reference_document_name}`
		if (docStatuses.value[key]) continue
		const fn = STATUS_FIELD_MAP[item.reference_document_type]
		if (!fn) continue
		batch.push({ doctype: item.reference_document_type, name: item.reference_document_name, fieldname: fn })
	}
	if (!batch.length) return
	try {
		const result = await call("icd3s_attendance.icd3s_attendance.api.modules.manager.batch_get_doc_statuses", { items: JSON.stringify(batch) })
		if (result) Object.assign(docStatuses.value, result)
	} catch(e) { console.warn("[CommandCenter] batch status fetch failed:", e) }
}

watch(() => notifications.data, (d) => { if (d?.length) fetchDocStatuses() }, { immediate: true })

// -- Load more --
let notifStart = 0
function loadMoreNotifs() {
	notifStart += 10
	notifications.start = notifStart
	notifications.pageLength = 10
	notifications.list.fetch()
}

// -- Routing: ALL in-app, NO window.open() --
const DETAIL_VIEW_ROUTES = {
	"Leave Application": "LeaveApplicationDetailView",
	"Expense Claim": "ExpenseClaimDetailView",
	"Shift Request": "ShiftRequestDetailView",
	"Shift Assignment": "ShiftAssignmentDetailView",
	"Attendance Request": "AttendanceRequestDetailView",
	"Employee Advance": "EmployeeAdvanceDetailView",
	"Appraisal": "AppraisalDetailView",
	"Grievance": "GrievanceDetailView",
	"Training Event": "TrainingEventDetailView",
	"Loan Application": "LoanApplicationDetailView",
	"Travel Request": "TravelRequestDetailView",
	"ICD3S Disciplinary Action": "ManagerDisciplinaryDetail",
}

// ICD3S approval types → open in Approvals page with specific tab + doc
const APPROVAL_ROUTE_MAP = {
	"ICD3S Work Request": "work",
	"ICD3S Attendance Correction": "corrections",
	"ICD3S Shift Swap": "swaps",
	"ICD3S Device Binding": "devices",
	"ICD3S Meal Claim": "meals",
}

// Non-approval page routes (types without detail views or approval handling)
const PAGE_ROUTES = {
	"Salary Slip": { name: "GeniusSalarySlip", useNameParam: true },
	"ICD3S Payroll Review": { name: "PayrollApprovals" },
	"ICD3S Monthly Payroll": { name: "PayrollActions" },
	"ICD3S Late Penalty": { name: "ManagerLateExcuses" },
	"ICD3S Monthly Attendance Summary": { name: "PayrollActions" },
	"ICD3S Attendance Log": { name: "ManagerCommand" },
	"ICD3S Employee Permission": { name: "PermissionApprovals" },
}

const docDetail = ref(null)

function openNotification(item) {
	notifications.setValue.submit({ name: item.name, read: 1 }, {
		onSuccess: () => unreadNotificationsCount.reload(),
	})
	if (!item.reference_document_type || !item.reference_document_name) return
	const dt = item.reference_document_type
	const dn = item.reference_document_name

	// 1. DocTypes with their own detail view (:id param)
	if (DETAIL_VIEW_ROUTES[dt]) {
		router.push({ name: DETAIL_VIEW_ROUTES[dt], params: { id: dn } })
		return
	}

	// 2. ICD3S approval types → open in Approvals with specific tab + doc detail
	if (APPROVAL_ROUTE_MAP[dt]) {
		router.push({ name: "ManagerApprovals", query: { tab: APPROVAL_ROUTE_MAP[dt], doc: dn, doctype: dt } })
		return
	}

	// 3. Other page routes (salary, payroll, late excuses)
	const pageRoute = PAGE_ROUTES[dt]
	if (pageRoute) {
		router.push(pageRoute.useNameParam
			? { name: pageRoute.name, params: { name: dn } }
			: { name: pageRoute.name })
		return
	}

	// 4. Fallback: bottom sheet for unknown types
	docDetail.value = {
		type: dt, docName: dn,
		message: parseNotifSummary(item),
		time: dayjs(item.creation).format("DD-MM-YYYY h:mm A"),
		status: docStatuses.value[`${dt}:${dn}`] || null,
	}
}

function closeDocDetail() { docDetail.value = null }
function goToManagerApprovals() {
	const dt = docDetail.value?.type
	const dn = docDetail.value?.docName
	docDetail.value = null
	if (APPROVAL_ROUTE_MAP[dt]) {
		router.push({ name: "ManagerApprovals", query: { tab: APPROVAL_ROUTE_MAP[dt], doc: dn, doctype: dt } })
	} else {
		router.push({ name: "ManagerApprovals" })
	}
}

// -- Parsing helpers --
function stripHtml(html) {
	if (!html) return ""
	return html.replace(/<br\s*\/?>/gi, " ").replace(/<\/(?:p|div|li)>/gi, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function parseNotifName(item) {
	if (!item) return ""
	const plain = stripHtml(item.message || "")
	const m1 = plain.match(/^New\s+\w+\s+Request\s+(.+?)\s+(submitted|raised|requested)/i)
	if (m1) return m1[1].trim()
	const m2 = plain.match(/^(.+?)\s+(raised|submitted|requested|created|approved|rejected|cancelled)/i)
	if (m2 && !/^New\s/i.test(m2[1])) return m2[1].trim()
	if (/^Your\s/i.test(plain)) return "You"
	if (item.from_user && item.from_user !== "Administrator") {
		return item.from_user.split("@")[0].split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
	}
	return plain.substring(0, 30)
}

function parseNotifSummary(item) {
	if (!item) return ""
	const plain = stripHtml(item.message || "")
	const dt = item.reference_document_type || ""
	const label = TYPE_LABELS[dt] || dt.replace("ICD3S ", "")
	if (/\bapproved\b/i.test(plain)) return `${label} was approved`
	if (/\brejected\b/i.test(plain)) return `${label} was rejected`
	if (/\bcancelled\b/i.test(plain)) return `${label} was cancelled`
	if (/raised a new|submitted a/i.test(plain)) return `New ${label} for approval`
	if (/^Your /i.test(plain)) {
		if (/approved/i.test(plain)) return `Your ${label} was approved`
		if (/rejected/i.test(plain)) return `Your ${label} was rejected`
		return `Update on your ${label}`
	}
	return label
}

// -- Custom SVG icons (same as GeniusInbox) --
const CUSTOM_ICON_MAP = {
	"Leave Application": LeaveIcon,
	"Expense Claim": ExpenseIcon,
	"Salary Slip": SalaryIcon,
	"Employee Advance": EmployeeAdvanceIcon,
	"Shift Request": ShiftIcon,
	"Shift Assignment": ShiftIcon,
	"Attendance Request": AttendanceIcon,
	"ICD3S Work Request": HomeIcon,
}

// FeatherIcon fallback for types without custom SVG
const FEATHER_ICON_MAP = {
	"ICD3S Meal Claim": "coffee",
	"ICD3S Attendance Correction": "edit-3",
	"ICD3S Shift Swap": "repeat",
	"ICD3S Device Binding": "smartphone",
	"ICD3S Late Penalty": "clock",
	"ICD3S Payroll Review": "clipboard",
	"ICD3S Monthly Payroll": "layers",
	"ICD3S Disciplinary Action": "alert-triangle",
	"ICD3S Monthly Attendance Summary": "bar-chart-2",
	"ICD3S Attendance Log": "log-in",
	"ICD3S Employee Permission": "unlock",
	"Loan Application": "credit-card",
	"Appraisal": "star",
	"Grievance": "flag",
	"Training Event": "book-open",
	"Travel Request": "map-pin",
}

const ICON_BG = {
	"Leave Application": "bg-blue-100 dark:bg-blue-800/25",
	"Expense Claim": "bg-green-100 dark:bg-green-800/25",
	"Salary Slip": "bg-sky-100 dark:bg-sky-800/25",
	"Employee Advance": "bg-cyan-100 dark:bg-cyan-800/25",
	"Shift Request": "bg-indigo-100 dark:bg-indigo-800/25",
	"Shift Assignment": "bg-indigo-100 dark:bg-indigo-800/25",
	"Attendance Request": "bg-teal-100 dark:bg-teal-800/25",
	"ICD3S Work Request": "bg-violet-100 dark:bg-violet-800/25",
	"ICD3S Meal Claim": "bg-emerald-100 dark:bg-emerald-800/25",
	"ICD3S Attendance Correction": "bg-purple-100 dark:bg-purple-800/25",
	"ICD3S Shift Swap": "bg-pink-100 dark:bg-pink-800/25",
	"ICD3S Device Binding": "bg-amber-100 dark:bg-amber-800/25",
	"ICD3S Late Penalty": "bg-orange-100 dark:bg-orange-800/25",
	"ICD3S Payroll Review": "bg-violet-100 dark:bg-violet-800/25",
	"ICD3S Monthly Payroll": "bg-fuchsia-100 dark:bg-fuchsia-800/25",
	"ICD3S Disciplinary Action": "bg-red-100 dark:bg-red-800/25",
	"ICD3S Monthly Attendance Summary": "bg-sky-100 dark:bg-sky-800/25",
	"ICD3S Attendance Log": "bg-teal-100 dark:bg-teal-800/25",
	"ICD3S Employee Permission": "bg-lime-100 dark:bg-lime-800/25",
	"Loan Application": "bg-cyan-100 dark:bg-cyan-800/25",
	"Appraisal": "bg-yellow-100 dark:bg-yellow-800/25",
	"Grievance": "bg-rose-100 dark:bg-rose-800/25",
	"Training Event": "bg-lime-100 dark:bg-lime-800/25",
	"Travel Request": "bg-slate-100 dark:bg-slate-800/25",
}

const ICON_COLOR = {
	"Leave Application": "text-blue-600 dark:text-blue-400",
	"Expense Claim": "text-green-600 dark:text-green-400",
	"Salary Slip": "text-sky-600 dark:text-sky-400",
	"Employee Advance": "text-cyan-600 dark:text-cyan-400",
	"Shift Request": "text-indigo-600 dark:text-indigo-400",
	"Shift Assignment": "text-indigo-600 dark:text-indigo-400",
	"Attendance Request": "text-teal-600 dark:text-teal-400",
	"ICD3S Work Request": "text-violet-600 dark:text-violet-400",
	"ICD3S Meal Claim": "text-emerald-600 dark:text-emerald-400",
	"ICD3S Attendance Correction": "text-purple-600 dark:text-purple-400",
	"ICD3S Shift Swap": "text-pink-600 dark:text-pink-400",
	"ICD3S Device Binding": "text-amber-600 dark:text-amber-400",
	"ICD3S Late Penalty": "text-orange-600 dark:text-orange-400",
	"ICD3S Payroll Review": "text-violet-600 dark:text-violet-400",
	"ICD3S Monthly Payroll": "text-fuchsia-600 dark:text-fuchsia-400",
	"ICD3S Disciplinary Action": "text-red-600 dark:text-red-400",
	"ICD3S Monthly Attendance Summary": "text-sky-600 dark:text-sky-400",
	"ICD3S Attendance Log": "text-teal-600 dark:text-teal-400",
	"ICD3S Employee Permission": "text-lime-600 dark:text-lime-400",
	"Loan Application": "text-cyan-600 dark:text-cyan-400",
	"Appraisal": "text-yellow-600 dark:text-yellow-400",
	"Grievance": "text-rose-600 dark:text-rose-400",
	"Training Event": "text-lime-600 dark:text-lime-400",
	"Travel Request": "text-slate-600 dark:text-slate-400",
}

function getCustomIcon(dt) { return CUSTOM_ICON_MAP[dt] || null }
function getFeatherIcon(dt) { return FEATHER_ICON_MAP[dt] || "bell" }
function getIconBg(dt) { return ICON_BG[dt] || "bg-gray-100 dark:bg-white/10" }
function getIconColor(dt) { return ICON_COLOR[dt] || "text-gray-700" }

// -- Type labels & chips --
const TYPE_LABELS = {
	"ICD3S Work Request": "WFH", "Leave Application": "Leave", "Expense Claim": "Expense",
	"ICD3S Meal Claim": "Meal", "ICD3S Attendance Correction": "Correction", "ICD3S Shift Swap": "Swap",
	"ICD3S Device Binding": "Device", "ICD3S Late Penalty": "Late Excuse", "Attendance Request": "Attendance",
	"Employee Advance": "Advance", "Salary Slip": "Salary", "ICD3S Payroll Review": "Payroll Review",
	"ICD3S Monthly Payroll": "Monthly Payroll", "Loan Application": "Loan",
	"ICD3S Disciplinary Action": "Disciplinary", "Shift Request": "Shift", "Shift Assignment": "Shift",
	"Appraisal": "Appraisal", "Grievance": "Grievance", "Training Event": "Training", "Travel Request": "Travel",
	"ICD3S Monthly Attendance Summary": "Summary", "ICD3S Attendance Log": "Check-in",
	"ICD3S Employee Permission": "Permission",
}

const TYPE_CHIP_CLASS = {
	"Leave Application": "bg-blue-100 text-blue-700 dark:bg-blue-800/25 dark:text-blue-300",
	"Expense Claim": "bg-green-100 text-green-700 dark:bg-green-800/25 dark:text-green-300",
	"Salary Slip": "bg-sky-100 text-sky-700 dark:bg-sky-800/25 dark:text-sky-300",
	"Employee Advance": "bg-cyan-100 text-cyan-700 dark:bg-cyan-800/25 dark:text-cyan-300",
	"Attendance Request": "bg-teal-100 text-teal-700 dark:bg-teal-800/25 dark:text-teal-300",
	"ICD3S Work Request": "bg-violet-100 text-violet-700 dark:bg-violet-800/25 dark:text-violet-300",
	"ICD3S Meal Claim": "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/25 dark:text-emerald-300",
	"ICD3S Attendance Correction": "bg-purple-100 text-purple-700 dark:bg-purple-800/25 dark:text-purple-300",
	"ICD3S Shift Swap": "bg-pink-100 text-pink-700 dark:bg-pink-800/25 dark:text-pink-300",
	"ICD3S Device Binding": "bg-amber-100 text-amber-700 dark:bg-amber-800/25 dark:text-amber-300",
	"ICD3S Late Penalty": "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300",
	"ICD3S Disciplinary Action": "bg-red-100 text-red-700 dark:bg-red-800/25 dark:text-red-300",
	"ICD3S Monthly Attendance Summary": "bg-sky-100 text-sky-700 dark:bg-sky-800/25 dark:text-sky-300",
	"ICD3S Attendance Log": "bg-teal-100 text-teal-700 dark:bg-teal-800/25 dark:text-teal-300",
	"ICD3S Employee Permission": "bg-lime-100 text-lime-700 dark:bg-lime-800/25 dark:text-lime-300",
}

function getTypeLabel(dt) { return TYPE_LABELS[dt] || (dt || "").replace("ICD3S ", "") }
function getTypeChipClass(dt) { return TYPE_CHIP_CLASS[dt] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-700" }

// -- Filter chips --
const activeFilter = ref("all")

const notifFilters = [
	{ key: "all", label: "All" },
	{ key: "leave", label: "Leave", types: ["Leave Application"] },
	{ key: "salary", label: "Salary", types: ["Salary Slip", "ICD3S Payroll Review", "ICD3S Monthly Payroll", "ICD3S Monthly Attendance Summary"] },
	{ key: "attendance", label: "Attendance", types: ["Attendance Request", "ICD3S Attendance Correction", "ICD3S Late Penalty", "ICD3S Attendance Log", "ICD3S Employee Permission"] },
	{ key: "expense", label: "Expense", types: ["Expense Claim"] },
	{ key: "work", label: "WFH", types: ["ICD3S Work Request"] },
	{ key: "meal", label: "Meal", types: ["ICD3S Meal Claim"] },
	{ key: "shift", label: "Shift", types: ["Shift Request", "Shift Assignment", "ICD3S Shift Swap"] },
	{ key: "advance", label: "Advance", types: ["Employee Advance"] },
]

function getFilterCount(f) {
	if (!notifications.data?.length || !f.types) return 0
	return notifications.data.filter(item => f.types.includes(item.reference_document_type)).length
}

// -- Time grouping --
const filteredNotifications = computed(() => {
	if (!notifications.data?.length) return []
	if (activeFilter.value === "all") return notifications.data
	const f = notifFilters.find(x => x.key === activeFilter.value)
	if (!f?.types) return notifications.data
	return notifications.data.filter(item => f.types.includes(item.reference_document_type))
})

const visibleGroups = computed(() => {
	const items = filteredNotifications.value
	const now = dayjs()
	const today = [], yesterday = [], thisWeek = [], earlier = []
	for (const item of items) {
		const d = dayjs(item.creation)
		if (now.isSame(d, "day")) today.push(item)
		else if (now.subtract(1, "day").isSame(d, "day")) yesterday.push(item)
		else if (now.diff(d, "day") < 7) thisWeek.push(item)
		else earlier.push(item)
	}
	const result = []
	if (today.length) result.push({ key: "today", label: __("Today"), items: today })
	if (yesterday.length) result.push({ key: "yesterday", label: __("Yesterday"), items: yesterday })
	if (thisWeek.length) result.push({ key: "this_week", label: __("This Week"), items: thisWeek })
	if (earlier.length) result.push({ key: "earlier", label: __("Earlier"), items: earlier })
	return result
})

// -- Status class --
function statusClass(status) {
	if (!status) return "bg-gray-100 text-gray-600"
	const s = String(status).toLowerCase()
	if (s === "approved" || s === "completed" || s === "1") return "bg-green-100 text-green-700 dark:bg-green-800/25 dark:text-green-300"
	if (s === "rejected") return "bg-red-100 text-red-700 dark:bg-red-800/25 dark:text-red-300"
	if (s === "cancelled" || s === "0") return "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-700"
	if (s.includes("ceo") || s.includes("final")) return "bg-amber-100 text-amber-700 dark:bg-amber-800/25 dark:text-amber-300"
	if (s.includes("hr") || s.includes("manager")) return "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300"
	if (s === "open" || s === "draft" || s === "submitted") return "bg-blue-100 text-blue-700 dark:bg-blue-800/25 dark:text-blue-300"
	if (s.includes("pending")) return "bg-orange-100 text-orange-700 dark:bg-orange-800/25 dark:text-orange-300"
	return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-700"
}

// ==================== TAB 3: PAYROLL ====================

const payrollStatus = createResource({
	url: `${API_BASE}.monthly_payroll.get_payroll_overview`,
	auto: true,
	cache: "cmd:payroll_overview",
})

// ==================== TAB 4: TEAM INTEL ====================

const staffing = createResource({
	url: `${API_BASE}.ai_intelligence.get_staffing_suggestions`,
	auto: true,
	cache: "cmd:staffing",
})

const staffingAlerts = computed(() => {
	if (!staffing.data?.departments) return []
	return staffing.data.departments
		.filter(d => d.health !== "good")
		.sort((a, b) => (a.health === "critical" ? -1 : 1))
		.slice(0, 5)
})

const teamBurnout = createResource({
	url: `${API_BASE}.ai_intelligence.get_burnout_risk`,
	auto: true,
	cache: "cmd:team_burnout",
	makeParams() { return { team_view: 1 } },
})

const teamWeather = createResource({
	url: `${API_BASE}.ai_intelligence.get_weather_impact`,
	auto: true,
	cache: "cmd:team_weather",
	makeParams() { return { team_view: 1 } },
})

// ==================== MOUNT ====================

onMounted(() => {
	notifications.start = 0
	notifications.pageLength = 10
	notifications.fetch()
})

// Refresh stale data when returning from Approvals (keep-alive)
onActivated(() => {
	docStatuses.value = {}  // Clear cached status badges to force re-fetch
	approvalsData.reload()
	mgrDaData.reload()
	notifications.fetch()
})
</script>
