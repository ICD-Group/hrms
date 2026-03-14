<template>
	<BaseLayout :pageTitle="__('Approvals')">
		<template #body>
			<div class="flex flex-col p-4 gap-4">
				<!-- Summary Bar -->
				<div v-if="totalPending > 0" class="flex items-center gap-2 px-1">
					<div class="inline-flex items-center gap-1.5 bg-icd-50 text-icd-700 px-3 py-1.5 rounded-full">
						<div class="w-2 h-2 rounded-full bg-icd-500 animate-pulse"></div>
						<span class="text-xs font-bold">{{ __("{0} pending", [totalPending]) }}</span>
					</div>
				</div>

				<!-- Category Tabs -->
				<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
					<button
						v-for="tab in categoryTabs"
						:key="tab.value"
						@click="activeCategory = tab.value"
						class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
						:class="activeCategory === tab.value
							? 'bg-icd-600 text-white shadow-sm shadow-icd-600/20'
							: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
					>
						{{ tab.label }}
						<span v-if="tab.count > 0" class="ml-1 px-1.5 rounded-full"
							:class="activeCategory === tab.value ? 'bg-white/30' : 'bg-gray-200'">
							{{ tab.count }}
						</span>
					</button>
				</div>

				<!-- Loading State -->
				<div v-if="loading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- ==================== ALL REQUESTS ==================== -->
				<div v-else-if="activeCategory === 'all'">
					<div v-if="allRequests.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="inbox" class="w-7 h-7 text-gray-700" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending requests") }}</div>
						<div class="text-xs text-gray-600 mt-1">{{ __("All caught up") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="req in allRequests" :key="req.id"
							class="approval-card"
							@click="openDetail(req.doctype, req.name, req._type)">
							<div class="flex items-start gap-3">
								<!-- Type icon -->
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
									:class="req.iconBg">
									<FeatherIcon :name="req.icon" class="w-[18px] h-[18px]" :class="req.iconColor" />
								</div>

								<!-- Content -->
								<div class="flex-1 min-w-0">
									<!-- Row 1: Name + Stage -->
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ req.employee_name }}</div>
										<div class="flex items-center gap-1.5 flex-shrink-0">
											<span v-if="req._type === 'disciplinary' && req.stage" class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="daStatusCls(req._daStatus)">
												{{ req.stage }}
											</span>
											<span v-else-if="req.stage" class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="req.stage === 'HR' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'">
												{{ req.stage === 'HR' ? __('HR') : __('CEO') }}
											</span>
											<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full" :class="req.typeCls">
												{{ req.typeLabel }}
											</span>
										</div>
									</div>

									<!-- Row 2: Summary -->
									<div class="text-[12px] text-gray-700 mt-0.5 truncate">{{ req.summary }}</div>

									<!-- Row 3: Date + Doc ID -->
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ req.date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono truncate max-w-[120px]">{{ req.name }}</span>
									</div>
								</div>
							</div>

							<!-- Action buttons -->
							<div v-if="req._type === 'disciplinary'" class="flex gap-2 mt-3 pt-3 border-t border-red-100/60">
								<button @click.stop="router.push({ name: 'ManagerDisciplinaryDetail', params: { id: req.name } })"
									class="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm shadow-red-500/15 active:shadow-none flex items-center justify-center gap-1.5 transition-all">
									<FeatherIcon name="eye" class="w-3.5 h-3.5" />
									{{ __("Review") }}
								</button>
							</div>
							<div v-else class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveAllItem(req)" :disabled="req._processing"
									class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm shadow-green-500/15 active:shadow-none disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
									<FeatherIcon v-if="req._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ req._processing === 'approve' ? __("...") : __("Approve") }}
								</button>
								<button @click.stop="rejectAllItem(req)" :disabled="req._processing"
									class="flex-1 bg-red-50 text-red-600 border border-red-200/50 rounded-xl py-2.5 text-xs font-bold active:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
									<FeatherIcon v-if="req._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ req._processing === 'reject' ? __("...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== DISCIPLINARY ==================== -->
				<div v-else-if="activeCategory === 'disciplinary'">
					<div v-if="disciplinary.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="shield" class="w-7 h-7 text-red-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No active disciplinary actions") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="da in disciplinary" :key="da.name"
							class="approval-card"
							@click="router.push({ name: 'ManagerDisciplinaryDetail', params: { id: da.name } })">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-red-100 to-red-50 flex-shrink-0">
									<FeatherIcon name="shield" class="w-[18px] h-[18px] text-red-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ da.employee_name }}</div>
										<div class="flex items-center gap-1.5 flex-shrink-0">
											<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full" :class="daStatusCls(da.status)">
												{{ daStatusLabel(da.status) }}
											</span>
											<span v-if="da.severity" class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="da.severity === 'Critical' ? 'bg-red-100 text-red-700' : da.severity === 'Major' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'">
												{{ da.severity }}
											</span>
										</div>
									</div>
									<div class="text-[12px] text-gray-700 mt-0.5 truncate">{{ da.action_type }}{{ da.department ? ' · ' + da.department : '' }}</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ da.incident_date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono truncate max-w-[120px]">{{ da.name }}</span>
									</div>
								</div>
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-red-100/60">
								<button @click.stop="router.push({ name: 'ManagerDisciplinaryDetail', params: { id: da.name } })"
									class="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm shadow-red-500/15 active:shadow-none flex items-center justify-center gap-1.5 transition-all">
									<FeatherIcon name="eye" class="w-3.5 h-3.5" />
									{{ __("Review") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== LEAVES ==================== -->
				<div v-else-if="activeCategory === 'leaves'">
					<div v-if="leaves.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="calendar" class="w-7 h-7 text-blue-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending leave applications") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="leave in leaves" :key="leave.name"
							class="approval-card"
							@click="openDetail('Leave Application', leave.name, 'leave')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-100 to-blue-50 flex-shrink-0">
									<FeatherIcon name="calendar" class="w-[18px] h-[18px] text-blue-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ leave.employee_name }}</div>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
											:class="leave.workflow_state === 'Pending CEO Approval' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'">
											{{ leave.workflow_state === 'Pending CEO Approval' ? __('CEO') : __('HR') }}
										</span>
									</div>
									<div class="text-[12px] text-gray-700 mt-0.5">{{ leave.leave_type }}</div>
									<div class="flex items-center gap-3 mt-1.5">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ leave.from_date }} - {{ leave.to_date }}
										</span>
										<span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
											{{ leave.total_leave_days }}d
										</span>
									</div>
									<div class="text-[11px] text-gray-700 font-mono mt-1">{{ leave.name }}</div>
								</div>
							</div>
							<div v-if="leave.description" class="text-xs text-gray-600 mt-2.5 bg-blue-50/60 rounded-lg p-2.5 border border-blue-100/40">
								{{ leave.description }}
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveLeave(leave)" :disabled="leave._processing"
									class="approve-btn">
									<FeatherIcon v-if="leave._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ leave._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="rejectLeave(leave)" :disabled="leave._processing"
									class="reject-btn">
									<FeatherIcon v-if="leave._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ leave._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== CORRECTIONS ==================== -->
				<div v-else-if="activeCategory === 'corrections'">
					<div v-if="corrections.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="edit-3" class="w-7 h-7 text-purple-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending attendance corrections") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="corr in corrections" :key="corr.name"
							class="approval-card"
							@click="openDetail('ICD3S Attendance Correction', corr.name, 'correction')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-purple-100 to-purple-50 flex-shrink-0">
									<FeatherIcon name="edit-3" class="w-[18px] h-[18px] text-purple-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ corr.employee_name }}</div>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
											{{ corr.correction_type }}
										</span>
									</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ corr.correction_date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono">{{ corr.name }}</span>
									</div>
								</div>
							</div>
							<div v-if="corr.reason" class="text-xs text-gray-600 mt-2.5 bg-purple-50/60 rounded-lg p-2.5 border border-purple-100/40">
								<div class="text-[11px] font-bold text-purple-500 uppercase mb-0.5">{{ __("Reason") }}</div>
								{{ corr.reason }}
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveCorrection(corr)" :disabled="corr._processing" class="approve-btn">
									<FeatherIcon v-if="corr._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ corr._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="showRejectDialog(corr, 'correction')" :disabled="corr._processing" class="reject-btn">
									<FeatherIcon v-if="corr._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ corr._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== SHIFT SWAPS ==================== -->
				<div v-else-if="activeCategory === 'swaps'">
					<div v-if="swaps.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="repeat" class="w-7 h-7 text-pink-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending shift swap requests") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="swap in swaps" :key="swap.name"
							class="approval-card"
							@click="openDetail('ICD3S Shift Swap', swap.name, 'swap')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-pink-100 to-pink-50 flex-shrink-0">
									<FeatherIcon name="repeat" class="w-[18px] h-[18px] text-pink-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ swap.requester_name }}</div>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 flex-shrink-0">
											{{ __("Swap") }}
										</span>
									</div>
									<div class="text-[11px] text-gray-600 flex items-center gap-1 mt-1">
										<FeatherIcon name="calendar" class="w-3 h-3" />
										{{ swap.swap_date }}
										<span class="text-gray-700 font-mono ml-1">{{ swap.name }}</span>
									</div>
								</div>
							</div>
							<!-- Swap Visual -->
							<div class="bg-pink-50/60 rounded-xl p-3 mt-2.5 border border-pink-100/40">
								<div class="flex items-center justify-between text-xs">
									<div class="text-center flex-1">
										<div class="font-semibold text-gray-900">{{ swap.requester_name }}</div>
										<div class="text-pink-600 mt-0.5 text-[11px]">{{ swap.requester_shift_type }}</div>
									</div>
									<div class="mx-2">
										<div class="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
											<FeatherIcon name="repeat" class="w-3.5 h-3.5 text-pink-500" />
										</div>
									</div>
									<div class="text-center flex-1">
										<div class="font-semibold text-gray-900">{{ swap.target_employee_name }}</div>
										<div class="text-pink-600 mt-0.5 text-[11px]">{{ swap.target_shift_type }}</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveSwap(swap)" :disabled="swap._processing" class="approve-btn">
									<FeatherIcon v-if="swap._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ swap._processing === 'approve' ? __("Approving...") : __("Approve Swap") }}
								</button>
								<button @click.stop="showRejectDialog(swap, 'swap')" :disabled="swap._processing" class="reject-btn">
									<FeatherIcon v-if="swap._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ swap._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== EXPENSES ==================== -->
				<div v-else-if="activeCategory === 'expenses'">
					<div v-if="expenses.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="credit-card" class="w-7 h-7 text-green-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending expense claims") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="exp in expenses" :key="exp.name"
							class="approval-card"
							@click="openDetail('Expense Claim', exp.name, 'expense')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-green-100 to-green-50 flex-shrink-0">
									<FeatherIcon name="credit-card" class="w-[18px] h-[18px] text-green-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ exp.employee_name }}</div>
										<div class="flex items-center gap-1.5 flex-shrink-0">
											<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="exp.workflow_state === 'Pending CEO Approval' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'">
												{{ exp.workflow_state === 'Pending CEO Approval' ? __('CEO') : __('HR') }}
											</span>
											<span class="text-sm font-bold text-green-700">EGP {{ exp.total_claimed_amount }}</span>
										</div>
									</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ exp.posting_date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono">{{ exp.name }}</span>
									</div>
								</div>
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveExpense(exp)" :disabled="exp._processing" class="approve-btn">
									<FeatherIcon v-if="exp._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ exp._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="rejectExpense(exp)" :disabled="exp._processing" class="reject-btn">
									<FeatherIcon v-if="exp._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ exp._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== DEVICES ==================== -->
				<div v-else-if="activeCategory === 'devices'">
					<div v-if="devices.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="smartphone" class="w-7 h-7 text-amber-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending device approvals") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="dev in devices" :key="dev.name"
							class="approval-card"
							@click="openDetail('ICD3S Device Binding', dev.name, 'device')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-amber-100 to-amber-50 flex-shrink-0">
									<FeatherIcon name="smartphone" class="w-[18px] h-[18px] text-amber-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ dev.employee_name }}</div>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
											{{ __("Pending") }}
										</span>
									</div>
									<div class="text-[12px] text-gray-700 mt-0.5">{{ dev.device_name || dev.device_model || __("Unknown") }}</div>
									<div class="text-[11px] text-gray-700 font-mono mt-1">{{ dev.name }}</div>
								</div>
							</div>
							<!-- Device info grid -->
							<div class="bg-amber-50/40 rounded-xl p-3 mt-2.5 border border-amber-100/30">
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div>
										<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("Model") }}</div>
										<div class="text-gray-700 font-medium">{{ dev.device_model || "-" }}</div>
									</div>
									<div>
										<div class="text-[11px] font-bold text-gray-600 uppercase">{{ __("OS") }}</div>
										<div class="text-gray-700">{{ dev.os_version || "-" }}</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveDeviceBinding(dev)" :disabled="dev._processing" class="approve-btn">
									<FeatherIcon v-if="dev._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ dev._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="showRejectDialog(dev, 'device')" :disabled="dev._processing" class="reject-btn">
									<FeatherIcon v-if="dev._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ dev._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== ATTENDANCE REQUESTS ==================== -->
				<div v-else-if="activeCategory === 'attendance'">
					<div v-if="attendance.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="check-square" class="w-7 h-7 text-teal-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending attendance requests") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="req in attendance" :key="req.name"
							class="approval-card"
							@click="openDetail('Attendance Request', req.name, 'attendance')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-100 to-teal-50 flex-shrink-0">
									<FeatherIcon name="check-square" class="w-[18px] h-[18px] text-teal-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ req.employee_name }}</div>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 flex-shrink-0">
											{{ req.workflow_state || __("Pending") }}
										</span>
									</div>
									<div v-if="req.reason" class="text-[12px] text-gray-700 mt-0.5 truncate">{{ req.reason }}</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ req.from_date }} - {{ req.to_date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono">{{ req.name }}</span>
									</div>
								</div>
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveAttendanceReq(req)" :disabled="req._processing" class="approve-btn">
									<FeatherIcon v-if="req._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ req._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="rejectAttendanceReq(req)" :disabled="req._processing" class="reject-btn">
									<FeatherIcon v-if="req._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ req._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== MEALS ==================== -->
				<div v-else-if="activeCategory === 'meals'">
					<div v-if="meals.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="coffee" class="w-7 h-7 text-emerald-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending meal claims") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="meal in meals" :key="meal.name"
							class="approval-card"
							@click="openDetail('ICD3S Meal Claim', meal.name, 'meal')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-emerald-100 to-emerald-50 flex-shrink-0">
									<FeatherIcon name="coffee" class="w-[18px] h-[18px] text-emerald-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ meal.employee_name }}</div>
										<div class="flex items-center gap-1.5 flex-shrink-0">
											<span v-if="meal.status" class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="meal.status === 'Pending HR' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'">
												{{ meal.status === 'Pending HR' ? __('HR') : __('CEO') }}
											</span>
											<span class="text-sm font-bold text-emerald-700">{{ meal.amount }}</span>
										</div>
									</div>
									<div class="text-[12px] text-gray-700 mt-0.5">{{ meal.restaurant_name }} · {{ meal.meal_type }}</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ meal.claim_date }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono">{{ meal.name }}</span>
									</div>
								</div>
							</div>
							<div v-if="meal.reason" class="text-xs text-gray-600 mt-2.5 bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-100/40">
								{{ meal.reason }}
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveMeal(meal)" :disabled="meal._processing" class="approve-btn">
									<FeatherIcon v-if="meal._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ meal._processing === 'approve' ? __("...") : meal.status === 'Pending HR' ? __("HR Approve") : __("CEO Approve") }}
								</button>
								<button @click.stop="rejectMealItem(meal)" :disabled="meal._processing" class="reject-btn">
									<FeatherIcon v-if="meal._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ meal._processing === 'reject' ? __("...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== WORK REQUESTS (WFH / MISSION) ==================== -->
				<div v-else-if="activeCategory === 'work'">
					<div v-if="workRequests.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="home" class="w-7 h-7 text-indigo-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending WFH/Mission requests") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="wr in workRequests" :key="wr.name"
							class="approval-card"
							@click="openDetail('ICD3S Work Request', wr.name, 'work')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-indigo-100 to-indigo-50 flex-shrink-0">
									<FeatherIcon name="home" class="w-[18px] h-[18px] text-indigo-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ wr.employee_name }}</div>
										<div class="flex items-center gap-1.5 flex-shrink-0">
											<span v-if="wr.status" class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="wr.status === 'Pending HR' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'">
												{{ wr.status === 'Pending HR' ? __('HR') : __('CEO') }}
											</span>
											<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="wr.request_type === 'Work From Home' ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-700'">
												{{ wr.request_type === 'Work From Home' ? __('WFH') : __('Mission') }}
											</span>
										</div>
									</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="clock" class="w-3 h-3" />
											{{ wr.from_datetime?.slice(0, 16) }} - {{ wr.to_datetime?.slice(0, 16) }}
										</span>
										<span v-if="wr.total_hours" class="text-[11px] font-bold text-indigo-600">{{ wr.total_hours }}h</span>
									</div>
									<div class="text-[11px] text-gray-700 font-mono mt-1">{{ wr.name }}</div>
								</div>
							</div>
							<div v-if="wr.mission_location" class="text-xs text-gray-600 mt-2 flex items-center gap-1">
								<FeatherIcon name="map-pin" class="w-3 text-cyan-500 flex-shrink-0" />
								{{ wr.mission_location }}
								<span v-if="wr.mission_client" class="text-gray-600">· {{ wr.mission_client }}</span>
							</div>
							<div v-if="wr.reason" class="text-xs text-gray-600 mt-2 bg-indigo-50/60 rounded-lg p-2.5 border border-indigo-100/40">
								{{ wr.reason }}
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveWorkRequest(wr)" :disabled="wr._processing" class="approve-btn">
									<FeatherIcon v-if="wr._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ wr._processing === 'approve' ? __("...") : wr.status === 'Pending HR' ? __("HR Approve") : __("CEO Approve") }}
								</button>
								<button @click.stop="showRejectDialog(wr, 'work')" :disabled="wr._processing" class="reject-btn">
									<FeatherIcon v-if="wr._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ wr._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- ==================== ADVANCES ==================== -->
				<div v-else-if="activeCategory === 'advances'">
					<div v-if="advances.length === 0" class="empty-state">
						<div class="empty-icon"><FeatherIcon name="dollar-sign" class="w-7 h-7 text-cyan-300" /></div>
						<div class="text-sm font-semibold text-gray-700">{{ __("No pending employee advances") }}</div>
					</div>
					<div v-else class="flex flex-col gap-2.5">
						<div v-for="adv in advances" :key="adv.name"
							class="approval-card"
							@click="openDetail('Employee Advance', adv.name, 'advance')">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-cyan-100 to-cyan-50 flex-shrink-0">
									<FeatherIcon name="dollar-sign" class="w-[18px] h-[18px] text-cyan-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<div class="text-[13px] font-bold text-gray-900 truncate">{{ adv.employee_name }}</div>
										<span class="text-sm font-bold text-cyan-700">EGP {{ adv.advance_amount }}</span>
									</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-gray-600 flex items-center gap-1">
											<FeatherIcon name="calendar" class="w-3 h-3" />
											{{ adv.posting_date }}
										</span>
										<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
											{{ adv.status }}
										</span>
										<span class="text-[11px] text-gray-700 font-mono">{{ adv.name }}</span>
									</div>
								</div>
							</div>
							<div v-if="adv.purpose" class="text-xs text-gray-600 mt-2.5 bg-cyan-50/60 rounded-lg p-2.5 border border-cyan-100/40">
								{{ adv.purpose }}
							</div>
							<div class="flex gap-2 mt-3 pt-3 border-t border-gray-100/60">
								<button @click.stop="approveAdvance(adv)" :disabled="adv._processing" class="approve-btn">
									<FeatherIcon v-if="adv._processing !== 'approve'" name="check" class="w-3.5 h-3.5" />
									{{ adv._processing === 'approve' ? __("Approving...") : __("Approve") }}
								</button>
								<button @click.stop="rejectAdvance(adv)" :disabled="adv._processing" class="reject-btn">
									<FeatherIcon v-if="adv._processing !== 'reject'" name="x" class="w-3.5 h-3.5" />
									{{ adv._processing === 'reject' ? __("Rejecting...") : __("Reject") }}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Request Detail Sheet -->
			<RequestDetailSheet
				:visible="detailSheet.show"
				:doctype="detailSheet.doctype"
				:docname="detailSheet.docname"
				:isManager="true"
				:showActions="detailSheet.showActions"
				:processing="detailSheet.processing"
				@close="detailSheet.show = false"
				@approve="onSheetApprove"
				@reject="onSheetReject"
			/>

			<!-- Reject Reason Modal -->
			<Teleport to="body">
				<transition name="sheet">
					<div v-if="rejectModal.show" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
						<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="rejectModal.show = false"></div>
						<div class="reject-modal-glass relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 z-10 shadow-2xl">
							<div class="flex justify-center mb-4 sm:hidden">
								<div class="w-12 h-1.5 rounded-full bg-gray-300/50"></div>
							</div>
							<div class="w-12 h-12 rounded-2xl bg-red-100/80 flex items-center justify-center mx-auto mb-3">
								<FeatherIcon name="x-circle" class="w-6 h-6 text-red-500" />
							</div>
							<div class="text-sm font-bold text-gray-900 text-center mb-1">{{ __("Reject Request") }}</div>
							<div class="text-xs text-gray-700 text-center mb-4">
								{{ rejectModal.type === 'correction'
									? __("Rejecting correction for") + ' ' + (rejectModal.item?.employee_name || '')
									: rejectModal.type === 'device'
										? __("Rejecting device for") + ' ' + (rejectModal.item?.employee_name || '')
										: rejectModal.type === 'work'
											? __("Rejecting work request for") + ' ' + (rejectModal.item?.employee_name || '')
											: __("Rejecting shift swap for") + ' ' + (rejectModal.item?.requester_name || '')
								}}
							</div>
							<textarea
								v-model="rejectModal.reason"
								:placeholder="__('Reason for rejection (optional)')"
								class="w-full bg-white/60 border border-gray-200/40 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-300"
								rows="3"
							></textarea>
							<div class="flex gap-2 mt-4">
								<button @click="rejectModal.show = false"
									class="flex-1 bg-gray-100/60 text-gray-700 rounded-xl py-3 text-sm font-bold active:bg-gray-200/60 transition-colors">
									{{ __("Cancel") }}
								</button>
								<button @click="confirmReject" :disabled="rejectModal.processing"
									class="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-3 text-sm font-bold active:from-red-600 active:to-red-700 disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all">
									{{ rejectModal.processing ? __("Rejecting...") : __("Confirm Reject") }}
								</button>
							</div>
						</div>
					</div>
				</transition>
			</Teleport>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, watch, onActivated, onMounted, nextTick } from "vue"
import { useRouter, useRoute } from "vue-router"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import RequestDetailSheet from "@/components/RequestDetailSheet.vue"
import { useManagerApi } from "@/composables/managerApi"

const { setValue, submitDoc, cancelDoc } = useManagerApi()

const router = useRouter()
const route = useRoute()
const __ = inject("$translate")
const employee = inject("$employee")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

// Support deep-linking: ?tab=work pre-selects that category
const activeCategory = ref(route.query.tab || "all")
const loading = ref(false)
const disciplinary = ref([])
const leaves = ref([])
const corrections = ref([])
const swaps = ref([])
const devices = ref([])
const expenses = ref([])
const attendance = ref([])
const meals = ref([])
const workRequests = ref([])
const advances = ref([])

const rejectModal = reactive({
	show: false,
	item: null,
	type: "",
	reason: "",
	processing: false,
})

// Detail sheet for viewing full request
const detailSheet = reactive({
	show: false,
	doctype: "",
	docname: "",
	showActions: true,
	processing: false,
	_type: "",
})

function openDetail(doctype, name, type) {
	if (type === "disciplinary") {
		router.push({ name: "ManagerDisciplinaryDetail", params: { id: name } })
		return
	}
	detailSheet.doctype = doctype
	detailSheet.docname = name
	detailSheet._type = type
	detailSheet.processing = false
	detailSheet.showActions = true
	detailSheet.show = true
}

async function onSheetApprove({ doctype, name }) {
	detailSheet.processing = "approve"
	try {
		const t = detailSheet._type
		if (t === "leave") await approveLeave(leaves.value.find(l => l.name === name) || { name, _processing: null })
		else if (t === "correction") await approveCorrection(corrections.value.find(c => c.name === name) || { name, _processing: null })
		else if (t === "swap") await approveSwap(swaps.value.find(s => s.name === name) || { name, _processing: null })
		else if (t === "device") await approveDeviceBinding(devices.value.find(d => d.name === name) || { name, _processing: null })
		else if (t === "expense") await approveExpense(expenses.value.find(e => e.name === name) || { name, _processing: null })
		else if (t === "attendance") await approveAttendanceReq(attendance.value.find(a => a.name === name) || { name, _processing: null })
		else if (t === "meal") await approveMeal(meals.value.find(m => m.name === name) || { name, _processing: null })
		else if (t === "work") await approveWorkRequest(workRequests.value.find(w => w.name === name) || { name, _processing: null })
		else if (t === "advance") await approveAdvance(advances.value.find(a => a.name === name) || { name, _processing: null })
		detailSheet.show = false
	} catch (e) {
		_errToast(e, "Failed to approve")
	}
	detailSheet.processing = false
}

async function onSheetReject({ doctype, name }) {
	// For types with reject modal, close sheet and open reject modal
	if (["correction", "swap", "device", "work"].includes(detailSheet._type)) {
		detailSheet.show = false
		const t = detailSheet._type
		const item = t === "correction" ? corrections.value.find(c => c.name === name)
			: t === "swap" ? swaps.value.find(s => s.name === name)
			: t === "work" ? workRequests.value.find(w => w.name === name)
			: devices.value.find(d => d.name === name)
		if (item) showRejectDialog(item, t)
		return
	}
	// Direct reject for other types
	detailSheet.processing = "reject"
	try {
		const t = detailSheet._type
		if (t === "leave") await rejectLeave(leaves.value.find(l => l.name === name) || { name, _processing: null })
		else if (t === "expense") await rejectExpense(expenses.value.find(e => e.name === name) || { name, _processing: null })
		else if (t === "attendance") await rejectAttendanceReq(attendance.value.find(a => a.name === name) || { name, _processing: null })
		else if (t === "meal") await rejectMealItem(meals.value.find(m => m.name === name) || { name, _processing: null })
		else if (t === "advance") await rejectAdvance(advances.value.find(a => a.name === name) || { name, _processing: null })
		detailSheet.show = false
	} catch (e) {
		_errToast(e, "Failed to reject")
	}
	detailSheet.processing = false
}

async function loadApprovals() {
	loading.value = true
	try {
		const company = employee.data?.company
		const [data, daData] = await Promise.all([
			call(`${API_BASE}.get_all_pending`, { company: company || null }),
			call(`${API_BASE}.get_all_disciplinary_actions`, { limit: 50 }).catch(() => ({ actions: [] })),
		])

		if (data) {
			leaves.value = data.leaves || []
			corrections.value = data.corrections || []
			swaps.value = data.swaps || []
			expenses.value = data.expenses || []
			devices.value = data.devices || []
			attendance.value = data.attendance || []
			meals.value = data.meals || []
			workRequests.value = data.work_requests || []
			advances.value = data.advances || []
		}
		// Only show actionable disciplinary items (not closed/resolved)
		const activeStatuses = ["Under Investigation", "Pending Employee Defense", "Pending HR", "Pending CEO", "Appealed"]
		disciplinary.value = (daData?.actions || []).filter(a => activeStatuses.includes(a.status))

		// Auto-open specific document from notification deep link (?doc=XX&doctype=YY)
		if (route.query.doc && route.query.doctype) {
			nextTick(() => autoOpenFromQuery())
		}
	} catch (e) {
		console.error("[Approvals] Load error:", e)
	} finally {
		loading.value = false
	}
}

// DocType → openDetail type parameter
const DOCTYPE_TO_TYPE = {
	"Leave Application": "leave",
	"ICD3S Attendance Correction": "correction",
	"ICD3S Shift Swap": "swap",
	"ICD3S Device Binding": "device",
	"Expense Claim": "expense",
	"Attendance Request": "attendance",
	"ICD3S Meal Claim": "meal",
	"ICD3S Work Request": "work",
	"Employee Advance": "advance",
	"ICD3S Disciplinary Action": "disciplinary",
}

function autoOpenFromQuery() {
	const docName = route.query.doc
	const doctype = route.query.doctype
	if (!docName || !doctype) return
	const type = DOCTYPE_TO_TYPE[doctype]
	if (type) {
		openDetail(doctype, docName, type)
		// Clear doc params to prevent re-open on navigation
		router.replace({ query: route.query.tab ? { tab: route.query.tab } : {} })
	}
}

// Load on mount + when company changes (same pattern as Dashboard.vue)
onMounted(() => { loadApprovals() })
onActivated(() => {
	if (route.query.tab) activeCategory.value = route.query.tab
	loadApprovals()
})
watch(() => employee.data?.company, (c) => { if (c) loadApprovals() })

const totalPending = computed(() => {
	return disciplinary.value.length + leaves.value.length + corrections.value.length + swaps.value.length + devices.value.length + expenses.value.length + attendance.value.length + meals.value.length + workRequests.value.length + advances.value.length
})

const categoryTabs = computed(() => {
	const tabs = [
		{ label: __("All"), value: "all", count: totalPending.value },
	]
	if (disciplinary.value.length > 0) {
		tabs.push({ label: __("Disciplinary"), value: "disciplinary", count: disciplinary.value.length })
	}
	tabs.push(
		{ label: __("Leaves"), value: "leaves", count: leaves.value.length },
		{ label: __("Corrections"), value: "corrections", count: corrections.value.length },
		{ label: __("Swaps"), value: "swaps", count: swaps.value.length },
		{ label: __("Devices"), value: "devices", count: devices.value.length },
		{ label: __("Expenses"), value: "expenses", count: expenses.value.length },
		{ label: __("Attendance"), value: "attendance", count: attendance.value.length },
		{ label: __("Meals"), value: "meals", count: meals.value.length },
		{ label: __("WFH/Mission"), value: "work", count: workRequests.value.length },
		{ label: __("Advances"), value: "advances", count: advances.value.length },
	)
	return tabs
})

// ==================== TYPE ICONS (for All tab) ====================
const TYPE_ICON_MAP = {
	"ICD3S Disciplinary Action": { icon: "shield", bg: "bg-gradient-to-br from-red-100 to-red-50", color: "text-red-600" },
	"Leave Application": { icon: "calendar", bg: "bg-gradient-to-br from-blue-100 to-blue-50", color: "text-blue-600" },
	"ICD3S Attendance Correction": { icon: "edit-3", bg: "bg-gradient-to-br from-purple-100 to-purple-50", color: "text-purple-600" },
	"ICD3S Shift Swap": { icon: "repeat", bg: "bg-gradient-to-br from-pink-100 to-pink-50", color: "text-pink-600" },
	"ICD3S Device Binding": { icon: "smartphone", bg: "bg-gradient-to-br from-amber-100 to-amber-50", color: "text-amber-600" },
	"Expense Claim": { icon: "credit-card", bg: "bg-gradient-to-br from-green-100 to-green-50", color: "text-green-600" },
	"Attendance Request": { icon: "check-square", bg: "bg-gradient-to-br from-teal-100 to-teal-50", color: "text-teal-600" },
	"ICD3S Meal Claim": { icon: "coffee", bg: "bg-gradient-to-br from-emerald-100 to-emerald-50", color: "text-emerald-600" },
	"ICD3S Work Request": { icon: "home", bg: "bg-gradient-to-br from-indigo-100 to-indigo-50", color: "text-indigo-600" },
	"Employee Advance": { icon: "dollar-sign", bg: "bg-gradient-to-br from-cyan-100 to-cyan-50", color: "text-cyan-600" },
}

// Error toast helper - parses frappe error format
function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) { /* ignore parse errors */ }
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// ==================== WORKFLOW HELPER ====================
async function applyWorkflow(doctype, name, action) {
	return await call("frappe.model.workflow.apply_workflow", {
		doc: JSON.stringify({ doctype, name }),
		action,
	})
}

// ==================== LEAVE ====================
async function approveLeave(leave) {
	if (!leave) return
	leave._processing = "approve"
	try {
		const action = leave.workflow_state === "Pending CEO Approval" ? "Final Approve" : "Approve"
		await applyWorkflow("Leave Application", leave.name, action)
		const msg = action === "Approve" ? "Leave approved by HR - awaiting CEO" : "Leave approved"
		toast({ title: __(msg), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve leave"); leave._processing = null }
}

async function rejectLeave(leave) {
	if (!leave) return
	leave._processing = "reject"
	try {
		await applyWorkflow("Leave Application", leave.name, "Reject")
		toast({ title: __("Leave rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to reject leave"); leave._processing = null }
}

// ==================== CORRECTION ====================
async function approveCorrection(corr) {
	if (!corr) return
	corr._processing = "approve"
	try {
		await call(`${API_BASE}.approve_correction`, { correction_name: corr.name })
		toast({ title: __("Correction approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve correction"); corr._processing = null }
}

// ==================== SHIFT SWAP ====================
async function approveSwap(swap) {
	if (!swap) return
	swap._processing = "approve"
	try {
		await call(`${API_BASE}.approve_shift_swap`, { swap_name: swap.name })
		toast({ title: __("Swap approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve swap"); swap._processing = null }
}

// ==================== DEVICE BINDING ====================
async function approveDeviceBinding(dev) {
	if (!dev) return
	dev._processing = "approve"
	try {
		await call(`${API_BASE}.approve_device`, { binding_name: dev.name })
		toast({ title: __("Device approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve device"); dev._processing = null }
}

// ==================== EXPENSE ====================
async function approveExpense(exp) {
	if (!exp) return
	exp._processing = "approve"
	try {
		const action = exp.workflow_state === "Pending CEO Approval" ? "Final Approve" : "Approve"
		await applyWorkflow("Expense Claim", exp.name, action)
		const msg = action === "Approve" ? "Expense approved by HR - awaiting CEO" : "Expense approved"
		toast({ title: __(msg), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve expense"); exp._processing = null }
}

async function rejectExpense(exp) {
	if (!exp) return
	exp._processing = "reject"
	try {
		await applyWorkflow("Expense Claim", exp.name, "Reject")
		toast({ title: __("Expense rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to reject expense"); exp._processing = null }
}

// ==================== ATTENDANCE REQUEST ====================
async function approveAttendanceReq(req) {
	if (!req) return
	req._processing = "approve"
	try {
		const action = req.workflow_state === "Pending CEO Approval" ? "Final Approve" : "Approve"
		await applyWorkflow("Attendance Request", req.name, action)
		const msg = action === "Approve" ? "Attendance approved by HR - awaiting CEO" : "Attendance request approved"
		toast({ title: __(msg), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve attendance request"); req._processing = null }
}

async function rejectAttendanceReq(req) {
	if (!req) return
	req._processing = "reject"
	try {
		await applyWorkflow("Attendance Request", req.name, "Reject")
		toast({ title: __("Attendance request rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to reject attendance request"); req._processing = null }
}

// ==================== REJECT MODAL ====================
function showRejectDialog(item, type) {
	rejectModal.item = item
	rejectModal.type = type
	rejectModal.reason = ""
	rejectModal.processing = false
	rejectModal.show = true
}

async function confirmReject() {
	if (!rejectModal.item) return
	rejectModal.processing = true
	rejectModal.item._processing = "reject"

	try {
		if (rejectModal.type === "correction") {
			await call(`${API_BASE}.reject_correction`, {
				correction_name: rejectModal.item.name,
				rejection_reason: rejectModal.reason || null,
			})
		} else if (rejectModal.type === "swap") {
			await call(`${API_BASE}.reject_shift_swap`, {
				swap_name: rejectModal.item.name,
				rejection_reason: rejectModal.reason || null,
			})
		} else if (rejectModal.type === "device") {
			await call(`${API_BASE}.reject_device`, {
				binding_name: rejectModal.item.name,
				rejection_reason: rejectModal.reason || null,
			})
		} else if (rejectModal.type === "work") {
			await call(`${API_BASE}.reject_work_request`, {
				request_name: rejectModal.item.name,
				rejection_reason: rejectModal.reason || null,
			})
		}
		rejectModal.show = false
		toast({ title: __("Request rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) {
		_errToast(e, "Failed to reject")
		rejectModal.processing = false
		rejectModal.item._processing = null
	}
}

// ==================== ALL REQUESTS (MERGED VIEW) ====================
const DA_STATUS_MAP = {
	"Under Investigation": { label: "Investigation", cls: "bg-amber-100 text-amber-700" },
	"Pending Employee Defense": { label: "Awaiting Defense", cls: "bg-orange-100 text-orange-700" },
	"Pending HR": { label: "HR Review", cls: "bg-red-100 text-red-700" },
	"Pending CEO": { label: "CEO Review", cls: "bg-purple-100 text-purple-700" },
	"Appealed": { label: "Appeal", cls: "bg-blue-100 text-blue-700" },
}

function daStatusCls(status) {
	return (DA_STATUS_MAP[status] || { cls: "bg-gray-100 text-gray-700" }).cls
}

function daStatusLabel(status) {
	return (DA_STATUS_MAP[status] || { label: status }).label
}

const allRequests = computed(() => {
	const items = []
	const getStyle = (dt) => TYPE_ICON_MAP[dt] || { icon: "file", bg: "bg-gray-100", color: "text-gray-700" }

	// Disciplinary first (urgent - top of list)
	for (const da of disciplinary.value) {
		const s = getStyle("ICD3S Disciplinary Action")
		const statusInfo = DA_STATUS_MAP[da.status] || { label: da.status, cls: "bg-gray-100 text-gray-700" }
		items.push({ id: `da-${da.name}`, name: da.name, doctype: "ICD3S Disciplinary Action", employee_name: da.employee_name, typeLabel: __("Disciplinary"), typeCls: "bg-red-100 text-red-700", date: da.incident_date, summary: `${da.action_type || ""} · ${da.severity || ""}`.replace(/ · $/, ""), _type: "disciplinary", _processing: null, stage: statusInfo.label, _daStatus: da.status, icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}

	for (const l of leaves.value) {
		const s = getStyle("Leave Application")
		items.push({ id: `l-${l.name}`, name: l.name, doctype: "Leave Application", employee_name: l.employee_name, typeLabel: __("Leave"), typeCls: "bg-blue-100 text-blue-700", date: `${l.from_date} - ${l.to_date}`, summary: `${l.leave_type} · ${l.total_leave_days}d`, _type: "leave", _processing: l._processing, stage: l.workflow_state === "Pending CEO Approval" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const c of corrections.value) {
		const s = getStyle("ICD3S Attendance Correction")
		items.push({ id: `c-${c.name}`, name: c.name, doctype: "ICD3S Attendance Correction", employee_name: c.employee_name, typeLabel: __("Correction"), typeCls: "bg-purple-100 text-purple-700", date: c.correction_date, summary: c.correction_type, _type: "correction", _processing: c._processing, stage: c.status === "Pending CEO" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const sw of swaps.value) {
		const s = getStyle("ICD3S Shift Swap")
		items.push({ id: `s-${sw.name}`, name: sw.name, doctype: "ICD3S Shift Swap", employee_name: sw.requester_name, typeLabel: __("Swap"), typeCls: "bg-pink-100 text-pink-700", date: sw.swap_date, summary: `${sw.requester_shift_type} → ${sw.target_employee_name}`, _type: "swap", _processing: sw._processing, stage: sw.status === "Pending CEO" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const d of devices.value) {
		const s = getStyle("ICD3S Device Binding")
		items.push({ id: `d-${d.name}`, name: d.name, doctype: "ICD3S Device Binding", employee_name: d.employee_name, typeLabel: __("Device"), typeCls: "bg-amber-100 text-amber-700", date: d.registered_on?.split(" ")[0] || "", summary: d.device_name || d.device_model || "", _type: "device", _processing: d._processing, stage: null, icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const e of expenses.value) {
		const s = getStyle("Expense Claim")
		items.push({ id: `e-${e.name}`, name: e.name, doctype: "Expense Claim", employee_name: e.employee_name, typeLabel: __("Expense"), typeCls: "bg-green-100 text-green-700", date: e.posting_date, summary: `EGP ${e.total_claimed_amount}`, _type: "expense", _processing: e._processing, stage: e.workflow_state === "Pending CEO Approval" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const a of attendance.value) {
		const s = getStyle("Attendance Request")
		items.push({ id: `a-${a.name}`, name: a.name, doctype: "Attendance Request", employee_name: a.employee_name, typeLabel: __("Attendance"), typeCls: "bg-teal-100 text-teal-700", date: `${a.from_date} - ${a.to_date}`, summary: a.reason || "", _type: "attendance", _processing: a._processing, stage: a.workflow_state === "Pending CEO Approval" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const m of meals.value) {
		const s = getStyle("ICD3S Meal Claim")
		items.push({ id: `m-${m.name}`, name: m.name, doctype: "ICD3S Meal Claim", employee_name: m.employee_name, typeLabel: __("Meal"), typeCls: "bg-emerald-100 text-emerald-700", date: m.claim_date, summary: `${m.restaurant_name} · ${m.amount}`, _type: "meal", _processing: m._processing, stage: m.status === "Pending CEO" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const w of workRequests.value) {
		const s = getStyle("ICD3S Work Request")
		items.push({ id: `w-${w.name}`, name: w.name, doctype: "ICD3S Work Request", employee_name: w.employee_name, typeLabel: w.request_type === "Work From Home" ? __("WFH") : __("Mission"), typeCls: w.request_type === "Work From Home" ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700", date: `${(w.from_datetime || "").slice(0, 10)}`, summary: w.reason || w.request_type, _type: "work", _processing: w._processing, stage: w.status === "Pending CEO" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	for (const adv of advances.value) {
		const s = getStyle("Employee Advance")
		items.push({ id: `adv-${adv.name}`, name: adv.name, doctype: "Employee Advance", employee_name: adv.employee_name, typeLabel: __("Advance"), typeCls: "bg-cyan-100 text-cyan-700", date: adv.posting_date, summary: `EGP ${adv.advance_amount}`, _type: "advance", _processing: adv._processing, stage: adv.workflow_state === "Pending CEO Approval" ? "CEO" : "HR", icon: s.icon, iconBg: s.bg, iconColor: s.color })
	}
	return items
})

// Universal approve/reject dispatchers for "All" tab
async function approveAllItem(req) {
	req._processing = "approve"
	try {
		if (req._type === "leave") await approveLeave(leaves.value.find(l => l.name === req.name))
		else if (req._type === "correction") await approveCorrection(corrections.value.find(c => c.name === req.name))
		else if (req._type === "swap") await approveSwap(swaps.value.find(s => s.name === req.name))
		else if (req._type === "device") await approveDeviceBinding(devices.value.find(d => d.name === req.name))
		else if (req._type === "expense") await approveExpense(expenses.value.find(e => e.name === req.name))
		else if (req._type === "attendance") await approveAttendanceReq(attendance.value.find(a => a.name === req.name))
		else if (req._type === "meal") await approveMeal(meals.value.find(m => m.name === req.name))
		else if (req._type === "work") await approveWorkRequest(workRequests.value.find(w => w.name === req.name))
		else if (req._type === "advance") await approveAdvance(advances.value.find(a => a.name === req.name))
	} catch (e) { _errToast(e, "Failed to approve"); req._processing = null }
}

async function rejectAllItem(req) {
	// For types with reject modal
	if (["correction", "swap", "device", "work"].includes(req._type)) {
		const item = req._type === "correction" ? corrections.value.find(c => c.name === req.name)
			: req._type === "swap" ? swaps.value.find(s => s.name === req.name)
			: req._type === "work" ? workRequests.value.find(w => w.name === req.name)
			: devices.value.find(d => d.name === req.name)
		if (item) showRejectDialog(item, req._type)
		return
	}
	req._processing = "reject"
	try {
		if (req._type === "leave") await rejectLeave(leaves.value.find(l => l.name === req.name))
		else if (req._type === "expense") await rejectExpense(expenses.value.find(e => e.name === req.name))
		else if (req._type === "attendance") await rejectAttendanceReq(attendance.value.find(a => a.name === req.name))
		else if (req._type === "meal") await rejectMealItem(meals.value.find(m => m.name === req.name))
		else if (req._type === "advance") await rejectAdvance(advances.value.find(a => a.name === req.name))
	} catch (e) { _errToast(e, "Failed to reject"); req._processing = null }
}

// ==================== WORK REQUESTS ====================
async function approveWorkRequest(wr) {
	if (!wr) return
	wr._processing = "approve"
	try {
		if (wr.status === "Pending HR") {
			await call(`${API_BASE}.hr_approve_work_request`, { request_name: wr.name })
			toast({ title: __("HR approved - awaiting CEO"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		} else {
			await call(`${API_BASE}.ceo_approve_work_request`, { request_name: wr.name })
			toast({ title: __("Work request approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		}
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve work request"); wr._processing = null }
}

// ==================== MEAL CLAIMS ====================
async function approveMeal(meal) {
	if (!meal) return
	meal._processing = "approve"
	try {
		if (meal.status === "Pending HR") {
			await call(`${API_BASE}.hr_approve_meal`, { claim_name: meal.name })
			toast({ title: __("HR approved - awaiting CEO"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		} else {
			await call(`${API_BASE}.ceo_approve_meal`, { claim_name: meal.name })
			toast({ title: __("Meal claim approved"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		}
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve meal claim"); meal._processing = null }
}

async function rejectMealItem(meal) {
	if (!meal) return
	meal._processing = "reject"
	try {
		await call(`${API_BASE}.reject_meal`, { claim_name: meal.name })
		toast({ title: __("Meal claim rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to reject meal claim"); meal._processing = null }
}

// ==================== EMPLOYEE ADVANCE ====================
async function approveAdvance(adv) {
	if (!adv) return
	adv._processing = "approve"
	try {
		const action = adv.workflow_state === "Pending CEO Approval" ? "Final Approve" : "Approve"
		await applyWorkflow("Employee Advance", adv.name, action)
		const msg = action === "Approve" ? "Advance approved by HR - awaiting CEO" : "Advance approved"
		toast({ title: __(msg), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to approve advance"); adv._processing = null }
}

async function rejectAdvance(adv) {
	if (!adv) return
	adv._processing = "reject"
	try {
		await applyWorkflow("Employee Advance", adv.name, "Reject")
		toast({ title: __("Advance rejected"), icon: "check-circle", position: "bottom-center", iconClasses: "text-red-500" })
		await loadApprovals()
	} catch (e) { _errToast(e, "Failed to reject advance"); adv._processing = null }
}
</script>

<style scoped>
.approval-card {
	padding: 1rem;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.approval-card:active {
	transform: scale(0.98);
}

.approve-btn {
	flex: 1;
	background: linear-gradient(to right, #22c55e, #16a34a);
	color: white;
	border-radius: 0.75rem;
	padding: 0.625rem 0;
	font-size: 0.75rem;
	font-weight: 700;
	box-shadow: 0 1px 2px rgba(34, 197, 94, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	transition: all 0.15s ease;
}

.approve-btn:disabled {
	opacity: 0.5;
}

.approve-btn:active {
	box-shadow: none;
	background: linear-gradient(to right, #16a34a, #15803d);
}

.reject-btn {
	flex: 1;
	background: #fef2f2;
	color: #dc2626;
	border: 1px solid rgba(254, 202, 202, 0.5);
	border-radius: 0.75rem;
	padding: 0.625rem 0;
	font-size: 0.75rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	transition: all 0.15s ease;
}

.reject-btn:disabled {
	opacity: 0.5;
}

.reject-btn:active {
	background: #fee2e2;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 0;
}

.empty-icon {
	width: 4rem;
	height: 4rem;
	border-radius: 9999px;
	background: #f9fafb;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 1rem;
}

.reject-modal-glass {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.95) 100%);
	backdrop-filter: blur(40px) saturate(180%);
	-webkit-backdrop-filter: blur(40px) saturate(180%);
}

.scrollbar-hide {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
	display: none;
}
</style>
