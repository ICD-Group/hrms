<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="show" class="fixed inset-0 z-50 flex items-end justify-center" @click.self="$emit('close')">
				<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')"></div>
				<div class="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
					<!-- Handle -->
					<div class="flex justify-center pt-2 pb-1">
						<div class="w-10 h-1 bg-gray-300 rounded-full"></div>
					</div>

					<!-- Header -->
					<div class="px-4 pb-3 border-b border-gray-100">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-full bg-icd-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
								<img v-if="empData.image" :src="empData.image" class="w-full h-full object-cover" />
								<span v-else class="text-lg font-extrabold text-icd-600">{{ initials }}</span>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-bold text-gray-900 truncate">{{ empData.employee_name }}</div>
								<div class="text-[11px] text-gray-500 truncate">{{ cleanDept(empData.department) }}</div>
								<div v-if="empData.designation" class="text-[10px] text-gray-400 truncate">{{ empData.designation }}</div>
							</div>
							<button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
								<FeatherIcon name="x" class="w-4 h-4 text-gray-600" />
							</button>
						</div>
					</div>

					<!-- Body -->
					<div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
						<!-- Score (if available) -->
						<div v-if="empData.score !== undefined" class="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-icd-50 to-purple-50">
							<div class="w-14 h-14 rounded-full flex items-center justify-center"
								:class="scoreGradeBg(empData.score)">
								<span class="text-lg font-extrabold" :class="scoreGradeText(empData.score)">{{ scoreGrade(empData.score) }}</span>
							</div>
							<div>
								<div class="text-xl font-extrabold text-gray-900">{{ empData.score || 0 }}<span class="text-sm text-gray-500">/100</span></div>
								<div class="text-[11px] text-gray-500">Performance Score</div>
							</div>
							<div class="ml-auto">
								<div class="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
									<div class="h-full rounded-full transition-all duration-700" :class="scoreBarClass(empData.score)"
										:style="{ width: Math.min(empData.score || 0, 100) + '%' }"></div>
								</div>
							</div>
						</div>

						<!-- Attendance Metrics -->
						<div v-if="hasAttendanceData">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Attendance</div>
							<div class="grid grid-cols-4 gap-2">
								<MetricCard label="Present" :value="empData.present_days" color="emerald" />
								<MetricCard label="Absent" :value="empData.absent_days" color="red" />
								<MetricCard label="Late" :value="empData.late_days" color="amber" />
								<MetricCard label="Avg Hours" :value="empData.avg_hours" suffix="h" color="blue" />
							</div>
						</div>

						<!-- Rates -->
						<div v-if="empData.attendance_rate !== undefined">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Rates</div>
							<div class="grid grid-cols-3 gap-2">
								<MetricCard label="Attendance" :value="empData.attendance_rate" suffix="%" color="emerald" />
								<MetricCard label="Punctuality" :value="empData.punctuality_rate" suffix="%" color="blue" />
								<MetricCard v-if="empData.hours_factor !== undefined" label="Hours" :value="empData.hours_factor" suffix="%" color="purple" />
							</div>
						</div>

						<!-- Penalty Info -->
						<div v-if="empData.penalty_type || empData.deduction_days">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Penalty Details</div>
							<div class="card-premium p-2.5 space-y-1.5">
								<div v-if="empData.penalty_type" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Type</span>
									<span class="font-bold text-gray-900">{{ empData.penalty_type }}</span>
								</div>
								<div v-if="empData.penalty_level" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Level</span>
									<span class="font-bold" :class="levelColor(empData.penalty_level)">{{ empData.penalty_level }}</span>
								</div>
								<div v-if="empData.late_minutes" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Late Minutes</span>
									<span class="font-bold text-amber-700">{{ empData.late_minutes }}m</span>
								</div>
								<div v-if="empData.deduction_days" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Deduction Days</span>
									<span class="font-bold text-red-700">{{ empData.deduction_days }}d</span>
								</div>
								<div v-if="empData.shift_start_time" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Shift Start</span>
									<span class="font-bold text-gray-900">{{ empData.shift_start_time }}</span>
								</div>
								<div v-if="empData.actual_check_in" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Actual Check-in</span>
									<span class="font-bold text-gray-900">{{ empData.actual_check_in }}</span>
								</div>
								<div v-if="empData.excuse_status" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Excuse</span>
									<span class="font-bold" :class="excuseColor(empData.excuse_status)">{{ empData.excuse_status }}</span>
								</div>
								<div v-if="empData.excuse_reason" class="text-[10px] text-gray-500 mt-1 pt-1 border-t border-gray-100">
									{{ empData.excuse_reason }}
								</div>
							</div>
						</div>

						<!-- Leave Info -->
						<div v-if="empData.leave_type">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Leave Details</div>
							<div class="card-premium p-2.5 space-y-1.5">
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Type</span>
									<span class="font-bold text-purple-700">{{ empData.leave_type }}</span>
								</div>
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Period</span>
									<span class="font-bold text-gray-900">{{ empData.from_date }} — {{ empData.to_date }}</span>
								</div>
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Days</span>
									<span class="font-bold text-purple-700">{{ empData.total_leave_days }}</span>
								</div>
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Status</span>
									<span class="font-bold" :class="leaveStatusColor(empData.status)">{{ empData.status }}</span>
								</div>
								<div v-if="empData.leave_approver_name" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Approver</span>
									<span class="font-bold text-gray-900">{{ empData.leave_approver_name }}</span>
								</div>
							</div>
						</div>

						<!-- Earnings Info -->
						<div v-if="empData.gross_earnings !== undefined">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Earnings Breakdown</div>
							<div class="card-premium p-2.5 space-y-1.5">
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Gross Earnings</span>
									<span class="font-bold text-green-700">{{ fmt(empData.gross_earnings) }}</span>
								</div>
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Total Deductions</span>
									<span class="font-bold text-red-700">-{{ fmt(empData.total_deductions) }}</span>
								</div>
								<div class="flex justify-between text-[11px] pt-1 border-t border-gray-100">
									<span class="font-bold text-gray-700">Net Pay</span>
									<span class="font-extrabold text-icd-700">{{ fmt(empData.net_salary) }}</span>
								</div>
								<div v-if="empData.total_overtime_hours" class="flex justify-between text-[11px]">
									<span class="text-gray-600">OT Hours</span>
									<span class="font-bold text-blue-700">{{ empData.total_overtime_hours }}h</span>
								</div>
								<div v-if="empData.overtime_amount" class="flex justify-between text-[11px]">
									<span class="text-gray-600">OT Amount</span>
									<span class="font-bold text-blue-700">{{ fmt(empData.overtime_amount) }}</span>
								</div>
								<div v-if="empData.penalty_deduction_days" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Penalty Days</span>
									<span class="font-bold text-amber-700">{{ empData.penalty_deduction_days }}d</span>
								</div>
								<div v-if="empData.sales_partner_commission" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Commission</span>
									<span class="font-bold text-green-700">{{ fmt(empData.sales_partner_commission) }}</span>
								</div>
							</div>
						</div>

						<!-- WFH Info -->
						<div v-if="empData.is_wfh !== undefined">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Work Mode</div>
							<div class="card-premium p-2.5 space-y-1.5">
								<div class="flex justify-between text-[11px]">
									<span class="text-gray-600">Mode</span>
									<span class="font-bold" :class="empData.is_wfh ? 'text-indigo-700' : 'text-gray-700'">
										{{ empData.is_wfh ? 'Work From Home' : 'Office' }}
									</span>
								</div>
								<div v-if="empData.wfh_office_days" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Required Office Days/Week</span>
									<span class="font-bold text-gray-900">{{ empData.wfh_office_days }}</span>
								</div>
								<div v-if="empData.office_days_actual !== undefined" class="flex justify-between text-[11px]">
									<span class="text-gray-600">Actual Office Days (Month)</span>
									<span class="font-bold" :class="empData.office_days_actual >= empData.wfh_office_days ? 'text-green-700' : 'text-red-700'">
										{{ empData.office_days_actual }}
									</span>
								</div>
							</div>
						</div>

						<!-- Leaderboard Info -->
						<div v-if="empData.total_points !== undefined">
							<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Points & Streaks</div>
							<div class="grid grid-cols-3 gap-2">
								<MetricCard label="Points" :value="empData.total_points" color="icd" />
								<MetricCard label="Streak" :value="empData.current_streak" color="orange" />
								<MetricCard label="Best" :value="empData.longest_streak" color="gray" />
							</div>
							<div class="grid grid-cols-4 gap-2 mt-2">
								<MetricCard label="On-Time" :value="empData.on_time_days" suffix="d" color="emerald" />
								<MetricCard label="Early" :value="empData.early_days" suffix="d" color="blue" />
								<MetricCard label="Late" :value="empData.late_days" suffix="d" color="amber" />
								<MetricCard label="Absent" :value="empData.absent_days" suffix="d" color="red" />
							</div>
						</div>

						<div class="h-4"></div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { computed, inject } from "vue"
import { FeatherIcon } from "frappe-ui"

const __ = inject("$translate")

const props = defineProps({
	show: { type: Boolean, default: false },
	data: { type: Object, default: () => ({}) },
})

defineEmits(["close"])

const empData = computed(() => props.data || {})

const initials = computed(() => {
	const name = empData.value.employee_name || ""
	return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
})

const hasAttendanceData = computed(() =>
	empData.value.present_days !== undefined || empData.value.absent_days !== undefined
)

function cleanDept(d) { return (d || "").replace(/ - I$/, "") }
function fmt(v) { return (parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

function scoreGrade(s) { return s >= 90 ? "A+" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D" }
function scoreGradeBg(s) { return s >= 80 ? "bg-emerald-100" : s >= 60 ? "bg-amber-100" : "bg-red-100" }
function scoreGradeText(s) { return s >= 80 ? "text-emerald-700" : s >= 60 ? "text-amber-700" : "text-red-700" }
function scoreBarClass(s) { return s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-red-500" }

function levelColor(l) {
	return { Warning: "text-yellow-600", Minor: "text-orange-600", Major: "text-red-600", Accumulated: "text-purple-600" }[l] || "text-gray-600"
}
function excuseColor(s) {
	return { Approved: "text-green-700", Pending: "text-amber-700", Rejected: "text-red-700" }[s] || "text-gray-600"
}
function leaveStatusColor(s) {
	return { Approved: "text-green-700", Open: "text-amber-700", Rejected: "text-red-700" }[s] || "text-gray-600"
}

const colorMap = {
	emerald: "bg-emerald-50 text-emerald-700",
	red: "bg-red-50 text-red-700",
	amber: "bg-amber-50 text-amber-700",
	blue: "bg-blue-50 text-blue-700",
	purple: "bg-purple-50 text-purple-700",
	orange: "bg-orange-50 text-orange-700",
	icd: "bg-purple-50 text-purple-700",
	gray: "bg-gray-50 text-gray-700",
	green: "bg-green-50 text-green-700",
	indigo: "bg-indigo-50 text-indigo-700",
}

const MetricCard = {
	props: ["label", "value", "suffix", "color"],
	setup(props) {
		const classes = computed(() => {
			const pair = colorMap[props.color] || colorMap.gray
			const [bg, text] = pair.split(" ")
			return { card: bg, text }
		})
		return { classes }
	},
	template: `<div class="text-center p-1.5 rounded-lg" :class="classes.card">
		<div class="text-[11px] font-extrabold" :class="classes.text">{{ value ?? '-' }}{{ suffix || '' }}</div>
		<div class="text-[8px] text-gray-500 mt-0.5">{{ label }}</div>
	</div>`
}
</script>

<style scoped>
.animate-slide-up {
	animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
