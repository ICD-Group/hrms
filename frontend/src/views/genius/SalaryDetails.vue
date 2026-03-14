<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Salary Details") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="salary-bg min-h-full">
			<div class="flex flex-col mt-1 mb-7 p-4 gap-3">

				<!-- Month Selector -->
				<div class="flex items-center justify-between card-premium p-3">
					<button @click="prevMonth" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-left" class="w-5 text-gray-600" />
					</button>
					<div class="text-sm font-bold text-gray-800">
						{{ monthNames[month - 1] }} {{ year }}
					</div>
					<button @click="nextMonth" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-right" class="w-5 text-gray-600" />
					</button>
				</div>

				<!-- Payroll Status -->
				<div v-if="payrollStatus.data && payrollStatus.data.stage > 0" class="card-premium p-3.5">
					<div class="flex items-center justify-between mb-2.5">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-full flex items-center justify-center"
								:class="statusIconBgClass">
								<FeatherIcon :name="statusIconName" class="w-3.5 h-3.5" :class="statusIconFgClass" />
							</div>
							<div>
								<div class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ monthNames[month - 1] }} {{ __('Payroll') }}</div>
								<div class="text-sm font-black text-gray-900 dark:text-white">{{ payrollStatus.data.stage_label }}</div>
							</div>
						</div>
						<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
							{{ payrollStatus.data.stage }}/4
						</span>
					</div>
					<div class="flex items-center gap-1">
						<template v-for="(step, i) in payrollStatus.data.steps" :key="i">
							<div class="flex-1 h-1.5 rounded-full" :class="step.completed ? statusBarColorClass : 'bg-gray-200 dark:bg-white/10'"></div>
						</template>
					</div>
				</div>

				<!-- Net Pay Card (from Salary Slip) -->
				<div v-if="slipData?.exists" class="card-premium p-4">
					<div class="flex items-center justify-between mb-3">
						<div class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ __("Net Pay") }}</div>
						<div class="flex items-center gap-1.5">
							<div class="w-2 h-2 rounded-full bg-green-500"></div>
							<span class="text-[11px] font-bold text-green-600">{{ __("Salary Slip") }}</span>
						</div>
					</div>
					<div class="text-3xl font-black text-gray-900 dark:text-white mb-3">{{ fmt(slipData.net_pay) }} <span class="text-sm font-bold text-gray-400">EGP</span></div>
					<div class="grid grid-cols-3 gap-2">
						<div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
							<div class="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase">{{ __("Gross") }}</div>
							<div class="text-sm font-black text-green-600">{{ fmt(slipData.gross_pay) }}</div>
						</div>
						<div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
							<div class="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase">{{ __("Deductions") }}</div>
							<div class="text-sm font-black text-red-600">{{ fmt(slipData.total_deduction) }}</div>
						</div>
						<div class="bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-center">
							<div class="text-[11px] font-bold text-gray-500 uppercase">{{ __("Pay Days") }}</div>
							<div class="text-sm font-black text-gray-700 dark:text-gray-300">{{ slipData.payment_days }}/{{ slipData.total_working_days }}</div>
						</div>
					</div>
				</div>

				<!-- Summary Strip (fallback when no Salary Slip) -->
				<div v-else-if="salaryBreakdown.data" class="card-premium p-4">
					<div class="grid grid-cols-3 divide-x divide-gray-100 text-center">
						<div class="px-1">
							<div class="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{{ __("Earnings") }}</div>
							<div class="text-lg font-black text-green-600 mt-0.5">{{ fmt(salaryBreakdown.data.total_earnings) }}</div>
						</div>
						<div class="px-1">
							<div class="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{{ __("Deductions") }}</div>
							<div class="text-lg font-black text-red-600 mt-0.5">{{ fmt(salaryBreakdown.data.total_deductions) }}</div>
						</div>
						<div class="px-1">
							<div class="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{{ __("Net") }}</div>
							<div class="text-lg font-black text-icd-700 mt-0.5">{{ fmt(salaryBreakdown.data.net) }}</div>
						</div>
					</div>
				</div>

				<!-- Salary Structure - Earnings -->
				<div v-if="slipData?.earnings?.length > 0">
					<div class="section-title mb-2">{{ __("Earnings") }}</div>
					<div class="card-premium overflow-hidden">
						<div class="divide-y divide-gray-50 dark:divide-white/5">
							<div v-for="(item, i) in slipData.earnings" :key="i"
								class="flex items-center justify-between px-4 py-3">
								<div class="flex items-center gap-2.5 min-w-0">
									<div class="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
										<span class="text-[10px] font-black text-green-600">{{ item.abbr }}</span>
									</div>
									<span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.component }}</span>
								</div>
								<span class="text-sm font-bold text-green-600 flex-shrink-0 ml-2">{{ fmt(item.amount) }}</span>
							</div>
						</div>
						<div class="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800/30">
							<span class="text-sm font-bold text-green-800 dark:text-green-300">{{ __("Gross Pay") }}</span>
							<span class="text-sm font-black text-green-700 dark:text-green-400">{{ fmt(slipData.gross_pay) }}</span>
						</div>
					</div>
				</div>

				<!-- Salary Structure - Deductions -->
				<div v-if="slipData?.deductions?.length > 0">
					<div class="section-title mb-2">{{ __("Deductions") }}</div>
					<div class="card-premium overflow-hidden">
						<div class="divide-y divide-gray-50 dark:divide-white/5">
							<div v-for="(item, i) in slipData.deductions" :key="i"
								class="flex items-center justify-between px-4 py-3">
								<div class="flex items-center gap-2.5 min-w-0">
									<div class="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
										<span class="text-[10px] font-black text-red-600">{{ item.abbr }}</span>
									</div>
									<span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.component }}</span>
								</div>
								<span class="text-sm font-bold text-red-600 flex-shrink-0 ml-2">{{ fmt(item.amount) }}</span>
							</div>
						</div>
						<div class="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800/30">
							<span class="text-sm font-bold text-red-800 dark:text-red-300">{{ __("Total Deductions") }}</span>
							<span class="text-sm font-black text-red-700 dark:text-red-400">{{ fmt(slipData.total_deduction) }}</span>
						</div>
					</div>
				</div>

				<!-- Salary Slips Link -->
				<button @click="$router.push({ name: 'SalarySlipsDashboard' })"
					class="card-premium p-3 flex items-center gap-2 active:scale-[0.98] transition-transform">
					<div class="w-8 h-8 rounded-lg bg-icd-50 flex items-center justify-center flex-shrink-0">
						<FeatherIcon name="file-text" class="w-4 h-4 text-icd-600" />
					</div>
					<div class="text-left min-w-0">
						<div class="text-xs font-bold text-gray-800">{{ __('Salary Slips') }}</div>
						<div class="text-xs text-gray-600">{{ __('History & PDF') }}</div>
					</div>
					<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 ml-auto flex-shrink-0" />
				</button>

				<!-- Overtime -->
				<div>
					<div class="section-title mb-2">{{ __("Overtime") }}</div>
					<div v-if="overtime.data" class="card-premium overflow-hidden">
						<div class="grid grid-cols-3 divide-x divide-gray-100 p-3 border-b border-gray-100">
							<div class="text-center">
								<div class="text-lg font-black text-green-600">{{ overtime.data.summary.total_overtime_hours }}</div>
								<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Total") }}</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-black text-amber-600">{{ overtime.data.summary.total_day_hours }}</div>
								<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Day") }}</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-black text-icd-600">{{ overtime.data.summary.total_night_hours }}</div>
								<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Night") }}</div>
							</div>
						</div>
						<div v-if="overtime.data.entries.length > 0" class="divide-y divide-gray-50">
							<div v-for="e in overtime.data.entries" :key="e.name"
								@click="openDetail(e, 'Overtime')"
								class="p-3 flex items-center gap-3 cursor-pointer active:bg-gray-100 transition-colors">
								<div class="text-xs text-gray-600 w-12 text-center font-medium">{{ formatDay(e.attendance_date) }}</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-800">{{ e.total_overtime_hours }}h {{ e.overtime_type }}</div>
									<div class="text-xs text-gray-600">{{ fmtTimeRange(e.actual_check_in, e.actual_check_out) }}</div>
								</div>
								<div v-if="e.is_holiday" class="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-bold">
									{{ __("Holiday") }}
								</div>
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
							</div>
						</div>
						<div v-else class="p-4 text-center text-sm text-gray-600">
							{{ __("No overtime this month") }}
						</div>
					</div>
				</div>

				<!-- Penalties -->
				<div>
					<div class="section-title mb-2">{{ __("Penalties") }}</div>
					<div v-if="penalties.data" class="card-premium overflow-hidden">
						<div class="flex items-center justify-between p-3 border-b border-gray-100">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full flex items-center justify-center"
									:class="penaltySummary.data?.warning_level === 'danger' ? 'bg-red-100' : penaltySummary.data?.warning_level === 'warning' ? 'bg-amber-100' : 'bg-green-100'">
									<FeatherIcon name="alert-triangle" class="w-4"
										:class="penaltySummary.data?.warning_level === 'danger' ? 'text-red-600' : penaltySummary.data?.warning_level === 'warning' ? 'text-amber-600' : 'text-green-600'" />
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-800">
										{{ penalties.data.summary.total_penalties }} {{ __("penalties") }}
									</div>
									<div class="text-xs text-gray-600">
										{{ penalties.data.summary.total_deduction_days }} {{ __("deduction days") }}
										<span v-if="penalties.data.summary.pending_excuses" class="text-orange-600 font-medium">
											· {{ penalties.data.summary.pending_excuses }} {{ __("pending") }}
										</span>
										<span v-if="penalties.data.summary.approved_excuses" class="text-green-600 font-medium">
											· {{ penalties.data.summary.approved_excuses }} {{ __("waived") }}
										</span>
									</div>
								</div>
							</div>
							<div class="flex gap-1">
								<span v-if="penalties.data.summary.warnings" class="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[11px] font-bold">
									{{ penalties.data.summary.warnings }}W
								</span>
								<span v-if="penalties.data.summary.minor" class="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[11px] font-bold">
									{{ penalties.data.summary.minor }}m
								</span>
								<span v-if="penalties.data.summary.major" class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[11px] font-bold">
									{{ penalties.data.summary.major }}M
								</span>
							</div>
						</div>
						<div v-if="penalties.data.penalties.length > 0" class="divide-y divide-gray-50">
							<div v-for="p in penalties.data.penalties" :key="p.name"
								@click="openDetail(p, 'Late Penalty')"
								class="p-3 cursor-pointer active:bg-gray-100 transition-colors">
								<div class="flex items-center gap-3">
									<div class="text-xs text-gray-600 w-12 text-center font-medium">{{ formatDay(p.attendance_date) }}</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-gray-800">{{ p.penalty_type }}</div>
										<div class="text-xs text-gray-600">
											<span v-if="p.late_minutes">{{ p.late_minutes }}{{ __("min late") }}</span>
											<span v-if="p.early_minutes">{{ p.early_minutes }}{{ __("min early") }}</span>
											<span class="ml-1" :class="p.excuse_status === 'Approved' ? 'line-through text-gray-700' : ''">
												{{ p.deduction_days }}d
											</span>
										</div>
									</div>
									<div class="flex items-center gap-1">
										<span v-if="p.excuse_status === 'Pending'" class="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[11px] font-bold border border-orange-200">
											{{ __("Pending") }}
										</span>
										<span v-else-if="p.excuse_status === 'Approved'" class="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[11px] font-bold border border-green-200">
											{{ __("Waived") }}
										</span>
										<span v-else-if="p.excuse_status === 'Rejected'" class="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[11px] font-bold border border-red-200">
											{{ __("Rejected") }}
										</span>
										<span class="px-1.5 py-0.5 rounded-full text-[11px] font-bold" :class="getLevelColor(p.penalty_level)">
											{{ p.penalty_level }}
										</span>
									</div>
									<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
								</div>
								<!-- Excuse info -->
								<div v-if="p.excuse_status === 'Approved'" class="mt-1.5 ml-12 text-xs text-green-600 flex items-center gap-1">
									<FeatherIcon name="check-circle" class="w-3" />
									{{ __("Deduction waived") }}
								</div>
								<div v-else-if="p.excuse_status === 'Rejected'" class="mt-1.5 ml-12 text-xs text-red-500">
									<span v-if="p.excuse_rejection_reason">{{ p.excuse_rejection_reason }}</span>
									<span v-else>{{ __("Excuse was rejected") }}</span>
								</div>
								<div v-else-if="p.excuse_status === 'Pending'" class="mt-1.5 ml-12 text-xs text-orange-500 flex items-center gap-1">
									<FeatherIcon name="clock" class="w-3" />
									{{ __("Awaiting manager review") }}
								</div>
								<div v-else-if="!p.excuse_status && p.deduction_days > 0" class="mt-1.5 ml-12">
									<button @click.stop="showExcuseModal(p)"
										class="text-xs text-icd-600 font-semibold flex items-center gap-1 active:opacity-70">
										<FeatherIcon name="message-circle" class="w-3" />
										{{ __("Submit Excuse") }}
									</button>
								</div>
							</div>
						</div>
						<div v-else class="p-4 text-center text-sm text-gray-600">
							{{ __("No penalties this month") }}
						</div>
					</div>
				</div>

				<!-- Commissions -->
				<div>
					<div class="section-title mb-2">{{ __("Commissions") }}</div>
					<div v-if="commissions.data" class="card-premium overflow-hidden">
						<div class="flex items-center justify-between p-3 border-b border-gray-100">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
									<FeatherIcon name="dollar-sign" class="w-4 text-blue-600" />
								</div>
								<div class="text-sm font-semibold text-gray-800">{{ __("Total Commission") }}</div>
							</div>
							<div class="text-lg font-black text-blue-600">{{ fmt(commissions.data.summary.grand_total) }}</div>
						</div>
						<div v-if="commissions.data.summary.grand_total > 0" class="grid grid-cols-3 divide-x divide-gray-50 px-3 py-2 border-b border-gray-50 bg-gray-100/50">
							<div v-if="commissions.data.summary.sales_partner_total" class="text-center px-1">
								<div class="text-xs font-black text-gray-700">{{ fmt(commissions.data.summary.sales_partner_total) }}</div>
								<div class="text-[11px] text-gray-600">{{ __("Partner") }}</div>
							</div>
							<div v-if="commissions.data.summary.ceo_override_total" class="text-center px-1">
								<div class="text-xs font-black text-gray-700">{{ fmt(commissions.data.summary.ceo_override_total) }}</div>
								<div class="text-[11px] text-gray-600">{{ __("Override") }}</div>
							</div>
							<div v-if="commissions.data.summary.office_pool_total" class="text-center px-1">
								<div class="text-xs font-black text-gray-700">{{ fmt(commissions.data.summary.office_pool_total) }}</div>
								<div class="text-[11px] text-gray-600">{{ __("Pool") }}</div>
							</div>
						</div>
						<div v-if="commissions.data.entries.length > 0" class="divide-y divide-gray-50">
							<div v-for="c in commissions.data.entries" :key="c.name"
								@click="openDetail(c, 'Commission')"
								class="p-3 flex items-center gap-3 cursor-pointer active:bg-gray-100 transition-colors">
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-800">{{ c.sales_invoice }}</div>
									<div class="text-xs text-gray-600">{{ c.commission_type }}</div>
								</div>
								<div class="text-sm font-bold text-blue-600 flex-shrink-0">{{ fmt(c.commission_amount) }}</div>
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
							</div>
						</div>
						<div v-else class="p-4 text-center text-sm text-gray-600">
							{{ __("No commissions this month") }}
						</div>
					</div>
				</div>

				<!-- Loan Deductions -->
				<div v-if="loans.data?.loans?.length > 0">
					<div class="section-title mb-2">{{ __("Loan Deductions") }}</div>
					<div class="card-premium overflow-hidden">
						<div class="flex items-center justify-between p-3 border-b border-gray-100">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
									<FeatherIcon name="credit-card" class="w-4 text-teal-600" />
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-800">
										{{ loans.data.summary.active_count }} {{ __("active loan(s)") }}
									</div>
									<div class="text-xs text-gray-600">
										{{ fmt(loans.data.summary.total_monthly_deduction) }} {{ __("/month") }}
									</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Remaining") }}</div>
								<div class="text-sm font-black text-red-600">{{ fmt(loans.data.summary.total_remaining) }}</div>
							</div>
						</div>
						<div class="divide-y divide-gray-50">
							<div v-for="loan in loans.data.loans" :key="loan.name" class="p-3">
								<div class="flex items-center justify-between">
									<div>
										<div class="text-sm font-semibold text-gray-800">{{ loan.loan_product || __("Loan") }}</div>
										<div class="text-xs text-gray-600">
											{{ fmt(loan.monthly_repayment_amount) }}/{{ __("mo") }}
											· {{ fmt(loan.remaining_balance) }} {{ __("left") }}
										</div>
									</div>
									<span class="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
										:class="loan.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'">
										{{ loan.status }}
									</span>
								</div>
								<div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
									<div class="h-full bg-teal-500 rounded-full transition-all"
										:style="{ width: Math.min(100, Math.round((loan.total_principal_paid / loan.loan_amount) * 100)) + '%' }"></div>
								</div>
								<div class="flex justify-between mt-1 text-xs text-gray-600">
									<span>{{ fmt(loan.total_principal_paid) }} {{ __("paid") }}</span>
									<span>{{ fmt(loan.loan_amount) }} {{ __("total") }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="h-4"></div>
			</div>

			<!-- Submit Excuse Modal -->
			<div v-if="excuseModal.show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
				<div class="absolute inset-0 bg-black/50" @click="excuseModal.show = false"></div>
				<div class="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 z-10">
					<div class="text-sm font-bold text-gray-900 mb-1">{{ __("Submit Excuse") }}</div>
					<div class="text-xs text-gray-700 mb-4">
						{{ excuseModal.penalty?.penalty_type }} - {{ formatDay(excuseModal.penalty?.attendance_date) }}
						· {{ excuseModal.penalty?.deduction_days }}d {{ __("deduction") }}
					</div>
					<textarea v-model="excuseModal.reason"
						:placeholder="__('Explain why you were late or left early...')"
						class="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-icd-500 focus:border-transparent"
						rows="4"></textarea>
					<div class="flex gap-2 mt-4">
						<button @click="excuseModal.show = false"
							class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-bold active:bg-gray-200">
							{{ __("Cancel") }}
						</button>
						<button @click="submitExcuse"
							:disabled="excuseModal.processing || !excuseModal.reason.trim()"
							class="flex-1 bg-icd-600 text-white rounded-lg py-2.5 text-xs font-bold active:bg-icd-700 disabled:opacity-50">
							{{ excuseModal.processing ? __("Submitting...") : __("Submit Excuse") }}
						</button>
					</div>
				</div>
			</div>

			<!-- Detail Popup -->
			<Teleport to="body">
				<div v-if="itemDetail.show" class="fixed inset-0 z-50 flex items-end justify-center">
					<div class="absolute inset-0 bg-black/40" @click="itemDetail.show = false"></div>
					<div class="relative bg-white rounded-t-3xl w-full max-w-lg z-10 shadow-2xl max-h-[85vh] overflow-y-auto">
						<div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
						<div class="px-5 pb-6">
							<!-- Compact Header -->
							<div class="flex items-center gap-3 mb-4">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="detailIconBg(itemDetail.type)">
									<FeatherIcon :name="detailIconName(itemDetail.type)" class="w-5 h-5" :class="detailIconColor(itemDetail.type)" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-base font-black text-gray-900">{{ itemDetail.type }}</div>
									<div class="text-xs text-gray-700">{{ itemDetail.entry?.attendance_date ? formatDateLong(itemDetail.entry.attendance_date) : '' }}</div>
								</div>
								<div v-if="detailAmount" class="text-right flex-shrink-0">
									<div class="text-lg font-black" :class="detailAmountColor">{{ fmt(detailAmount) }}</div>
									<div class="text-xs font-bold" :class="detailAmountSubColor">EGP</div>
								</div>
							</div>

							<!-- Loading -->
							<div v-if="itemDetail.loading" class="flex items-center justify-center py-4 mb-3">
								<LoadingIndicator class="w-5 h-5 text-gray-600" />
								<span class="ml-2 text-sm text-gray-700">{{ __("Loading...") }}</span>
							</div>

							<!-- OVERTIME Details -->
							<div v-else-if="itemDetail.source && itemDetail.type === 'Overtime'"
								class="rounded-xl p-3 mb-4 border border-green-100 bg-green-50/40">
								<div v-if="itemDetail.source.shift_start_time || itemDetail.source.actual_check_in" class="grid grid-cols-2 gap-2 mb-3">
									<div class="bg-white rounded-lg p-2.5 border border-green-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Shift") }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_start_time || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_end_time || '--' }}</div>
									</div>
									<div class="bg-white rounded-lg p-2.5 border border-green-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Actual") }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_in) || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_out) || '--' }}</div>
									</div>
								</div>
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.overtime_type" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Type") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.overtime_type }}</span>
									</div>
									<div v-if="itemDetail.source.total_working_hours" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Working") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.total_working_hours }}h</span>
									</div>
									<div class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("OT Hours") }}</span>
										<span class="text-sm font-black text-green-700">{{ itemDetail.source.total_overtime_hours }}h</span>
									</div>
									<div v-if="itemDetail.source.day_overtime_hours || itemDetail.source.night_overtime_hours" class="flex gap-3 pl-3">
										<span v-if="itemDetail.source.day_overtime_hours" class="text-xs text-gray-700">{{ __("Day") }} {{ itemDetail.source.day_overtime_hours }}h</span>
										<span v-if="itemDetail.source.night_overtime_hours" class="text-xs text-gray-700">{{ __("Night") }} {{ itemDetail.source.night_overtime_hours }}h</span>
									</div>
									<div v-if="itemDetail.source.overtime_rate" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Rate") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.overtime_rate }}x</span>
									</div>
									<div v-if="itemDetail.source.is_holiday" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Holiday") }}</span>
										<span class="text-sm font-bold text-orange-600">{{ __("Yes") }}</span>
									</div>
									<div class="flex justify-between pt-1.5 mt-1 border-t border-green-200/50">
										<span class="text-sm font-bold text-gray-600">{{ __("Total") }}</span>
										<span class="text-sm font-black text-green-700">{{ fmt(itemDetail.source.overtime_amount) }} EGP</span>
									</div>
								</div>
							</div>

							<!-- LATE PENALTY Details -->
							<div v-else-if="itemDetail.source && itemDetail.type === 'Late Penalty'"
								class="rounded-xl p-3 mb-4 border border-red-100 bg-red-50/40">
								<div class="flex items-center gap-2 mb-3">
									<span v-if="itemDetail.source.penalty_type" class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{{ itemDetail.source.penalty_type }}</span>
									<span v-if="itemDetail.source.penalty_level" class="text-xs font-bold px-2 py-0.5 rounded-full"
										:class="{'bg-yellow-100 text-yellow-700': itemDetail.source.penalty_level === 'Warning', 'bg-orange-100 text-orange-700': itemDetail.source.penalty_level === 'Minor', 'bg-red-100 text-red-700': itemDetail.source.penalty_level === 'Major' || itemDetail.source.penalty_level === 'Accumulated'}">{{ itemDetail.source.penalty_level }}</span>
								</div>
								<div v-if="itemDetail.source.shift_start_time || itemDetail.source.actual_check_in" class="grid grid-cols-2 gap-2 mb-3">
									<div class="bg-white rounded-lg p-2.5 border border-red-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Shift") }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_start_time || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_end_time || '--' }}</div>
									</div>
									<div class="bg-white rounded-lg p-2.5 border border-red-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Actual") }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_in) || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_out) || '--' }}</div>
									</div>
								</div>
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.late_minutes" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Late By") }}</span>
										<span class="text-sm font-black text-red-700">{{ itemDetail.source.late_minutes }} {{ __("min") }}</span>
									</div>
									<div v-if="itemDetail.source.early_minutes" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Left Early") }}</span>
										<span class="text-sm font-black text-orange-600">{{ itemDetail.source.early_minutes }} {{ __("min") }}</span>
									</div>
									<div v-if="itemDetail.source.deduction_days != null" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Penalty Days") }}</span>
										<span class="text-sm font-black text-red-700">{{ itemDetail.source.deduction_days }} {{ __("day(s)") }}</span>
									</div>
									<div v-if="itemDetail.source.monthly_late_count" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Monthly Count") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.monthly_late_count }}x {{ __("this month") }}</span>
									</div>
								</div>
								<div v-if="itemDetail.source.excuse_status" class="mt-2 pt-2 border-t border-red-200/50">
									<div class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Excuse") }}</span>
										<span class="text-sm font-black" :class="itemDetail.source.excuse_status === 'Approved' ? 'text-green-700' : itemDetail.source.excuse_status === 'Rejected' ? 'text-red-700' : 'text-orange-600'">{{ itemDetail.source.excuse_status }}</span>
									</div>
									<div v-if="itemDetail.source.excuse_reason" class="text-xs text-gray-700 italic mt-1">"{{ itemDetail.source.excuse_reason }}"</div>
									<div v-if="itemDetail.source.excuse_rejection_reason" class="text-xs text-red-500 italic mt-0.5">"{{ itemDetail.source.excuse_rejection_reason }}"</div>
								</div>
							</div>

							<!-- COMMISSION Details -->
							<div v-else-if="itemDetail.source && itemDetail.type === 'Commission'"
								class="rounded-xl p-3 mb-4 border border-blue-100 bg-blue-50/40">
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.commission_type" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Type") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.commission_type }}</span>
									</div>
									<div v-if="itemDetail.source.sales_partner" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Sales Partner") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.sales_partner }}</span>
									</div>
									<div v-if="itemDetail.source.sales_invoice" class="flex justify-between">
										<span class="text-sm text-gray-700">{{ __("Invoice") }}</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.sales_invoice }}</span>
									</div>
									<div v-if="itemDetail.source.invoice_grand_total || itemDetail.source.commission_rate" class="grid grid-cols-2 gap-2 mt-1">
										<div v-if="itemDetail.source.invoice_grand_total" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Invoice Total") }}</div>
											<div class="text-sm font-black text-gray-800">{{ fmt(itemDetail.source.invoice_grand_total) }}</div>
										</div>
										<div v-if="itemDetail.source.commission_rate" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Rate") }}</div>
											<div class="text-sm font-black text-blue-700">{{ itemDetail.source.commission_rate }}%</div>
										</div>
									</div>
									<div v-if="itemDetail.source.commission_type === 'Office Pool' && itemDetail.source.pool_total" class="grid grid-cols-2 gap-2 mt-1">
										<div class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Pool Total") }}</div>
											<div class="text-sm font-black text-gray-800">{{ fmt(itemDetail.source.pool_total) }}</div>
										</div>
										<div v-if="itemDetail.source.share_denominator" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Share") }}</div>
											<div class="text-sm font-black text-blue-700">{{ itemDetail.source.share_numerator }}/{{ itemDetail.source.share_denominator }}</div>
										</div>
									</div>
									<div class="flex justify-between pt-1.5 mt-1 border-t border-blue-200/50">
										<span class="text-sm font-bold text-gray-600">{{ __("Total") }}</span>
										<span class="text-sm font-black text-blue-700">{{ fmt(itemDetail.source.commission_amount) }} EGP</span>
									</div>
								</div>
							</div>

							<!-- No source data -->
							<div v-else-if="!itemDetail.loading && !itemDetail.source"
								class="rounded-xl p-4 mb-4 bg-gray-100 text-center">
								<div class="text-sm text-gray-600">{{ __("Details not available") }}</div>
							</div>

							<!-- Close -->
							<button @click="itemDetail.show = false"
								class="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold active:bg-gray-200">
								{{ __("Close") }}
							</button>
						</div>
					</div>
				</div>
			</Teleport>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { createResource, FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"

const router = useRouter()

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// ===== API Resources =====

const payrollStatus = createResource({
	url: `${API_BASE}.salary.get_my_payroll_status`,
	auto: true,
	makeParams() { return { month: month.value, year: year.value } },
})

const penalties = createResource({
	url: `${API_BASE}.salary.get_penalties`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: month.value, year: year.value } },
})

const penaltySummary = createResource({
	url: `${API_BASE}.salary.get_penalty_summary`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: month.value, year: year.value } },
})

const overtime = createResource({
	url: `${API_BASE}.salary.get_overtime`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: month.value, year: year.value } },
})

const commissions = createResource({
	url: `${API_BASE}.salary.get_commission_entries`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: month.value, year: year.value } },
})

const loans = createResource({
	url: `${API_BASE}.salary.get_employee_loans`,
	auto: true,
	makeParams() { return { employee: employee.data?.name } },
})

const salaryBreakdown = createResource({
	url: `${API_BASE}.salary.get_my_salary_breakdown`,
	auto: true,
	makeParams() { return { employee: employee.data?.name, month: month.value, year: year.value } },
})

const slipData = computed(() => salaryBreakdown.data?.salary_slip || null)

watch([month, year], () => {
	penalties.reload()
	penaltySummary.reload()
	overtime.reload()
	commissions.reload()
	payrollStatus.reload()
	salaryBreakdown.reload()
})

// ===== Status Banner =====

const statusIconBgClass = computed(() => {
	const color = payrollStatus.data?.stage_color || "gray"
	const map = {
		green: "bg-green-100 dark:bg-green-900/40",
		orange: "bg-orange-100 dark:bg-orange-900/40",
		purple: "bg-purple-100 dark:bg-purple-900/40",
		blue: "bg-blue-100 dark:bg-blue-900/40",
		indigo: "bg-indigo-100 dark:bg-indigo-900/40",
		red: "bg-red-100 dark:bg-red-900/40",
		gray: "bg-gray-100 dark:bg-gray-700",
	}
	return map[color] || "bg-gray-100 dark:bg-gray-700"
})

const statusIconFgClass = computed(() => {
	const color = payrollStatus.data?.stage_color || "gray"
	const map = {
		green: "text-green-600 dark:text-green-400",
		orange: "text-orange-600 dark:text-orange-400",
		purple: "text-purple-600 dark:text-purple-400",
		blue: "text-blue-600 dark:text-blue-400",
		indigo: "text-indigo-600 dark:text-indigo-400",
		red: "text-red-600 dark:text-red-400",
		gray: "text-gray-600 dark:text-gray-400",
	}
	return map[color] || "text-gray-600 dark:text-gray-400"
})

const statusBarColorClass = computed(() => {
	const color = payrollStatus.data?.stage_color || "gray"
	const map = {
		green: "bg-green-500",
		orange: "bg-orange-500",
		purple: "bg-purple-500",
		blue: "bg-blue-500",
		indigo: "bg-indigo-500",
		red: "bg-red-500",
		gray: "bg-gray-400",
	}
	return map[color] || "bg-gray-400"
})

const statusIconName = computed(() => {
	const stage = payrollStatus.data?.stage || 0
	if (stage >= 4) return "check-circle"
	if (stage >= 3) return "shield"
	if (stage >= 2) return "user-check"
	if (stage >= 1) return "clock"
	return "minus-circle"
})

// ===== Month Navigation =====

function prevMonth() {
	if (month.value === 1) { month.value = 12; year.value-- }
	else month.value--
}
function nextMonth() {
	if (month.value === 12) { month.value = 1; year.value++ }
	else month.value++
}

// ===== Excuse Modal =====

const excuseModal = reactive({
	show: false,
	penalty: null,
	reason: "",
	processing: false,
})

function showExcuseModal(penalty) {
	excuseModal.penalty = penalty
	excuseModal.reason = ""
	excuseModal.processing = false
	excuseModal.show = true
}

async function submitExcuse() {
	if (!excuseModal.penalty || !excuseModal.reason.trim()) return
	excuseModal.processing = true
	try {
		await call("icd3s_attendance.icd3s_attendance.api.attendance.submit_late_excuse", {
			penalty_name: excuseModal.penalty.name,
			reason: excuseModal.reason.trim(),
		})
		excuseModal.show = false
		penalties.reload()
		penaltySummary.reload()
	} catch (e) {
		let msg = __("Failed to submit excuse")
		try {
			if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || msg
			else if (e?.message) msg = e.message
		} catch (_) {}
		toast({ title: msg, icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		excuseModal.processing = false
	}
}

// ===== Item Detail Popup =====

const SOURCE_DOCTYPE_MAP = {
	"Overtime": "ICD3S Overtime Entry",
	"Late Penalty": "ICD3S Late Penalty",
	"Commission": "ICD3S Commission Entry",
}

const itemDetail = reactive({
	show: false,
	type: "",
	entry: null,
	source: null,
	loading: false,
})

async function openDetail(entry, type) {
	itemDetail.type = type
	itemDetail.entry = entry
	itemDetail.source = null
	itemDetail.loading = true
	itemDetail.show = true

	const doctype = SOURCE_DOCTYPE_MAP[type]
	if (doctype && entry.name) {
		try {
			itemDetail.source = await call("frappe.client.get", { doctype, name: entry.name })
		} catch (e) { toast({ title: __("Failed to load details"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" }) }
	}
	itemDetail.loading = false
}

const detailAmount = computed(() => {
	if (!itemDetail.source) return null
	if (itemDetail.type === "Overtime") return itemDetail.source.overtime_amount
	if (itemDetail.type === "Commission") return itemDetail.source.commission_amount
	return null
})

const detailAmountColor = computed(() => {
	return { "Overtime": "text-green-700", "Commission": "text-blue-700", "Late Penalty": "text-red-700" }[itemDetail.type] || "text-gray-700"
})

const detailAmountSubColor = computed(() => {
	return { "Overtime": "text-green-500", "Commission": "text-blue-500", "Late Penalty": "text-red-500" }[itemDetail.type] || "text-gray-700"
})

function detailIconName(type) {
	return { "Overtime": "clock", "Late Penalty": "alert-circle", "Commission": "dollar-sign" }[type] || "info"
}
function detailIconBg(type) {
	return { "Overtime": "bg-green-100", "Late Penalty": "bg-red-100", "Commission": "bg-blue-100" }[type] || "bg-gray-100"
}
function detailIconColor(type) {
	return { "Overtime": "text-green-600", "Late Penalty": "text-red-600", "Commission": "text-blue-600" }[type] || "text-gray-700"
}

// ===== Formatting =====

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function formatDay(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM")
}

function fmtTime(dt) {
	if (!dt) return ""
	const d = new Date(dt)
	return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function fmtTimeRange(checkIn, checkOut) {
	const a = fmtTime(checkIn)
	const b = fmtTime(checkOut)
	if (a && b) return `${a} - ${b}`
	if (a) return a
	return ""
}

function formatDateLong(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function getLevelColor(level) {
	const map = {
		"Warning": "bg-yellow-100 text-yellow-700",
		"Minor": "bg-orange-100 text-orange-700",
		"Major": "bg-red-100 text-red-700",
		"Accumulated": "bg-purple-100 text-purple-700",
	}
	return map[level] || "bg-gray-100 text-gray-700"
}
</script>

<style scoped>
.salary-bg {
	background: #f9fafb;
}
.dark .salary-bg {
	background: #111827;
}
</style>
