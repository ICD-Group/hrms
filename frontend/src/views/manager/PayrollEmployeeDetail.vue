<template>
	<BaseLayout :pageTitle="empData?.employee_name || 'Employee'" :showBack="true">
		<template #body>
			<div class="flex flex-col gap-3 p-4 pb-28">
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<template v-else-if="empData">
					<!-- Employee Header -->
					<div class="flex items-center gap-3">
						<div v-if="empData.image" class="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
							<img :src="empData.image" class="w-full h-full object-cover" />
						</div>
						<div v-else class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" :class="avatarBg(empData.employee_name)">
							<span class="text-sm font-bold text-white">{{ initials(empData.employee_name) }}</span>
						</div>
						<div class="flex-1">
							<div class="text-lg font-black text-gray-900">{{ empData.employee_name }}</div>
							<div class="text-xs text-gray-700">{{ empData.department }} &middot; {{ empData.designation }}</div>
						</div>
						<div v-if="review">
							<span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="reviewBadge(review.status)">
								{{ review.status }}
							</span>
						</div>
					</div>

					<!-- ===== WHEN NO REVIEW: Show Running Totals + Activity ===== -->
					<template v-if="!review">
						<!-- Running Totals Grid -->
						<div class="grid grid-cols-3 gap-2">
							<div v-if="running.ot_amount" class="bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
								<div class="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="clock" class="w-3.5 h-3.5 text-green-600" />
								</div>
								<div class="text-sm font-black text-green-700">{{ fmt(running.ot_amount) }}</div>
								<div class="text-xs text-green-600 font-medium">Overtime</div>
								<div class="text-xs text-green-400">{{ running.ot_hours }}h</div>
							</div>
							<div v-if="running.penalty_count" class="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
								<div class="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="alert-circle" class="w-3.5 h-3.5 text-red-600" />
								</div>
								<div class="text-sm font-black text-red-700">{{ running.penalty_days }}d</div>
								<div class="text-xs text-red-600 font-medium">Penalties</div>
								<div class="text-xs text-red-400">{{ running.penalty_count }} times</div>
							</div>
							<div v-if="running.absence_days" class="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
								<div class="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="user-x" class="w-3.5 h-3.5 text-orange-600" />
								</div>
								<div class="text-sm font-black text-orange-700">{{ running.absence_days }}</div>
								<div class="text-xs text-orange-600 font-medium">Absences</div>
							</div>
							<div v-if="running.commission_total" class="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
								<div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="dollar-sign" class="w-3.5 h-3.5 text-blue-600" />
								</div>
								<div class="text-sm font-black text-blue-700">{{ fmt(running.commission_total) }}</div>
								<div class="text-xs text-blue-600 font-medium">Commission</div>
							</div>
							<div v-if="running.loan_amount" class="bg-teal-50 rounded-xl p-2.5 text-center border border-teal-100">
								<div class="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="credit-card" class="w-3.5 h-3.5 text-teal-600" />
								</div>
								<div class="text-sm font-black text-teal-700">{{ fmt(running.loan_amount) }}</div>
								<div class="text-xs text-teal-600 font-medium">Loan/mo</div>
							</div>
							<div v-if="running.meal_amount" class="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
								<div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-1">
									<FeatherIcon name="coffee" class="w-3.5 h-3.5 text-emerald-600" />
								</div>
								<div class="text-sm font-black text-emerald-700">{{ fmt(running.meal_amount) }}</div>
								<div class="text-xs text-emerald-600 font-medium">Meals</div>
							</div>
						</div>

						<!-- Empty totals state -->
						<div v-if="!running.ot_amount && !running.penalty_count && !running.absence_days && !running.commission_total && !running.loan_amount && !running.meal_amount"
							class="bg-gray-100 rounded-xl p-4 text-center border border-gray-100">
							<div class="text-sm text-gray-600">No payroll data recorded this month yet</div>
						</div>

						<!-- Activity Timeline -->
						<div v-if="activity.length" class="flex flex-col gap-1.5">
							<div class="text-xs font-bold text-gray-700 uppercase tracking-wider">Activity</div>
							<button v-for="(item, idx) in activity" :key="idx"
								@click="openActivityDetail(item)"
								class="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 text-left w-full active:bg-gray-100 transition-colors">
								<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
									:class="actIconBg(item.color)">
									<FeatherIcon :name="actIcon(item.type)" class="w-4 h-4" :class="actIconColor(item.color)" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-semibold text-gray-800">{{ item.description }}</div>
									<div class="text-xs text-gray-600">{{ formatDate(item.date) }}</div>
								</div>
								<div class="flex flex-col items-end flex-shrink-0">
									<span class="text-xs font-bold" :class="actAmountCls(item.type)">{{ item.amount_label }}</span>
									<span v-if="item.status" class="text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
										:class="actStatusCls(item.status)">{{ item.status }}</span>
								</div>
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0 mt-1" />
							</button>
						</div>
					</template>

					<!-- ===== WHEN REVIEW EXISTS: Show Full Review Tabs ===== -->
					<template v-else>
						<!-- Summary Cards -->
						<div class="grid grid-cols-3 gap-2">
							<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
								<div class="text-xs font-bold text-green-600 tracking-wider">EARNINGS</div>
								<div class="text-lg font-black text-green-800">{{ fmt(review.total_earnings) }}</div>
							</div>
							<div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
								<div class="text-xs font-bold text-red-600 tracking-wider">DEDUCTIONS</div>
								<div class="text-lg font-black text-red-800">{{ fmt(review.total_deductions) }}</div>
							</div>
							<div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
								<div class="text-xs font-bold text-blue-600 tracking-wider">NET</div>
								<div class="text-lg font-black text-blue-800">{{ fmt(review.net_adjustment) }}</div>
							</div>
						</div>

						<!-- Tabs -->
						<div class="flex bg-gray-100 rounded-xl p-1 gap-1">
							<button v-for="t in detailTabs" :key="t.key" @click="detailTab = t.key"
								class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
								:class="detailTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700'">
								{{ t.label }}
							</button>
						</div>

						<!-- EARNINGS TAB -->
						<template v-if="detailTab === 'earnings'">
							<div class="flex flex-col gap-2">
								<div class="bg-white rounded-xl border border-gray-100 p-3">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2.5">
											<div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
												<FeatherIcon name="briefcase" class="w-4 h-4 text-gray-700" />
											</div>
											<div>
												<div class="text-sm font-bold text-gray-800">Basic Salary</div>
												<div class="text-xs text-gray-600">Fixed monthly</div>
											</div>
										</div>
										<div class="text-sm font-black text-gray-800">{{ fmt(review.basic_salary) }}</div>
									</div>
								</div>
								<div v-for="item in review.earnings_detail" :key="item.name"
									@click="openItemDetail(item, 'earning')"
									class="bg-white rounded-xl border overflow-hidden cursor-pointer active:bg-gray-100 transition-colors"
									:class="isAdjusted(item) ? 'border-amber-200' : 'border-gray-100'">
									<div class="p-3">
										<div class="flex items-center gap-2.5">
											<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
												:class="earningIconBg(item.type)">
												<FeatherIcon :name="earningIcon(item.type)" class="w-4 h-4" :class="earningIconColor(item.type)" />
											</div>
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-1.5">
													<span class="text-sm font-bold text-gray-800">{{ item.type }}</span>
													<span v-if="isAdjusted(item)" class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">ADJUSTED</span>
												</div>
												<div class="text-xs text-gray-600">
													<span v-if="item.date">{{ formatDate(item.date) }}</span>
													<span v-if="item.date && item.description"> &middot; </span>
													<span v-if="item.description">{{ item.description }}</span>
												</div>
											</div>
											<div class="flex flex-col items-end flex-shrink-0">
												<div v-if="isAdjusted(item)" class="text-xs line-through text-gray-700">{{ fmt(item.original_amount) }}</div>
												<div class="text-sm font-black text-green-700">{{ fmt(item.adjusted_amount) }}</div>
											</div>
											<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
										</div>
										<div v-if="item.adjustment_reason" class="mt-1.5 ml-[42px] text-xs text-amber-600 italic">{{ item.adjustment_reason }}</div>
									</div>
									<div v-if="canAdjust" class="border-t border-gray-50 px-3 py-2 flex justify-end">
										<button @click.stop="openAdjust(item, 'earning')"
											class="text-xs font-bold text-icd-600 flex items-center gap-1 active:opacity-70">
											<FeatherIcon name="edit-2" class="w-3 h-3" /> Adjust Amount
										</button>
									</div>
								</div>
								<div v-if="empData.loan_amount" class="bg-teal-50 rounded-xl border border-teal-100 p-3">
									<div class="flex items-center gap-2.5">
										<div class="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
											<FeatherIcon name="credit-card" class="w-4 h-4 text-teal-600" />
										</div>
										<div class="flex-1">
											<div class="text-sm font-bold text-teal-800">Active Loan</div>
											<div class="text-xs text-teal-500">Monthly deduction (see Deductions tab)</div>
										</div>
										<div class="text-sm font-black text-teal-700">{{ fmt(empData.loan_amount) }}/mo</div>
									</div>
								</div>
								<div class="flex items-center justify-between py-3 bg-green-50 rounded-xl px-3">
									<span class="text-sm font-bold text-green-700">Total Earnings</span>
									<span class="text-lg font-black text-green-800">{{ fmt(review.total_earnings) }}</span>
								</div>
							</div>
						</template>

						<!-- DEDUCTIONS TAB -->
						<template v-if="detailTab === 'deductions'">
							<div class="flex flex-col gap-2">
								<div v-for="item in review.deductions_detail" :key="item.name"
									@click="openItemDetail(item, 'deduction')"
									class="bg-white rounded-xl border overflow-hidden cursor-pointer active:bg-gray-100 transition-colors"
									:class="isAdjusted(item) ? 'border-amber-200' : 'border-gray-100'">
									<div class="p-3">
										<div class="flex items-center gap-2.5">
											<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
												:class="deductionIconBg(item.type)">
												<FeatherIcon :name="deductionIcon(item.type)" class="w-4 h-4" :class="deductionIconColor(item.type)" />
											</div>
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-1.5">
													<span class="text-sm font-bold text-gray-800">{{ item.type }}</span>
													<span v-if="isAdjusted(item)" class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">ADJUSTED</span>
												</div>
												<div class="text-xs text-gray-600">
													<span v-if="item.date">{{ formatDate(item.date) }}</span>
													<span v-if="item.date && item.description"> &middot; </span>
													<span v-if="item.description">{{ item.description }}</span>
												</div>
											</div>
											<div class="flex flex-col items-end flex-shrink-0">
												<div v-if="isAdjusted(item)" class="text-xs line-through text-gray-700">{{ fmt(item.original_amount) }}</div>
												<div class="text-sm font-black text-red-700">{{ fmt(item.adjusted_amount) }}</div>
											</div>
											<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
										</div>
										<div v-if="item.adjustment_reason" class="mt-1.5 ml-[42px] text-xs text-amber-600 italic">{{ item.adjustment_reason }}</div>
									</div>
									<div v-if="canAdjust" class="border-t border-gray-50 px-3 py-2 flex justify-end">
										<button @click.stop="openAdjust(item, 'deduction')"
											class="text-xs font-bold text-icd-600 flex items-center gap-1 active:opacity-70">
											<FeatherIcon name="edit-2" class="w-3 h-3" /> Adjust Amount
										</button>
									</div>
								</div>
								<div v-if="empData.loan_amount" class="bg-white rounded-xl border border-teal-200 p-3">
									<div class="flex items-center gap-2.5">
										<div class="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
											<FeatherIcon name="credit-card" class="w-4 h-4 text-teal-600" />
										</div>
										<div class="flex-1">
											<div class="text-sm font-bold text-gray-800">Loan Deduction</div>
											<div class="text-xs text-gray-600">Active loan repayment</div>
										</div>
										<div class="text-sm font-black text-teal-700">{{ fmt(empData.loan_amount) }}</div>
									</div>
								</div>
								<div v-if="!review.deductions_detail?.length && !empData.loan_amount"
									class="text-center py-6 text-sm text-gray-600">No deductions this month</div>
								<div class="flex items-center justify-between py-3 bg-red-50 rounded-xl px-3">
									<span class="text-sm font-bold text-red-700">Total Deductions</span>
									<span class="text-lg font-black text-red-800">{{ fmt(review.total_deductions) }}</span>
								</div>
							</div>
						</template>

						<!-- ACTIVITY TAB -->
						<template v-if="detailTab === 'activity'">
							<div v-if="!activity.length" class="text-center py-8 text-sm text-gray-600">No activity this month</div>
							<div v-else class="flex flex-col gap-1.5">
								<button v-for="(item, idx) in activity" :key="idx"
									@click="openActivityDetail(item)"
									class="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 text-left w-full active:bg-gray-100 transition-colors">
									<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
										:class="actIconBg(item.color)">
										<FeatherIcon :name="actIcon(item.type)" class="w-4 h-4" :class="actIconColor(item.color)" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-xs font-semibold text-gray-800">{{ item.description }}</div>
										<div class="text-xs text-gray-600">{{ formatDate(item.date) }}</div>
									</div>
									<div class="flex flex-col items-end flex-shrink-0">
										<span class="text-xs font-bold" :class="actAmountCls(item.type)">{{ item.amount_label }}</span>
										<span v-if="item.status" class="text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
											:class="actStatusCls(item.status)">{{ item.status }}</span>
									</div>
									<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0 mt-1" />
								</button>
							</div>
						</template>

						<!-- APPROVE / REJECT ACTIONS -->
						<div v-if="review && showActions" class="mt-2 flex flex-col gap-2">
							<div v-if="showRejectInput" class="flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
								<div class="text-xs font-bold text-red-700">Rejection Reason</div>
								<textarea v-model="rejectReason" rows="2" placeholder="Enter reason for rejection..."
									class="w-full p-2.5 text-sm bg-white rounded-lg border border-red-200 outline-none text-gray-800 resize-none"></textarea>
								<div class="flex gap-2">
									<button @click="confirmReject" :disabled="processing"
										class="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
										{{ processing === 'reject' ? '...' : 'Confirm Reject' }}
									</button>
									<button @click="showRejectInput = false"
										class="px-4 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-xs font-bold">Cancel</button>
								</div>
							</div>
							<div v-if="!showRejectInput" class="flex gap-2">
								<button v-if="review.status === 'Pending HR'" @click="approveReview('hr')" :disabled="processing"
									class="flex-1 bg-green-600 text-white rounded-xl py-3 text-xs font-bold disabled:opacity-50">
									{{ processing === 'hr' ? '...' : 'HR Approve' }}
								</button>
								<button v-if="review.status === 'Pending CEO'" @click="approveReview('ceo')" :disabled="processing"
									class="flex-1 bg-green-600 text-white rounded-xl py-3 text-xs font-bold disabled:opacity-50">
									{{ processing === 'ceo' ? '...' : 'CEO Approve' }}
								</button>
								<button v-if="review.status === 'Pending HR' || review.status === 'Pending CEO'"
									@click="showRejectInput = true"
									class="flex-1 bg-red-50 text-red-600 border border-red-200/50 rounded-xl py-3 text-xs font-bold">Reject</button>
								<button v-if="review.status === 'Approved'" @click="syncReview" :disabled="processing"
									class="flex-1 bg-purple-600 text-white rounded-xl py-3 text-xs font-bold disabled:opacity-50">
									{{ processing === 'sync' ? '...' : 'Sync to Salary' }}
								</button>
							</div>
						</div>
					</template>
				</template>
			</div>

			<!-- ITEM DETAIL POPUP -->
			<Teleport to="body">
				<div v-if="itemDetail.show" class="fixed inset-0 z-50 flex items-end justify-center">
					<div class="absolute inset-0 bg-black/40" @click="itemDetail.show = false"></div>
					<div class="relative bg-white rounded-t-3xl w-full max-w-lg z-10 shadow-2xl max-h-[85vh] overflow-y-auto">
						<div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
						<div class="px-5 pb-6">
							<!-- Compact Header: icon + type + amount in one row -->
							<div class="flex items-center gap-3 mb-4">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="itemDetail.category === 'earning' ? earningIconBg(itemDetail.item?.type) : deductionIconBg(itemDetail.item?.type)">
									<FeatherIcon
										:name="itemDetail.category === 'earning' ? earningIcon(itemDetail.item?.type) : deductionIcon(itemDetail.item?.type)"
										class="w-5 h-5"
										:class="itemDetail.category === 'earning' ? earningIconColor(itemDetail.item?.type) : deductionIconColor(itemDetail.item?.type)" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-base font-black text-gray-900">{{ itemDetail.item?.type }}</div>
									<div class="text-xs text-gray-700">{{ empData?.employee_name }}</div>
								</div>
								<div class="text-right flex-shrink-0">
									<div class="text-lg font-black" :class="itemDetail.category === 'earning' ? 'text-green-700' : 'text-red-700'">
										{{ itemDetail.category === 'earning' ? '+' : '-' }}{{ fmt(itemDetail.item?.adjusted_amount ?? itemDetail.item?.amount) }}
									</div>
									<div class="text-xs font-bold" :class="itemDetail.category === 'earning' ? 'text-green-500' : 'text-red-500'">EGP</div>
								</div>
							</div>

							<!-- Loading -->
							<div v-if="itemDetail.loading" class="flex items-center justify-center py-4 mb-3">
								<LoadingIndicator class="w-5 h-5 text-gray-600" />
								<span class="ml-2 text-sm text-gray-700">Loading...</span>
							</div>

							<!-- OVERTIME Details -->
							<div v-else-if="itemDetail.source && itemDetail.item?.type === 'Overtime'"
								class="rounded-xl p-3 mb-4 border border-green-100 bg-green-50/40">
								<!-- Shift + Attendance side by side -->
								<div v-if="itemDetail.source.shift_start_time || itemDetail.source.actual_check_in" class="grid grid-cols-2 gap-2 mb-3">
									<div class="bg-white rounded-lg p-2.5 border border-green-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Shift</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_start_time || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_end_time || '--' }}</div>
									</div>
									<div class="bg-white rounded-lg p-2.5 border border-green-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Actual</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_in) || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_out) || '--' }}</div>
									</div>
								</div>
								<!-- OT Calculation compact -->
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.overtime_type" class="flex justify-between">
										<span class="text-sm text-gray-700">Type</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.overtime_type }}</span>
									</div>
									<div v-if="itemDetail.source.total_working_hours" class="flex justify-between">
										<span class="text-sm text-gray-700">Working</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.total_working_hours }}h</span>
									</div>
									<div class="flex justify-between">
										<span class="text-sm text-gray-700">OT Hours</span>
										<span class="text-sm font-black text-green-700">{{ itemDetail.source.total_overtime_hours }}h</span>
									</div>
									<div v-if="itemDetail.source.day_overtime_hours || itemDetail.source.night_overtime_hours" class="flex gap-3 pl-3">
										<span v-if="itemDetail.source.day_overtime_hours" class="text-xs text-gray-700">Day {{ itemDetail.source.day_overtime_hours }}h</span>
										<span v-if="itemDetail.source.night_overtime_hours" class="text-xs text-gray-700">Night {{ itemDetail.source.night_overtime_hours }}h</span>
									</div>
									<div v-if="itemDetail.source.overtime_rate" class="flex justify-between">
										<span class="text-sm text-gray-700">Rate</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.overtime_rate }}x</span>
									</div>
									<div v-if="itemDetail.source.is_holiday" class="flex justify-between">
										<span class="text-sm text-gray-700">Holiday</span>
										<span class="text-sm font-bold text-orange-600">Yes</span>
									</div>
									<div class="flex justify-between pt-1.5 mt-1 border-t border-green-200/50">
										<span class="text-sm font-bold text-gray-600">Total</span>
										<span class="text-sm font-black text-green-700">{{ fmt(itemDetail.source.overtime_amount) }} EGP</span>
									</div>
								</div>
							</div>

							<!-- LATE PENALTY Details -->
							<div v-else-if="itemDetail.source && itemDetail.item?.type === 'Late Penalty'"
								class="rounded-xl p-3 mb-4 border border-red-100 bg-red-50/40">
								<!-- Type + Level pills -->
								<div class="flex items-center gap-2 mb-3">
									<span v-if="itemDetail.source.penalty_type" class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{{ itemDetail.source.penalty_type }}</span>
									<span v-if="itemDetail.source.penalty_level" class="text-xs font-bold px-2 py-0.5 rounded-full"
										:class="{'bg-yellow-100 text-yellow-700': itemDetail.source.penalty_level === 'Warning', 'bg-orange-100 text-orange-700': itemDetail.source.penalty_level === 'Minor', 'bg-red-100 text-red-700': itemDetail.source.penalty_level === 'Major' || itemDetail.source.penalty_level === 'Accumulated'}">{{ itemDetail.source.penalty_level }}</span>
								</div>
								<!-- Shift + Attendance side by side -->
								<div v-if="itemDetail.source.shift_start_time || itemDetail.source.actual_check_in" class="grid grid-cols-2 gap-2 mb-3">
									<div class="bg-white rounded-lg p-2.5 border border-red-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Shift</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_start_time || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift_end_time || '--' }}</div>
									</div>
									<div class="bg-white rounded-lg p-2.5 border border-red-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Actual</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_in) || '--' }}</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.actual_check_out) || '--' }}</div>
									</div>
								</div>
								<!-- Penalty numbers compact -->
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.late_minutes" class="flex justify-between">
										<span class="text-sm text-gray-700">Late By</span>
										<span class="text-sm font-black text-red-700">{{ itemDetail.source.late_minutes }} min</span>
									</div>
									<div v-if="itemDetail.source.early_minutes" class="flex justify-between">
										<span class="text-sm text-gray-700">Left Early</span>
										<span class="text-sm font-black text-orange-600">{{ itemDetail.source.early_minutes }} min</span>
									</div>
									<div v-if="itemDetail.source.deduction_days != null" class="flex justify-between">
										<span class="text-sm text-gray-700">Penalty Days</span>
										<span class="text-sm font-black text-red-700">{{ itemDetail.source.deduction_days }} day(s)</span>
									</div>
									<div v-if="itemDetail.source.monthly_late_count" class="flex justify-between">
										<span class="text-sm text-gray-700">Monthly Count</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.monthly_late_count }}x this month</span>
									</div>
								</div>
								<!-- Excuse -->
								<div v-if="itemDetail.source.excuse_status" class="mt-2 pt-2 border-t border-red-200/50">
									<div class="flex justify-between">
										<span class="text-sm text-gray-700">Excuse</span>
										<span class="text-sm font-black" :class="itemDetail.source.excuse_status === 'Approved' ? 'text-green-700' : itemDetail.source.excuse_status === 'Rejected' ? 'text-red-700' : 'text-orange-600'">{{ itemDetail.source.excuse_status }}</span>
									</div>
									<div v-if="itemDetail.source.excuse_reason" class="text-xs text-gray-700 italic mt-1">"{{ itemDetail.source.excuse_reason }}"</div>
									<div v-if="itemDetail.source.excuse_rejection_reason" class="text-xs text-red-500 italic mt-0.5">"{{ itemDetail.source.excuse_rejection_reason }}"</div>
								</div>
							</div>

							<!-- ABSENCE Details -->
							<div v-else-if="itemDetail.source && itemDetail.item?.type === 'Absence'"
								class="rounded-xl p-3 mb-4 border border-orange-100 bg-orange-50/40">
								<!-- Status + Date header -->
								<div class="flex items-center justify-between mb-3">
									<span class="text-xs font-bold px-2 py-0.5 rounded-full"
										:class="{'bg-orange-100 text-orange-700': itemDetail.source.status === 'Absent', 'bg-yellow-100 text-yellow-700': itemDetail.source.status === 'Half Day', 'bg-blue-100 text-blue-700': itemDetail.source.status === 'On Leave', 'bg-green-100 text-green-700': itemDetail.source.status === 'Present'}">{{ itemDetail.source.status || 'Absent' }}</span>
									<span v-if="itemDetail.source.attendance_date" class="text-sm font-bold text-gray-700">{{ formatDateLong(itemDetail.source.attendance_date) }}</span>
								</div>
								<!-- Attendance times side by side -->
								<div v-if="itemDetail.source.in_time || itemDetail.source.shift" class="grid grid-cols-2 gap-2 mb-3">
									<div class="bg-white rounded-lg p-2.5 border border-orange-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Check In</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.in_time) || 'No record' }}</div>
									</div>
									<div class="bg-white rounded-lg p-2.5 border border-orange-100/60">
										<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">Check Out</div>
										<div class="text-sm font-bold text-gray-800">{{ fmtTime(itemDetail.source.out_time) || 'No record' }}</div>
									</div>
								</div>
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.shift" class="flex justify-between">
										<span class="text-sm text-gray-700">Shift</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.shift }}</span>
									</div>
									<div v-if="itemDetail.source.working_hours" class="flex justify-between">
										<span class="text-sm text-gray-700">Working Hours</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.working_hours }}h</span>
									</div>
									<div v-if="itemDetail.source.leave_type" class="flex justify-between">
										<span class="text-sm text-gray-700">Leave Type</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.leave_type }}</span>
									</div>
									<div v-if="itemDetail.source.leave_application" class="flex justify-between">
										<span class="text-sm text-gray-700">Leave Ref</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.leave_application }}</span>
									</div>
									<div v-if="itemDetail.source.late_entry || itemDetail.source.early_exit" class="flex gap-3 mt-1">
										<span v-if="itemDetail.source.late_entry" class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Late Entry</span>
										<span v-if="itemDetail.source.early_exit" class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Early Exit</span>
									</div>
								</div>
							</div>

							<!-- COMMISSION Details -->
							<div v-else-if="itemDetail.source && itemDetail.item?.type === 'Commission'"
								class="rounded-xl p-3 mb-4 border border-blue-100 bg-blue-50/40">
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.commission_type" class="flex justify-between">
										<span class="text-sm text-gray-700">Type</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.commission_type }}</span>
									</div>
									<div v-if="itemDetail.source.sales_partner" class="flex justify-between">
										<span class="text-sm text-gray-700">Sales Partner</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.sales_partner }}</span>
									</div>
									<div v-if="itemDetail.source.sales_invoice" class="flex justify-between">
										<span class="text-sm text-gray-700">Invoice</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.sales_invoice }}</span>
									</div>
									<!-- Invoice numbers side by side -->
									<div v-if="itemDetail.source.invoice_grand_total || itemDetail.source.commission_rate" class="grid grid-cols-2 gap-2 mt-1">
										<div v-if="itemDetail.source.invoice_grand_total" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Invoice Total</div>
											<div class="text-sm font-black text-gray-800">{{ fmt(itemDetail.source.invoice_grand_total) }}</div>
										</div>
										<div v-if="itemDetail.source.commission_rate" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Rate</div>
											<div class="text-sm font-black text-blue-700">{{ itemDetail.source.commission_rate }}%</div>
										</div>
									</div>
									<!-- Pool -->
									<div v-if="itemDetail.source.commission_type === 'Office Pool' && itemDetail.source.pool_total" class="grid grid-cols-2 gap-2 mt-1">
										<div class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Pool Total</div>
											<div class="text-sm font-black text-gray-800">{{ fmt(itemDetail.source.pool_total) }}</div>
										</div>
										<div v-if="itemDetail.source.share_denominator" class="bg-white rounded-lg p-2 border border-blue-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Share</div>
											<div class="text-sm font-black text-blue-700">{{ itemDetail.source.share_numerator }}/{{ itemDetail.source.share_denominator }}</div>
										</div>
									</div>
									<div class="flex justify-between pt-1.5 mt-1 border-t border-blue-200/50">
										<span class="text-sm font-bold text-gray-600">Total</span>
										<span class="text-sm font-black text-blue-700">{{ fmt(itemDetail.source.commission_amount) }} EGP</span>
									</div>
								</div>
							</div>

							<!-- MEAL Details -->
							<div v-else-if="itemDetail.source && itemDetail.item?.type === 'Meal Allowance'"
								class="rounded-xl p-3 mb-4 border border-emerald-100 bg-emerald-50/40">
								<div class="flex flex-col gap-1.5">
									<div v-if="itemDetail.source.meal_type" class="flex justify-between">
										<span class="text-sm text-gray-700">Meal</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.meal_type }}</span>
									</div>
									<div v-if="itemDetail.source.restaurant_name" class="flex justify-between">
										<span class="text-sm text-gray-700">Restaurant</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.restaurant_name }}</span>
									</div>
									<div v-if="itemDetail.source.meal_description" class="flex justify-between items-start">
										<span class="text-sm text-gray-700 flex-shrink-0">Order</span>
										<span class="text-sm font-bold text-gray-800 text-right ml-3">{{ itemDetail.source.meal_description }}</span>
									</div>
									<div v-if="itemDetail.source.reason" class="flex justify-between items-start">
										<span class="text-sm text-gray-700 flex-shrink-0">Reason</span>
										<span class="text-sm font-bold text-gray-800 text-right ml-3">{{ itemDetail.source.reason }}</span>
									</div>
									<!-- Compact info grid -->
									<div class="grid grid-cols-2 gap-2 mt-1">
										<div v-if="itemDetail.source.paid_by" class="bg-white rounded-lg p-2 border border-emerald-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Paid By</div>
											<div class="text-sm font-bold text-gray-800">{{ itemDetail.source.paid_by }}</div>
										</div>
										<div v-if="itemDetail.source.max_allowed" class="bg-white rounded-lg p-2 border border-emerald-100/60 text-center">
											<div class="text-[11px] font-bold text-gray-600 uppercase">Max</div>
											<div class="text-sm font-bold text-gray-800">{{ fmt(itemDetail.source.max_allowed) }}</div>
										</div>
									</div>
									<div v-if="itemDetail.source.related_overtime" class="flex justify-between">
										<span class="text-sm text-gray-700">Related OT</span>
										<span class="text-sm font-bold text-gray-800">{{ itemDetail.source.related_overtime }}</span>
									</div>
									<div v-if="itemDetail.source.status" class="flex justify-between">
										<span class="text-sm text-gray-700">Status</span>
										<span class="text-sm font-bold" :class="itemDetail.source.status === 'Approved' || itemDetail.source.status === 'Delivered' ? 'text-green-700' : 'text-orange-600'">{{ itemDetail.source.status }}</span>
									</div>
									<div class="flex justify-between pt-1.5 mt-1 border-t border-emerald-200/50">
										<span class="text-sm font-bold text-gray-600">Total</span>
										<span class="text-sm font-black text-emerald-700">{{ fmt(itemDetail.source.amount) }} EGP</span>
									</div>
								</div>
							</div>

							<!-- General Details (date, description, adjustment) -->
							<div class="flex flex-col gap-2 mb-4">
								<div v-if="itemDetail.item?.date" class="flex justify-between items-center">
									<span class="text-sm text-gray-700">Date</span>
									<span class="text-sm font-bold text-gray-800">{{ formatDateLong(itemDetail.item?.date) }}</span>
								</div>
								<div v-if="itemDetail.item?.description" class="flex justify-between items-start">
									<span class="text-sm text-gray-700 flex-shrink-0">Details</span>
									<span class="text-sm font-bold text-gray-800 text-right ml-3">{{ itemDetail.item?.description }}</span>
								</div>
								<div v-if="isAdjusted(itemDetail.item)" class="rounded-lg bg-amber-50 border border-amber-200 p-3 mt-1">
									<div class="flex items-center justify-between">
										<span class="text-xs font-black text-amber-700 uppercase">Adjusted</span>
										<div class="flex items-center gap-2">
											<span class="text-sm text-gray-600 line-through">{{ fmt(itemDetail.item?.original_amount) }}</span>
											<span class="text-sm font-black text-gray-900">{{ fmt(itemDetail.item?.adjusted_amount) }} EGP</span>
										</div>
									</div>
									<div v-if="itemDetail.item?.adjustment_reason" class="text-xs text-amber-600 italic mt-1">"{{ itemDetail.item?.adjustment_reason }}"</div>
								</div>
								<div v-if="itemDetail.item?.status" class="flex justify-between items-center">
									<span class="text-sm text-gray-700">Status</span>
									<span class="text-xs font-bold px-2 py-0.5 rounded-full"
										:class="actStatusCls(itemDetail.item?.status)">{{ itemDetail.item?.status }}</span>
								</div>
							</div>

							<!-- Actions -->
							<div class="flex gap-2">
								<button v-if="canAdjust && itemDetail.fromReview"
									@click="itemDetail.show = false; openAdjust(itemDetail.item, itemDetail.category)"
									class="flex-1 bg-gray-900 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1.5 active:bg-black">
									<FeatherIcon name="edit-2" class="w-4 h-4" />
									Adjust
								</button>
								<button v-if="canAdjust && itemDetail.fromReview"
									@click="discardItem"
									:disabled="itemDetail.discarding"
									class="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1.5 active:bg-red-700 disabled:opacity-50">
									<FeatherIcon name="trash-2" class="w-4 h-4" />
									{{ itemDetail.discarding ? '...' : 'Discard' }}
								</button>
								<button @click="itemDetail.show = false"
									class="bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold active:bg-gray-200"
									:class="canAdjust && itemDetail.fromReview ? 'px-5' : 'flex-1'">
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			</Teleport>

			<!-- ADJUST AMOUNT BOTTOM SHEET -->
			<Teleport to="body">
				<div v-if="adjustSheet.show" class="fixed inset-0 z-50 flex items-end justify-center">
					<div class="absolute inset-0 bg-black/30" @click="adjustSheet.show = false"></div>
					<div class="relative bg-white rounded-t-2xl w-full max-w-lg p-5 pb-8 z-10">
						<div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
						<div class="text-base font-bold text-gray-900 mb-1">Adjust {{ adjustSheet.item?.type }}</div>
						<div class="text-xs text-gray-700 mb-4">
							{{ adjustSheet.item?.description }}
							<span v-if="adjustSheet.item?.date"> &middot; {{ formatDate(adjustSheet.item.date) }}</span>
						</div>
						<div class="grid grid-cols-2 gap-3 mb-4">
							<div class="bg-gray-100 rounded-xl p-3 text-center">
								<div class="text-xs font-bold text-gray-600 uppercase">Original</div>
								<div class="text-lg font-black text-gray-700">{{ fmt(adjustSheet.item?.original_amount) }}</div>
							</div>
							<div class="bg-icd-50 rounded-xl p-3 text-center">
								<div class="text-xs font-bold text-icd-600 uppercase">New Amount</div>
								<input type="number" v-model="adjustSheet.newAmount" min="0" step="0.01"
									class="w-full text-lg font-black text-icd-700 bg-transparent text-center outline-none" />
							</div>
						</div>
						<div class="flex gap-2 mb-4">
							<button @click="adjustSheet.newAmount = adjustSheet.item?.original_amount"
								class="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-xs font-bold active:bg-gray-200">Reset to Original</button>
							<button @click="adjustSheet.newAmount = 0"
								class="flex-1 bg-green-50 text-green-700 rounded-lg py-2 text-xs font-bold active:bg-green-100">Set to Zero</button>
						</div>
						<div class="mb-4">
							<label class="text-xs font-bold text-gray-600 uppercase mb-1 block">Reason for Adjustment *</label>
							<textarea v-model="adjustSheet.reason" rows="2"
								placeholder="e.g., Per company policy, employee provided valid excuse..."
								class="w-full p-3 text-sm bg-gray-100 rounded-xl border border-gray-200 outline-none text-gray-800 resize-none"></textarea>
						</div>
						<div class="flex gap-2">
							<button @click="saveAdjustment" :disabled="adjustSheet.processing || !adjustSheet.reason.trim()"
								class="flex-1 bg-icd-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
								{{ adjustSheet.processing ? '...' : 'Save Adjustment' }}
							</button>
							<button @click="adjustSheet.show = false"
								class="px-6 bg-gray-100 text-gray-600 rounded-xl py-3 text-sm font-bold">Cancel</button>
						</div>
					</div>
				</div>
			</Teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")
const route = useRoute()
const router = useRouter()
const API = "icd3s_attendance.icd3s_attendance.api.modules.monthly_payroll"
const API_ATT = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const employeeId = route.params.employee
const month = route.query.month || (new Date().getMonth() + 1)
const year = route.query.year || new Date().getFullYear()

const isLoading = ref(false)
const detailTab = ref("earnings")
const processing = ref(null)
const showRejectInput = ref(false)
const rejectReason = ref("")
// Item detail popup
const itemDetail = reactive({
	show: false, item: null, category: "earning", fromReview: false,
	source: null, loading: false, discarding: false
})

const SOURCE_DOCTYPE_MAP = {
	"Overtime": "ICD3S Overtime Entry",
	"Commission": "ICD3S Commission Entry",
	"Meal Allowance": "ICD3S Meal Claim",
	"Late Penalty": "ICD3S Late Penalty",
	"Absence": "Attendance",
}

async function fetchSourceDoc(item) {
	const doctype = SOURCE_DOCTYPE_MAP[item?.type]
	if (!doctype || !item?.source_doc) return null
	try {
		const doc = await call("frappe.client.get", { doctype, name: item.source_doc })
		return doc
	} catch (e) {
		_errToast(e, "Failed to load source document")
		return null
	}
}

async function openItemDetail(item, category) {
	itemDetail.item = item
	itemDetail.category = category
	itemDetail.fromReview = true
	itemDetail.source = null
	itemDetail.loading = true
	itemDetail.discarding = false
	itemDetail.show = true
	// Fetch source document details
	itemDetail.source = await fetchSourceDoc(item)
	itemDetail.loading = false
}

async function openActivityDetail(item) {
	const EARNING_TYPES = ["overtime", "commission", "meal"]
	const typeMap = { overtime: "Overtime", commission: "Commission", meal: "Meal Allowance", penalty: "Late Penalty", absence: "Absence" }
	const mappedType = typeMap[item.type] || (item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Activity")
	itemDetail.item = {
		type: mappedType,
		date: item.date,
		description: item.description,
		amount: parseFloat((item.amount_label || "0").replace(/[^0-9.-]/g, "")) || 0,
		adjusted_amount: parseFloat((item.amount_label || "0").replace(/[^0-9.-]/g, "")) || 0,
		status: item.status,
		source_doc: item.doc_name,
	}
	itemDetail.category = EARNING_TYPES.includes(item.type) ? "earning" : "deduction"
	itemDetail.fromReview = false
	itemDetail.source = null
	itemDetail.loading = true
	itemDetail.discarding = false
	itemDetail.show = true
	// Fetch source document details
	itemDetail.source = await fetchSourceDoc(itemDetail.item)
	itemDetail.loading = false
}

async function discardItem() {
	if (!itemDetail.item || !review.value) return
	itemDetail.discarding = true
	try {
		await call(`${API_ATT}.adjust_line_item`, {
			review_name: review.value.name,
			row_name: itemDetail.item.name,
			new_amount: 0,
			reason: "Discarded by manager",
			table_type: itemDetail.category,
		})
		itemDetail.show = false
		await loadDetail()
	} catch (e) { _errToast(e, "Failed to discard item") }
	itemDetail.discarding = false
}

const empData = ref(null)
const review = ref(null)
const activity = ref([])
const running = ref({ penalty_count: 0, penalty_days: 0, ot_hours: 0, ot_amount: 0, commission_total: 0, absence_days: 0, loan_amount: 0, meal_amount: 0, correction_count: 0 })

const canAdjust = computed(() => {
	const s = review.value?.status
	return s === "Draft" || s === "Pending HR"
})

const showActions = computed(() => {
	const s = review.value?.status
	return ["Pending HR", "Pending CEO", "Approved"].includes(s)
})

const detailTabs = [
	{ key: "earnings", label: "Earnings" },
	{ key: "deductions", label: "Deductions" },
	{ key: "activity", label: "Activity" },
]

// ===== ADJUST SHEET =====
const adjustSheet = reactive({
	show: false, item: null, tableType: "earning",
	newAmount: 0, reason: "", processing: false,
})

function openAdjust(item, tableType) {
	adjustSheet.item = item
	adjustSheet.tableType = tableType
	adjustSheet.newAmount = item.adjusted_amount ?? item.original_amount
	adjustSheet.reason = item.adjustment_reason || ""
	adjustSheet.processing = false
	adjustSheet.show = true
}

async function saveAdjustment() {
	if (!adjustSheet.item || !adjustSheet.reason.trim()) return
	adjustSheet.processing = true
	try {
		await call(`${API_ATT}.adjust_line_item`, {
			review_name: review.value.name,
			row_name: adjustSheet.item.name,
			new_amount: parseFloat(adjustSheet.newAmount) || 0,
			reason: adjustSheet.reason.trim(),
			table_type: adjustSheet.tableType,
		})
		adjustSheet.show = false
		await loadDetail()
	} catch (e) { _errToast(e, "Failed to save adjustment") }
	adjustSheet.processing = false
}

function isAdjusted(item) {
	return item.adjusted_amount != null && item.original_amount != null
		&& Math.abs(item.adjusted_amount - item.original_amount) > 0.001
}

// ===== DATA LOADING =====
async function loadDetail() {
	isLoading.value = true
	try {
		const data = await call(`${API}.get_employee_payroll_detail`, {
			employee: employeeId, month, year
		})
		empData.value = data?.employee || null
		review.value = data?.review || null
		activity.value = data?.activity || []
		running.value = data?.running_totals || { penalty_count: 0, penalty_days: 0, ot_hours: 0, ot_amount: 0, commission_total: 0, absence_days: 0, loan_amount: 0, meal_amount: 0, correction_count: 0 }
	} catch (e) { _errToast(e, "Failed to load employee detail") }
	isLoading.value = false
}

// ===== REVIEW ACTIONS =====
async function approveReview(level) {
	processing.value = level
	try {
		const method = level === "hr" ? `${API_ATT}.hr_approve_review` : `${API_ATT}.ceo_approve_review`
		await call(method, { review_name: review.value.name })
		await loadDetail()
	} catch (e) { _errToast(e, "Failed to approve review") }
	processing.value = null
}

async function confirmReject() {
	processing.value = "reject"
	try {
		await call(`${API_ATT}.reject_review`, {
			review_name: review.value.name,
			notes: rejectReason.value || undefined
		})
		showRejectInput.value = false
		rejectReason.value = ""
		await loadDetail()
	} catch (e) { _errToast(e, "Failed to reject review") }
	processing.value = null
}

async function syncReview() {
	processing.value = "sync"
	try {
		await call(`${API_ATT}.sync_approved_to_salary`, { review_name: review.value.name })
		await loadDetail()
	} catch (e) { _errToast(e, "Failed to sync review") }
	processing.value = null
}

// ===== FORMATTING =====
function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function formatDate(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	const today = new Date()
	if (dt.toDateString() === today.toDateString()) return "Today"
	return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function fmtTime(dt) {
	if (!dt) return ""
	const d = new Date(dt)
	return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function formatDateLong(d) {
	if (!d) return ""
	const dt = new Date(d + "T00:00:00")
	return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function initials(name) {
	if (!name) return "?"
	return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

// ===== AVATAR =====
const AVATAR_BG = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500"]
function avatarBg(name) {
	let h = 0
	for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h + (name || "").charCodeAt(i)) | 0
	return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

// ===== ICONS =====
function earningIcon(type) { return { "Overtime": "clock", "Commission": "dollar-sign", "Meal Allowance": "coffee" }[type] || "plus-circle" }
function earningIconBg(type) { return { "Overtime": "bg-green-100", "Commission": "bg-blue-100", "Meal Allowance": "bg-emerald-100" }[type] || "bg-gray-100" }
function earningIconColor(type) { return { "Overtime": "text-green-600", "Commission": "text-blue-600", "Meal Allowance": "text-emerald-600" }[type] || "text-gray-700" }
function deductionIcon(type) { return { "Absence": "user-x", "Late Penalty": "alert-circle", "Monthly Accumulation": "layers" }[type] || "minus-circle" }
function deductionIconBg(type) { return { "Absence": "bg-orange-100", "Late Penalty": "bg-red-100", "Monthly Accumulation": "bg-purple-100" }[type] || "bg-gray-100" }
function deductionIconColor(type) { return { "Absence": "text-orange-600", "Late Penalty": "text-red-600", "Monthly Accumulation": "text-purple-600" }[type] || "text-gray-700" }

function actIcon(type) { return { penalty: "alert-circle", overtime: "clock", correction: "edit-2", commission: "dollar-sign", meal: "coffee" }[type] || "activity" }
function actIconBg(color) { return { red: "bg-red-100", green: "bg-green-100", yellow: "bg-yellow-100", blue: "bg-blue-100", emerald: "bg-emerald-100" }[color] || "bg-gray-100" }
function actIconColor(color) { return { red: "text-red-600", green: "text-green-600", yellow: "text-yellow-600", blue: "text-blue-600", emerald: "text-emerald-600" }[color] || "text-gray-700" }
function actAmountCls(type) { return { penalty: "text-red-600", overtime: "text-green-600", commission: "text-blue-600", meal: "text-emerald-600" }[type] || "text-gray-600" }
function actStatusCls(status) {
	const s = (status || "").toLowerCase()
	if (s.includes("approved") || s === "accepted") return "bg-green-100 text-green-700"
	if (s.includes("pending")) return "bg-orange-100 text-orange-700"
	if (s.includes("reject") || s === "denied") return "bg-red-100 text-red-700"
	return "bg-gray-100 text-gray-600"
}

function reviewBadge(status) {
	return {
		"Draft": "bg-gray-100 text-gray-600", "Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700", "Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700", "Synced": "bg-blue-100 text-blue-700",
	}[status] || "bg-gray-100 text-gray-600"
}

watch(() => employee.data?.company, (c) => { if (c) loadDetail() }, { immediate: true })
</script>
