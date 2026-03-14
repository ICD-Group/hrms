<template>
	<BaseLayout :pageTitle="__('Home')">
		<template #body>
			<div class="flex flex-col mt-1 mb-2 gap-2.5">
				<!-- Hero Header -->
				<div class="home-hero overflow-hidden rounded-xl mx-2 animate-scale-in">
					<div class="home-hero-gradient px-3 py-2 text-white">
						<div class="flex items-center gap-2">
							<!-- Left: Avatar + Name -->
							<div class="flex-shrink-0">
								<img v-if="user.data?.user_image" :src="user.data.user_image" class="w-10 h-10 rounded-xl object-cover ring-2 ring-white/20" />
								<div v-else class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black ring-2 ring-white/20">
									{{ employee?.data?.first_name?.[0] || '?' }}
								</div>
							</div>
							<div class="min-w-0 flex-shrink-0">
								<div class="flex items-center gap-1.5">
									<span class="text-[11px] font-semibold opacity-60">{{ greeting }}</span>
									<div v-if="todayStatus.data?.is_checked_in" class="flex items-center gap-0.5 bg-white/15 px-1.5 py-0.5 rounded-full">
										<span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
										<span class="text-[8px] font-bold text-white/80">Active</span>
									</div>
								</div>
								<div class="text-base font-bold leading-tight">{{ employee?.data?.first_name || __("Welcome") }}</div>
								<div class="text-sm opacity-70">{{ dayjs().format("ddd, DD-MM-YYYY") }}</div>
							</div>
							<!-- SPS center (sales only) -->
							<div class="flex-1 flex justify-center items-center">
								<CircleScore v-if="salesScore.data?.is_sales_user"
									:value="salesScore.data?.current?.score || 0" :maxValue="100"
									label="SPS" :size="68"
									:clickable="true" @click="router.push('/genius/sales-score')" />
							</div>
							<!-- PRD + Streak right -->
							<div class="flex-shrink-0 flex items-center gap-2">
								<CircleScore v-if="productivity.data"
									:value="productivity.data.score || 0" :maxValue="100"
									label="PRD" :size="68"
									:clickable="true" @click="router.push('/genius')" />
								<div v-if="streaks.data?.current_streak && streaks.data.current_streak > 0" class="flex flex-col items-center">
									<span class="text-base leading-none">&#x1F525;</span>
									<span class="text-[11px] font-bold opacity-80">{{ streaks.data.current_streak }}d</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Stats Cards -->
				<div v-if="stats" class="grid grid-cols-3 gap-1.5 px-2 -mt-1">
					<button @click="router.push('/dashboard/attendance')" class="stat-card emp-card-present active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="check-circle" class="card-icon" />
							<span class="card-num">{{ stats.days_present }}</span>
						</div>
						<div class="card-label">Present</div>
					</button>
					<button @click="router.push('/dashboard/attendance')" class="stat-card emp-card-ontime active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="clock" class="card-icon" />
							<span class="card-num">{{ stats.on_time }}</span>
						</div>
						<div class="card-label">On Time</div>
					</button>
					<button @click="router.push('/dashboard/attendance')" class="stat-card emp-card-late active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="alert-triangle" class="card-icon" />
							<span class="card-num">{{ stats.late }}</span>
						</div>
						<div class="card-label">Late</div>
					</button>
					<button @click="router.push('/dashboard/attendance')" class="stat-card emp-card-absent active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="x-circle" class="card-icon" />
							<span class="card-num">{{ stats.days_absent }}</span>
						</div>
						<div class="card-label">Absent</div>
					</button>
					<button @click="router.push('/dashboard/leaves')" class="stat-card emp-card-leave active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="calendar" class="card-icon" />
							<span class="card-num">{{ stats.days_leave }}</span>
						</div>
						<div class="card-label">Leave</div>
					</button>
					<button v-if="salesScore.data?.is_sales_user" @click="router.push('/genius/sales-leaderboard')" class="stat-card emp-card-leaderboard active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="trending-up" class="card-icon" />
							<span class="card-num">&#x1F3C6;</span>
						</div>
						<div class="card-label">Leaders</div>
					</button>
					<button v-else @click="router.push('/genius')" class="stat-card emp-card-points active:scale-95 transition-transform">
						<div class="card-row">
							<FeatherIcon name="star" class="card-icon" />
							<span class="card-num">{{ stats.points }}</span>
						</div>
						<div class="card-label">Points</div>
					</button>
				</div>

				<!-- Today Time Cards -->
				<div v-if="todayStatus.data?.first_check_in" class="grid grid-cols-3 gap-1.5 px-2 -mt-0.5">
					<div class="stat-card time-card-in">
						<div class="card-row">
							<FeatherIcon name="log-in" class="card-icon" />
							<span class="card-time">{{ formatTime(todayStatus.data.first_check_in) }}</span>
						</div>
						<div class="card-label">IN</div>
					</div>
					<div class="stat-card time-card-out">
						<div class="card-row">
							<FeatherIcon name="log-out" class="card-icon" />
							<span class="card-time">{{ todayStatus.data.last_check_out ? formatTime(todayStatus.data.last_check_out) : '--:--' }}</span>
						</div>
						<div class="card-label">OUT</div>
					</div>
					<div class="stat-card time-card-hrs">
						<div class="card-row">
							<FeatherIcon name="activity" class="card-icon" />
							<span class="card-time">{{ formatHours(todayStatus.data.working_hours) }}</span>
						</div>
						<div class="card-label">HRS</div>
					</div>
				</div>

				<div class="px-3"><GeniusCheckIn /></div>

				<!-- Smart Status Bar (always visible, dual state) -->
				<div class="px-3">
					<div class="status-bar rounded-xl overflow-hidden" @click="router.push({ name: 'MyRequestsList' })">
						<!-- Active State: has pending items -->
						<div v-if="alertItems.length > 0" :class="alertHasDA ? 'da-grad' : 'da-grad-amber'" class="px-3.5 py-3 status-transition">
							<div class="flex flex-col items-center gap-1.5">
								<div class="flex items-center gap-2">
									<FeatherIcon :name="alertHasDA ? 'alert-triangle' : 'bell'" class="w-4 h-4 text-white/80" />
									<span class="text-[13px] font-bold text-white">{{ __("Actions Needed") }}</span>
								</div>
								<div class="flex flex-wrap justify-center gap-1">
									<span v-for="item in alertItems" :key="item.label"
										class="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
										:class="item.urgent ? 'bg-white/30 text-white' : 'bg-white/15 text-white/80'">
										{{ item.n }} {{ item.label }}
									</span>
								</div>
							</div>
						</div>
						<!-- Clear State: nothing pending -->
						<div v-else class="da-grad-clear px-3.5 py-2.5 status-transition">
							<div class="flex items-center justify-center gap-2">
								<FeatherIcon name="check-circle" class="w-4 h-4 text-white/80" />
								<span class="text-[12px] font-semibold text-white/90">{{ __("All Clear") }}</span>
								<span class="text-[11px] text-white/40">{{ __("No pending actions") }}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="px-3"><QuickLinks :items="quickLinks" :title="__('Quick Links')" /></div>
				<div v-if="salesScore.data?.is_sales_user" class="px-3"><QuickLinks :items="salesLinks" :title="__('Sales')" /></div>
				<div class="px-3"><QuickLinks :items="hrServiceLinks" :title="__('HR Services')" /></div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject, markRaw, defineAsyncComponent, computed, ref, h } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon } from "frappe-ui"
const router = useRouter()

const GeniusCheckIn = defineAsyncComponent({
	loader: () => import("@/components/GeniusCheckIn.vue"),
	loadingComponent: {
		render() { return h("div", { class: "card-premium w-full py-5 px-4 shimmer", style: "min-height:140px" }) },
	},
	errorComponent: {
		render() { return h("div") },
	},
})
import QuickLinks from "@/components/QuickLinks.vue"
import BaseLayout from "@/components/BaseLayout.vue"
import CircleScore from "@/components/CircleScore.vue"
import AttendanceIcon from "@/components/icons/AttendanceIcon.vue"
import ShiftIcon from "@/components/icons/ShiftIcon.vue"
import LeaveIcon from "@/components/icons/LeaveIcon.vue"
import ExpenseIcon from "@/components/icons/ExpenseIcon.vue"
import EmployeeAdvanceIcon from "@/components/icons/EmployeeAdvanceIcon.vue"
import SalaryIcon from "@/components/icons/SalaryIcon.vue"

// Feather icon wrappers
const TrainingIcon = { render: () => h(FeatherIcon, { name: "book-open" }) }
const AppraisalIcon = { render: () => h(FeatherIcon, { name: "award" }) }
const TravelIcon = { render: () => h(FeatherIcon, { name: "map-pin" }) }
const GrievanceIcon = { render: () => h(FeatherIcon, { name: "alert-circle" }) }
const TaxIcon = { render: () => h(FeatherIcon, { name: "file-text" }) }
const BenefitsIcon = { render: () => h(FeatherIcon, { name: "gift" }) }
const LoanIcon = { render: () => h(FeatherIcon, { name: "credit-card" }) }
const MealIcon = { render: () => h(FeatherIcon, { name: "coffee" }) }
const WorkRequestIcon = { render: () => h(FeatherIcon, { name: "briefcase" }) }
const CorrectionIcon = { render: () => h(FeatherIcon, { name: "edit-3" }) }
const PermissionIcon = { render: () => h(FeatherIcon, { name: "shield" }) }
const DocumentCenterIcon = { render: () => h(FeatherIcon, { name: "archive" }) }
const SalesScoreIcon = { render: () => h(FeatherIcon, { name: "trending-up" }) }
const LeaderboardIcon = { render: () => h(FeatherIcon, { name: "bar-chart-2" }) }

const __ = inject("$translate")
const employee = inject("$employee")
const user = inject("$user")
const dayjs = inject("$dayjs")

// Greeting logic
const greeting = computed(() => {
	const hour = dayjs().hour()
	if (hour < 12) return __("Good Morning")
	if (hour < 17) return __("Good Afternoon")
	return __("Good Evening")
})

// Productivity
const productivity = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.productivity.get_employee_productivity",
	auto: true,
	cache: "genius:productivity",
})

// Sales Performance Score (only loads for Sales Users)
const salesScore = createResource({
	url: "icd3s_follow_up.sales_performance_score.get_my_score",
	auto: true,
	cache: "genius:sales_score",
})

// Today check-in status (for IN/OUT/HRS cards + Active badge)
const todayStatus = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.checkin.get_today_status",
	auto: true,
	cache: "genius:today_status",
	makeParams() {
		return { employee: employee.data?.name }
	},
})

const attendanceStats = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_points",
	auto: true,
	cache: "genius:points",
	makeParams() {
		return { employee: employee.data?.name }
	},
})

const streaks = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_attendance_streaks",
	auto: true,
	cache: "genius:streaks",
	makeParams() {
		return { employee: employee.data?.name }
	},
})

// Disciplinary Alert (employee's OWN actions only - all statuses)
const daResource = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.get_disciplinary_summary",
	auto: true,
	cache: "genius:da_summary_v2",
})
const daSummary = computed(() => daResource.data || {})
const alertHasDA = computed(() => (daSummary.value.emp_total_action || 0) > 0)
const alertItems = computed(() => {
	const items = []
	const s = daSummary.value
	// Disciplinary (urgent first)
	if (s.emp_pending_defense > 0) items.push({ n: s.emp_pending_defense, label: __("Defense Required"), urgent: true })
	if (s.emp_can_appeal > 0) items.push({ n: s.emp_can_appeal, label: __("Can Appeal"), urgent: true })
	if (s.emp_under_investigation > 0) items.push({ n: s.emp_under_investigation, label: __("Investigation") })
	if (s.emp_pending_hr > 0) items.push({ n: s.emp_pending_hr, label: __("HR Review") })
	if (s.emp_pending_ceo > 0) items.push({ n: s.emp_pending_ceo, label: __("CEO Review") })
	if (s.emp_approved > 0 && !s.emp_can_appeal) items.push({ n: s.emp_approved, label: __("Approved") })
	if (s.emp_appealed > 0) items.push({ n: s.emp_appealed, label: __("Appeal Sent") })
	// Pending requests (from my_dashboard)
	for (const c of (myDashboard.data?.cards || [])) {
		if (c.pending > 0) items.push({ n: c.pending, label: __(c.label) })
	}
	return items
})

// My Requests Dashboard
const myDashboard = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.get_my_dashboard",
	auto: true,
	cache: "genius:my_dashboard",
})
// Map API response to dashboard-friendly format
const stats = computed(() => {
	const raw = attendanceStats.data
	if (!raw) return null
	const cm = raw.current_month || {}
	const onTime = (cm.on_time_days || 0) + (cm.early_days || 0)
	const late = cm.late_days || 0
	const present = onTime + late
	const absent = cm.absent_days || 0
	const points = cm.total_points || raw.summary?.total_points || 0
	const workingDays = present + absent
	return {
		days_present: present,
		on_time: onTime,
		late: late,
		days_absent: absent,
		days_leave: 0,
		points: points,
		working_days: workingDays || 1,
	}
})

const attendancePercent = computed(() => {
	if (!stats.value) return 0
	const { days_present, working_days } = stats.value
	if (!working_days || working_days === 0) return 0
	return Math.round((days_present / working_days) * 100)
})

function formatTime(timestamp) {
	if (!timestamp) return "--:--"
	return dayjs(timestamp).format("hh:mm A")
}

function formatHours(hours) {
	if (!hours) return "0h 0m"
	const h = Math.floor(hours)
	const m = Math.round((hours - h) * 60)
	return `${h}h ${m}m`
}

const quickLinks = [
	{ icon: markRaw(AttendanceIcon), title: __("Request Attendance"), route: "AttendanceRequestFormView", bg: "bg-emerald-50", fg: "text-emerald-600" },
	{ icon: markRaw(ShiftIcon), title: __("Request a Shift"), route: "ShiftRequestFormView", bg: "bg-sky-50", fg: "text-sky-600" },
	{ icon: markRaw(LeaveIcon), title: __("Request Leave"), route: "LeaveApplicationFormView", bg: "bg-purple-50", fg: "text-purple-600" },
	{ icon: markRaw(ExpenseIcon), title: __("Claim an Expense"), route: "ExpenseClaimFormView", bg: "bg-amber-50", fg: "text-amber-600" },
	{ icon: markRaw(EmployeeAdvanceIcon), title: __("Request an Advance"), route: "EmployeeAdvanceFormView", bg: "bg-blue-50", fg: "text-blue-600" },
	{ icon: markRaw(SalaryIcon), title: __("View Salary Slips"), route: "SalarySlipsDashboard", bg: "bg-green-50", fg: "text-green-600" },
	{ icon: markRaw(MealIcon), title: __("Claim Meal"), route: "MealClaimFormView", bg: "bg-orange-50", fg: "text-orange-600" },
	{ icon: markRaw(WorkRequestIcon), title: __("WFH / Mission"), route: "GeniusWorkRequest", bg: "bg-indigo-50", fg: "text-indigo-600" },
	{ icon: markRaw(CorrectionIcon), title: __("Fix Attendance"), route: "GeniusAttendanceCorrection", bg: "bg-rose-50", fg: "text-rose-600" },
	{ icon: markRaw(PermissionIcon), title: __("Request Permission"), route: "GeniusPermission", bg: "bg-teal-50", fg: "text-teal-600" },
]

const salesLinks = [
	{ icon: markRaw(SalesScoreIcon), title: __("My Sales Score"), route: "GeniusSalesScore", bg: "bg-emerald-50", fg: "text-emerald-600" },
	{ icon: markRaw(LeaderboardIcon), title: __("Sales Leaderboard"), route: "GeniusSalesLeaderboard", bg: "bg-amber-50", fg: "text-amber-600" },
]

const hrServiceLinks = [
	{ icon: markRaw(DocumentCenterIcon), title: __("Document Center"), route: "DocumentCenterHub", bg: "bg-blue-50", fg: "text-blue-600" },
	{ icon: markRaw(TrainingIcon), title: __("Training Events"), route: "TrainingEventListView", bg: "bg-indigo-50", fg: "text-indigo-600" },
	{ icon: markRaw(AppraisalIcon), title: __("Appraisals"), route: "AppraisalListView", bg: "bg-amber-50", fg: "text-amber-600" },
	{ icon: markRaw(TravelIcon), title: __("Travel Requests"), route: "TravelRequestListView", bg: "bg-sky-50", fg: "text-sky-600" },
	{ icon: markRaw(GrievanceIcon), title: __("Grievances"), route: "GrievanceListView", bg: "bg-rose-50", fg: "text-rose-600" },
	{ icon: markRaw(TaxIcon), title: __("Tax Declarations"), route: "TaxDeclarationListView", bg: "bg-green-50", fg: "text-green-600" },
	{ icon: markRaw(BenefitsIcon), title: __("Benefits"), route: "BenefitApplicationListView", bg: "bg-purple-50", fg: "text-purple-600" },
	{ icon: markRaw(LoanIcon), title: __("Loan Applications"), route: "LoanApplicationListView", bg: "bg-teal-50", fg: "text-teal-600" },
]
</script>

<style scoped>
.home-hero {
	border-radius: 0.75rem;
	box-shadow: 0 4px 20px -2px rgba(59, 7, 100, 0.3), 0 1px 4px rgba(0, 0, 0, 0.06);
}
.home-hero-gradient {
	background: linear-gradient(135deg, #3b0764 0%, #5b21b6 40%, #7c3aed 70%, #a78bfa 100%);
}
/* Stat cards: glass, compact */
.stat-card {
	border-radius: 0.75rem;
	padding: 0.35rem 0.5rem;
	border: 1px solid rgba(255,255,255,0.3);
	box-shadow: 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2);
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
	-webkit-tap-highlight-color: transparent;
}
.card-row {
	display: flex;
	align-items: center;
	width: 100%;
	position: relative;
	min-height: 26px;
}
.card-icon {
	width: 18px;
	height: 18px;
	color: white;
	flex-shrink: 0;
	position: absolute;
	left: 0;
}
.card-num {
	font-size: 24px;
	font-weight: 900;
	color: white;
	line-height: 1;
	width: 100%;
	text-align: center;
}
.card-time {
	font-size: 12px;
	font-weight: 800;
	color: white;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	width: 100%;
	text-align: center;
}
.card-label {
	font-size: 11px;
	font-weight: 700;
	color: white;
	text-align: center;
	width: 100%;
}
/* Glassy stat cards */
.emp-card-present { background: linear-gradient(135deg, rgba(16,185,129,0.7) 0%, rgba(5,150,105,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-ontime { background: linear-gradient(135deg, rgba(20,184,166,0.7) 0%, rgba(13,148,136,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-late { background: linear-gradient(135deg, rgba(245,158,11,0.7) 0%, rgba(217,119,6,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-absent { background: linear-gradient(135deg, rgba(244,63,94,0.7) 0%, rgba(225,29,72,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-leave { background: linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(79,70,229,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-points { background: linear-gradient(135deg, rgba(139,92,246,0.7) 0%, rgba(124,58,237,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.emp-card-leaderboard { background: linear-gradient(135deg, rgba(245,158,11,0.75) 0%, rgba(217,119,6,0.6) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
/* Glassy time cards */
.time-card-in { background: linear-gradient(135deg, rgba(5,150,105,0.7) 0%, rgba(4,120,87,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.time-card-out { background: linear-gradient(135deg, rgba(220,38,38,0.7) 0%, rgba(185,28,28,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.time-card-hrs { background: linear-gradient(135deg, rgba(37,99,235,0.7) 0%, rgba(29,78,216,0.55) 100%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
/* Smart status bar - always visible, dual state */
.status-bar {
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	transition: box-shadow 0.3s ease;
}
.status-bar:active { transform: scale(0.98); }
.status-transition { transition: all 0.3s ease; }
/* Active states */
.da-grad {
	background: linear-gradient(135deg, #991b1b 0%, #dc2626 40%, #ef4444 70%, #f87171 100%);
	box-shadow: 0 4px 20px -2px rgba(220, 38, 38, 0.3), 0 1px 4px rgba(0, 0, 0, 0.06);
}
.da-grad-amber {
	background: linear-gradient(135deg, #92400e 0%, #d97706 40%, #f59e0b 70%, #fbbf24 100%);
	box-shadow: 0 4px 20px -2px rgba(217, 119, 6, 0.3), 0 1px 4px rgba(0, 0, 0, 0.06);
}
/* Clear state - calm green */
.da-grad-clear {
	background: linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%);
	box-shadow: 0 2px 12px -2px rgba(5, 150, 105, 0.2), 0 1px 3px rgba(0, 0, 0, 0.04);
}
</style>
