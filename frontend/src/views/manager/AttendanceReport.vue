<template>
	<BaseLayout :pageTitle="__('Attendance Report')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-2 gap-2">
				<!-- Quick Date Presets -->
				<div class="flex gap-1 overflow-x-auto no-scrollbar">
					<button v-for="p in datePresets" :key="p.key" @click="applyPreset(p)"
						class="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
						:class="activePreset === p.key ? 'bg-icd-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'">
						{{ p.label }}
					</button>
				</div>

				<!-- Filters Card -->
				<div class="card-premium p-1.5">
					<div class="flex items-center gap-1.5 mb-1">
						<FeatherIcon name="filter" class="w-3 h-3 text-icd-600" />
						<span class="text-[10px] font-bold text-gray-700">{{ __('Filters') }}</span>
						<button @click="clearFilters" class="ml-auto text-[10px] font-semibold text-gray-500 active:text-gray-800">
							{{ __('Clear') }}
						</button>
						<button @click="loadReport" class="text-[10px] font-bold bg-icd-600 text-white px-2 py-0.5 rounded-md active:scale-95 transition-transform">
							{{ __('Search') }}
						</button>
					</div>
					<!-- Date Row -->
					<div class="grid grid-cols-2 gap-1">
						<div>
							<input type="date" v-model="filters.from_date" class="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white" />
						</div>
						<div>
							<input type="date" v-model="filters.to_date" class="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white" />
						</div>
					</div>
					<!-- Employee Search -->
					<div class="mt-1 relative">
						<div class="relative">
							<input type="text" v-model="employeeSearch" :placeholder="__('Search employee...')"
								class="w-full text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white pr-6" />
							<FeatherIcon v-if="employeeSearch" name="x" class="w-3 h-3 text-gray-500 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
								@click="employeeSearch = ''; filters.employee = ''" />
						</div>
						<div v-if="employeeSuggestions.length > 0 && employeeSearch && !filters.employee" class="absolute left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-28 overflow-y-auto z-10">
							<button v-for="emp in employeeSuggestions" :key="emp.name"
								@click="selectEmployee(emp)"
								class="w-full text-left px-2 py-1 text-[11px] text-gray-800 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0">
								<span class="font-bold">{{ emp.employee_name }}</span>
								<span class="text-gray-500 ml-1 text-[9px]">{{ (emp.department || '').replace(/ - I$/, '') }}</span>
							</button>
						</div>
						<div v-if="filters.employee" class="mt-0.5 flex items-center gap-1">
							<span class="text-[10px] font-bold text-icd-700 bg-icd-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
								{{ employeeSearch }}
								<FeatherIcon name="x" class="w-2.5 h-2.5 cursor-pointer" @click="filters.employee = ''; employeeSearch = ''" />
							</span>
						</div>
					</div>
					<!-- Department + Shift + Status Row -->
					<div class="grid grid-cols-3 gap-1 mt-1">
						<select v-model="filters.department" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Depts') }}</option>
							<option v-for="d in departmentList" :key="d" :value="d">{{ d.replace(/ - I$/, '') }}</option>
						</select>
						<select v-model="filters.shift" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Shifts') }}</option>
							<option v-for="s in shiftList" :key="s" :value="s">{{ s }}</option>
						</select>
						<select v-model="filters.status" class="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700">
							<option value="">{{ __('All Status') }}</option>
							<option value="Valid">{{ __('Valid') }}</option>
							<option value="Suspicious">{{ __('Suspicious') }}</option>
							<option value="Rejected">{{ __('Rejected') }}</option>
						</select>
					</div>
				</div>

				<!-- Summary + Export -->
				<div v-if="summary" class="flex items-center gap-1.5">
					<div class="flex items-center gap-2 flex-1">
						<span class="text-xs font-bold text-gray-800">{{ summary.total }}</span>
						<span class="text-[10px] text-gray-500">total</span>
						<span class="text-xs font-bold text-emerald-600">{{ summary.valid }}</span>
						<span class="text-[10px] text-gray-500">valid</span>
						<span class="text-xs font-bold text-amber-600">{{ summary.late_count || 0 }}</span>
						<span class="text-[10px] text-gray-500">late</span>
					</div>
					<button @click="exportExcel" class="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded active:bg-green-100">
						<FeatherIcon name="download" class="w-2.5 h-2.5" /> XLSX
					</button>
					<button @click="exportPDF" class="flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded active:bg-red-100">
						<FeatherIcon name="printer" class="w-2.5 h-2.5" /> PDF
					</button>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10 gap-2">
					<div class="w-5 h-5 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">{{ __('Loading...') }}</span>
				</div>

				<!-- Records -->
				<div v-else-if="records.length > 0" class="flex flex-col gap-1.5">
					<div
						v-for="(rec, idx) in records"
						:key="idx"
						@click="openRptDetail(rec)"
						class="card-premium overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
					>
						<!-- Record Header -->
						<div class="p-2">
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" :style="{ backgroundColor: statusColor(rec.status) }">
									{{ rec.employee_name?.[0] || '?' }}
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-bold text-gray-900 truncate">{{ rec.employee_name }}</div>
									<div class="flex items-center gap-1">
										<span class="text-[10px] text-gray-500">{{ fmtDate(rec.date) }}</span>
										<span v-if="rec.department" class="text-[10px] text-gray-500">&middot; {{ rec.department }}</span>
									</div>
								</div>
								<div class="flex flex-col items-end gap-0.5">
									<span class="text-[9px] font-bold px-1 py-0.5 rounded" :class="statusBadge(rec.status)">{{ rec.status }}</span>
									<div v-if="rec.check_in" class="flex items-center gap-0.5">
										<span class="text-[9px] font-semibold text-emerald-600">IN</span>
										<span class="text-[10px] font-bold text-emerald-700">{{ fmtTime(rec.check_in) }}</span>
									</div>
									<div v-if="rec.check_out" class="flex items-center gap-0.5">
										<span class="text-[9px] font-semibold text-red-500">OUT</span>
										<span class="text-[10px] font-bold text-red-600">{{ fmtTime(rec.check_out) }}</span>
									</div>
								</div>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
							</div>

							<!-- Quick indicators -->
							<div class="flex items-center gap-1 mt-1 pt-1 border-t border-gray-50 flex-wrap">
								<span v-if="rec.hours" class="text-[9px] font-bold text-gray-600 bg-gray-100 px-1 py-0.5 rounded">{{ rec.hours }}h</span>
								<span v-if="rec.shift" class="text-[9px] text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{{ rec.shift }}</span>
								<span class="text-[9px]" :class="rec.geofence ? 'text-emerald-500' : 'text-red-400'">&#9679; {{ rec.geofence ? 'Geo' : 'NoGeo' }}</span>
								<span v-if="rec.face_ok" class="text-[9px] text-emerald-500">&#10003; Face</span>
								<span v-if="rec.wifi && rec.wifi_ok === 1" class="text-[9px] text-emerald-500">&#10003; WiFi</span>
								<span v-if="rec.late_entry" class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">LATE {{ rec.late_minutes ? rec.late_minutes + 'm' : '' }}</span>
								<span v-if="rec.early_exit" class="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">EARLY</span>
								<span v-if="rec.penalty_type" class="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
									&#9888; {{ rec.deduction_days }}d
									<template v-if="rec.excuse_status === 'Approved'"> &#10003;</template>
									<template v-else-if="rec.excuse_status === 'Pending'"> &#8987;</template>
								</span>
								<span v-if="rec.fraud > 0" class="text-[9px] font-bold text-red-600 ml-auto">Fraud:{{ rec.fraud }}</span>
								<span v-if="rec.mock_gps" class="text-[9px] font-bold text-red-600">MOCK</span>
							</div>
						</div>

						<!-- Expanded Detail -->
						<div v-if="expandedIdx === idx" class="bg-gray-50 p-2.5 border-t border-gray-100">
							<div class="grid grid-cols-2 gap-1.5">
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Location') }}</div>
									<div class="text-xs font-semibold text-gray-700 mt-0.5">{{ rec.location || '-' }}</div>
								</div>
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Distance') }}</div>
									<div class="text-xs font-semibold mt-0.5" :class="distanceClass(rec.distance)">{{ rec.distance != null ? Math.round(rec.distance) + 'm' : '-' }}</div>
								</div>
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">WiFi</div>
									<div class="text-xs font-semibold mt-0.5" :class="rec.wifi_ok === 1 ? 'text-emerald-600' : 'text-gray-700'">
										{{ rec.wifi ? rec.wifi : 'N/A' }}
										<template v-if="rec.wifi_ok === 1"> &#10003;</template>
									</div>
								</div>
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Face') }}</div>
									<div class="text-xs font-semibold mt-0.5" :class="rec.face_ok ? 'text-emerald-600' : 'text-gray-700'">{{ rec.face_ok ? 'Verified' : 'No' }} {{ rec.face_pct ? '(' + Math.round(rec.face_pct) + '%)' : '' }}</div>
								</div>
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Geofence') }}</div>
									<div class="text-xs font-semibold mt-0.5" :class="rec.geofence ? 'text-emerald-600' : 'text-red-500'">{{ rec.geofence ? 'Inside' : 'Outside' }}</div>
								</div>
								<div class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Device') }}</div>
									<div class="text-xs font-semibold text-gray-700 mt-0.5 truncate">{{ rec.device || '-' }}</div>
								</div>
								<!-- Penalty Detail -->
								<div v-if="rec.late_entry || rec.penalty_type" class="col-span-2 bg-amber-50 rounded px-2 py-1.5">
									<div class="text-[10px] text-amber-700 font-medium">{{ __('Penalty') }}</div>
									<div class="flex items-center gap-2 mt-0.5">
										<span v-if="rec.late_minutes" class="text-xs font-semibold text-amber-700">Late {{ rec.late_minutes }}min</span>
										<span v-if="rec.early_minutes" class="text-xs font-semibold text-orange-700">Early {{ rec.early_minutes }}min</span>
										<span v-if="rec.deduction_days" class="text-xs font-bold text-red-600">-{{ rec.deduction_days }} day(s)</span>
										<span v-if="rec.excuse_status" class="text-[10px] font-bold px-1 py-0.5 rounded ml-auto"
											:class="rec.excuse_status === 'Approved' ? 'bg-green-100 text-green-700' : rec.excuse_status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
											{{ rec.excuse_status }}
										</span>
									</div>
								</div>
								<div v-if="rec.auto_co" class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Auto Checkout') }}</div>
									<div class="text-xs font-semibold text-purple-600 mt-0.5">Yes</div>
								</div>
								<div v-if="rec.fraud > 0" class="bg-white rounded px-2 py-1.5">
									<div class="text-[10px] text-gray-700 font-medium">{{ __('Fraud Score') }}</div>
									<div class="text-xs font-bold text-red-600 mt-0.5">{{ rec.fraud }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty state -->
				<div v-else-if="!isLoading && hasSearched" class="flex flex-col items-center justify-center py-10">
					<FeatherIcon name="inbox" class="w-10 h-10 text-gray-300 mb-2" />
					<span class="text-sm text-gray-700">{{ __('No records found') }}</span>
				</div>

				<div class="h-4"></div>

			<!-- ========== EMPLOYEE DETAIL POPUP ========== -->
			<Teleport to="body">
			<Transition name="sheet">
				<div v-if="rptDetailOpen" class="sheet-overlay" @click.self="rptDetailOpen = false">
					<div class="sheet-panel">
						<div class="flex justify-center pt-2 pb-1">
							<div class="w-9 h-[5px] rounded-full bg-black/15"></div>
						</div>
						<!-- Header -->
						<div class="px-4 py-3 flex items-center gap-3" :style="{ background: statusColor(rptSelectedRec?.status) }">
							<div class="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
								{{ rptSelectedRec?.employee_name?.[0] || '?' }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-lg font-bold text-white truncate">{{ rptSelectedRec?.employee_name }}</div>
								<div class="text-[13px] text-white/70">{{ (rptSelectedRec?.department || '').replace(/ - I$/, '') }} &middot; {{ fmtDate(rptSelectedRec?.date) }}</div>
							</div>
							<button @click="rptDetailOpen = false" class="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white">
								<FeatherIcon name="x" class="w-4 h-4" />
							</button>
						</div>
						<!-- Body -->
						<div class="p-4 flex-1 overflow-y-auto space-y-3" style="background: #f3f4f6">
							<!-- Attendance Summary -->
							<div class="bg-white rounded-xl p-3.5 shadow-sm">
								<div class="flex items-center gap-2 mb-3">
									<FeatherIcon name="activity" class="w-4 h-4 text-icd-600" />
									<span class="text-sm font-bold text-gray-900">Attendance</span>
									<span class="ml-auto text-[13px] font-bold px-2 py-0.5 rounded-full" :class="statusBadge(rptSelectedRec?.status)">{{ rptSelectedRec?.status }}</span>
								</div>
								<div class="grid grid-cols-3 gap-3">
									<div class="text-center">
										<div class="text-[12px] text-gray-800 font-medium">Check In</div>
										<div class="text-lg font-extrabold text-emerald-600 mt-1">{{ rptSelectedRec?.check_in ? fmtTime(rptSelectedRec.check_in) : '--:--' }}</div>
									</div>
									<div class="text-center">
										<div class="text-[12px] text-gray-800 font-medium">Check Out</div>
										<div class="text-lg font-extrabold mt-1" :class="rptSelectedRec?.check_out ? 'text-red-600' : 'text-gray-600'">{{ rptSelectedRec?.check_out ? fmtTime(rptSelectedRec.check_out) : '--:--' }}</div>
									</div>
									<div class="text-center">
										<div class="text-[12px] text-gray-800 font-medium">Hours</div>
										<div class="text-lg font-bold text-gray-800 mt-1">{{ rptSelectedRec?.hours ? rptSelectedRec.hours + 'h' : '--' }}</div>
									</div>
								</div>
								<!-- Late/Early/Penalty -->
								<div v-if="rptSelectedRec?.late_entry" class="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
									<FeatherIcon name="alert-circle" class="w-3.5 h-3.5 text-amber-500" />
									<span class="text-[13px] font-bold text-amber-700">Late {{ rptSelectedRec.late_minutes ? rptSelectedRec.late_minutes + 'min' : '' }}</span>
									<span v-if="rptSelectedRec.deduction_days" class="text-[13px] font-bold text-red-600 ml-auto">-{{ rptSelectedRec.deduction_days }} day(s)</span>
								</div>
								<div v-if="rptSelectedRec?.early_exit" class="mt-2 flex items-center gap-2">
									<FeatherIcon name="log-out" class="w-3.5 h-3.5 text-orange-500" />
									<span class="text-[13px] font-bold text-orange-700">Early Exit {{ rptSelectedRec.early_minutes ? rptSelectedRec.early_minutes + 'min' : '' }}</span>
								</div>
								<div v-if="rptSelectedRec?.excuse_status" class="mt-2 flex items-center gap-2">
									<FeatherIcon name="file-text" class="w-3.5 h-3.5 text-blue-500" />
									<span class="text-[13px] font-bold" :class="rptSelectedRec.excuse_status === 'Approved' ? 'text-green-700' : rptSelectedRec.excuse_status === 'Pending' ? 'text-yellow-700' : 'text-red-700'">Excuse: {{ rptSelectedRec.excuse_status }}</span>
								</div>
							</div>

							<!-- Employee Info -->
							<div class="bg-white rounded-xl p-3.5 shadow-sm">
								<div class="flex items-center gap-2 mb-2">
									<FeatherIcon name="user" class="w-4 h-4 text-gray-800" />
									<span class="text-sm font-bold text-gray-900">Employee</span>
								</div>
								<div class="grid grid-cols-2 gap-2">
									<div class="bg-gray-50 rounded-lg px-2.5 py-2">
										<div class="text-[12px] text-gray-800">Department</div>
										<div class="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{{ rptSelectedRec?.department || '-' }}</div>
									</div>
									<div class="bg-gray-50 rounded-lg px-2.5 py-2">
										<div class="text-[12px] text-gray-800">Shift</div>
										<div class="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{{ rptSelectedRec?.shift || '-' }}</div>
									</div>
								</div>
							</div>

							<!-- Deep Detail Loading -->
							<div v-if="rptDetailLoading" class="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center gap-2">
								<div class="w-4 h-4 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
								<span class="text-[13px] text-gray-800">Loading details...</span>
							</div>

							<template v-else-if="rptDetailData">
								<!-- CHECK-IN DETAILS -->
								<template v-if="rptDetailData.checkin">
									<div v-if="rptDetailData.checkin.selfie_photo" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="camera" class="w-4 h-4 text-gray-800" /><span class="text-sm font-bold text-gray-900">Check-In Selfie</span></div>
										<img :src="rptDetailData.checkin.selfie_photo" class="w-full rounded-lg max-h-40 object-cover" />
									</div>
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="map-pin" class="w-4 h-4 text-blue-600" />
											<span class="text-sm font-bold text-gray-900">Check-In Location</span>
											<span v-if="rptDetailData.checkin.is_within_geofence" class="ml-auto text-[11px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">IN ZONE</span>
											<span v-else class="ml-auto text-[11px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">OUT OF ZONE</span>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<div v-if="rptDetailData.checkin.location_name" class="bg-gray-50 rounded-lg px-2.5 py-2 col-span-2"><div class="text-[12px] text-gray-800">Location</div><div class="text-[13px] font-semibold text-gray-900 mt-0.5">{{ rptDetailData.checkin.location_name }}</div></div>
											<div v-if="rptDetailData.checkin.distance_from_office != null" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">Distance</div><div class="text-[13px] font-semibold mt-0.5" :class="rptDetailData.checkin.distance_from_office <= 100 ? 'text-emerald-600' : rptDetailData.checkin.distance_from_office <= 500 ? 'text-amber-600' : 'text-red-600'">{{ Math.round(rptDetailData.checkin.distance_from_office) }}m</div></div>
											<div v-if="rptDetailData.checkin.latitude" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">GPS</div><div class="text-[12px] font-mono text-gray-700 mt-0.5">{{ Number(rptDetailData.checkin.latitude).toFixed(4) }}, {{ Number(rptDetailData.checkin.longitude).toFixed(4) }}</div></div>
										</div>
									</div>
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="shield" class="w-4 h-4 text-indigo-600" /><span class="text-sm font-bold text-gray-900">Check-In Verification</span></div>
										<div class="grid grid-cols-3 gap-2">
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">WiFi</div><div class="text-lg mt-0.5" :class="rptDetailData.checkin.wifi_ssid ? (rptDetailData.checkin.wifi_matched ? 'text-emerald-500' : 'text-red-400') : 'text-gray-600'">{{ rptDetailData.checkin.wifi_ssid ? (rptDetailData.checkin.wifi_matched ? '&#10003;' : '&#10007;') : '&mdash;' }}</div><div class="text-[11px] font-semibold mt-0.5 truncate" :class="rptDetailData.checkin.wifi_ssid ? 'text-emerald-600' : 'text-gray-600'">{{ rptDetailData.checkin.wifi_ssid || 'N/A' }}</div></div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">Face</div><div class="text-lg mt-0.5" :class="rptDetailData.checkin.face_verified ? 'text-emerald-500' : 'text-red-400'">{{ rptDetailData.checkin.face_verified ? '&#10003;' : '&#10007;' }}</div><div class="text-[11px] font-semibold mt-0.5" :class="rptDetailData.checkin.face_verified ? 'text-emerald-600' : 'text-red-500'">{{ rptDetailData.checkin.face_confidence ? Math.round(rptDetailData.checkin.face_confidence) + '%' : '-' }}</div></div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">Geofence</div><div class="text-lg mt-0.5" :class="rptDetailData.checkin.is_within_geofence ? 'text-emerald-500' : 'text-red-400'">{{ rptDetailData.checkin.is_within_geofence ? '&#10003;' : '&#10007;' }}</div><div class="text-[11px] font-semibold mt-0.5" :class="rptDetailData.checkin.is_within_geofence ? 'text-emerald-600' : 'text-red-500'">{{ rptDetailData.checkin.is_within_geofence ? 'Inside' : 'Outside' }}</div></div>
										</div>
									</div>
								</template>

								<!-- CHECK-OUT DETAILS -->
								<template v-if="rptDetailData.checkout">
									<div v-if="rptDetailData.checkout.selfie_photo" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="camera" class="w-4 h-4 text-red-500" /><span class="text-sm font-bold text-gray-900">Check-Out Selfie</span></div>
										<img :src="rptDetailData.checkout.selfie_photo" class="w-full rounded-lg max-h-40 object-cover" />
									</div>
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="map-pin" class="w-4 h-4 text-red-500" />
											<span class="text-sm font-bold text-gray-900">Check-Out Location</span>
											<span v-if="rptDetailData.checkout.is_within_geofence" class="ml-auto text-[11px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">IN ZONE</span>
											<span v-else class="ml-auto text-[11px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">OUT OF ZONE</span>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<div v-if="rptDetailData.checkout.location_name" class="bg-gray-50 rounded-lg px-2.5 py-2 col-span-2"><div class="text-[12px] text-gray-800">Location</div><div class="text-[13px] font-semibold text-gray-900 mt-0.5">{{ rptDetailData.checkout.location_name }}</div></div>
											<div v-if="rptDetailData.checkout.distance_from_office != null" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">Distance</div><div class="text-[13px] font-semibold mt-0.5" :class="rptDetailData.checkout.distance_from_office <= 100 ? 'text-emerald-600' : rptDetailData.checkout.distance_from_office <= 500 ? 'text-amber-600' : 'text-red-600'">{{ Math.round(rptDetailData.checkout.distance_from_office) }}m</div></div>
											<div v-if="rptDetailData.checkout.latitude" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">GPS</div><div class="text-[12px] font-mono text-gray-700 mt-0.5">{{ Number(rptDetailData.checkout.latitude).toFixed(4) }}, {{ Number(rptDetailData.checkout.longitude).toFixed(4) }}</div></div>
										</div>
									</div>
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="shield" class="w-4 h-4 text-red-500" /><span class="text-sm font-bold text-gray-900">Check-Out Verification</span></div>
										<div class="grid grid-cols-3 gap-2">
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">WiFi</div><div class="text-lg mt-0.5" :class="rptDetailData.checkout.wifi_ssid ? (rptDetailData.checkout.wifi_matched ? 'text-emerald-500' : 'text-red-400') : 'text-gray-600'">{{ rptDetailData.checkout.wifi_ssid ? (rptDetailData.checkout.wifi_matched ? '&#10003;' : '&#10007;') : '&mdash;' }}</div><div class="text-[11px] font-semibold mt-0.5 truncate" :class="rptDetailData.checkout.wifi_ssid ? 'text-emerald-600' : 'text-gray-600'">{{ rptDetailData.checkout.wifi_ssid || 'N/A' }}</div></div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">Face</div><div class="text-lg mt-0.5" :class="rptDetailData.checkout.face_verified ? 'text-emerald-500' : 'text-red-400'">{{ rptDetailData.checkout.face_verified ? '&#10003;' : '&#10007;' }}</div><div class="text-[11px] font-semibold mt-0.5" :class="rptDetailData.checkout.face_verified ? 'text-emerald-600' : 'text-red-500'">{{ rptDetailData.checkout.face_confidence ? Math.round(rptDetailData.checkout.face_confidence) + '%' : '-' }}</div></div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center"><div class="text-[12px] text-gray-800">Geofence</div><div class="text-lg mt-0.5" :class="rptDetailData.checkout.is_within_geofence ? 'text-emerald-500' : 'text-red-400'">{{ rptDetailData.checkout.is_within_geofence ? '&#10003;' : '&#10007;' }}</div><div class="text-[11px] font-semibold mt-0.5" :class="rptDetailData.checkout.is_within_geofence ? 'text-emerald-600' : 'text-red-500'">{{ rptDetailData.checkout.is_within_geofence ? 'Inside' : 'Outside' }}</div></div>
										</div>
									</div>
								</template>

								<!-- DEVICE & ANTI-FRAUD -->
								<template v-if="rptDetailData.checkin || rptDetailData.checkout">
									<div v-if="(rptDetailData.checkin || rptDetailData.checkout).device_model" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="smartphone" class="w-4 h-4 text-gray-800" /><span class="text-sm font-bold text-gray-900">Device</span></div>
										<div class="grid grid-cols-2 gap-2">
											<div class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">Model</div><div class="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{{ (rptDetailData.checkin || rptDetailData.checkout).device_model }}</div></div>
											<div v-if="(rptDetailData.checkin || rptDetailData.checkout).os_version" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">OS</div><div class="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{{ (rptDetailData.checkin || rptDetailData.checkout).os_version }}</div></div>
											<div v-if="(rptDetailData.checkin || rptDetailData.checkout).app_version" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">App Ver</div><div class="text-[13px] font-semibold text-gray-900 mt-0.5">{{ (rptDetailData.checkin || rptDetailData.checkout).app_version }}</div></div>
											<div v-if="(rptDetailData.checkin || rptDetailData.checkout).ip_address" class="bg-gray-50 rounded-lg px-2.5 py-2"><div class="text-[12px] text-gray-800">IP</div><div class="text-[12px] font-mono text-gray-700 mt-0.5">{{ (rptDetailData.checkin || rptDetailData.checkout).ip_address }}</div></div>
										</div>
									</div>
									<div v-if="rptHasAntiFraud" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="alert-triangle" class="w-4 h-4 text-red-600" /><span class="text-sm font-bold text-red-700">Anti-Fraud</span></div>
										<div class="flex gap-2 flex-wrap">
											<template v-for="log in [rptDetailData.checkin, rptDetailData.checkout].filter(Boolean)" :key="log.name">
												<span class="text-[11px] font-bold bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">{{ log.log_type === 'Check-in' ? 'IN' : 'OUT' }}</span>
												<span v-if="log.fraud_score > 0" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Fraud: {{ log.fraud_score }}</span>
												<span v-if="log.is_mock_location" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">MOCK GPS</span>
												<span v-if="log.is_vpn" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">VPN</span>
												<span v-if="log.is_developer_mode" class="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Dev Mode</span>
											</template>
										</div>
									</div>
									<div v-if="rptDetailData.all_logs?.length > 2" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2"><FeatherIcon name="list" class="w-4 h-4 text-gray-800" /><span class="text-sm font-bold text-gray-900">All Logs ({{ rptDetailData.all_logs.length }})</span></div>
										<div class="space-y-1.5">
											<div v-for="log in rptDetailData.all_logs" :key="log.name" class="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
												<span class="text-[12px] font-bold px-1.5 py-0.5 rounded" :class="log.log_type === 'Check-in' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ log.log_type === 'Check-in' ? 'IN' : 'OUT' }}</span>
												<span class="text-[13px] font-semibold text-gray-900">{{ fmtTime(log.timestamp) }}</span>
												<span v-if="log.location_name" class="text-[11px] text-gray-700 truncate ml-auto">{{ log.location_name }}</span>
											</div>
										</div>
									</div>
								</template>
							</template>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, watch } from "vue"
import { FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import { useReportExport } from "@/composables/useReportExport"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"
const { exportExcel: doExportExcel, exportPDF: doExportPDF } = useReportExport()

const isLoading = ref(false)
const hasSearched = ref(false)
const records = ref([])
const summary = ref(null)
const expandedIdx = ref(null)
const departmentList = ref([])
const shiftList = ref([])
const employeeSearch = ref("")
const employeeSuggestions = ref([])
const activePreset = ref("today")
let searchTimer = null
// Detail popup state
const rptDetailOpen = ref(false)
const rptSelectedRec = ref(null)
const rptDetailLoading = ref(false)
const rptDetailData = ref(null)
const rptHasAntiFraud = computed(() => {
	if (!rptDetailData.value) return false
	const logs = [rptDetailData.value.checkin, rptDetailData.value.checkout].filter(Boolean)
	return logs.some(l => l.fraud_score > 0 || l.is_mock_location || l.is_vpn || l.is_developer_mode)
})

async function openRptDetail(rec) {
	rptSelectedRec.value = rec
	rptDetailData.value = null
	rptDetailOpen.value = true
	rptDetailLoading.value = true
	try {
		const data = await call(`${API}.get_employee_attendance_detail`, {
			employee: rec.employee,
			date: rec.date,
		})
		rptDetailData.value = data
	} catch (e) {
		console.error("Detail API error:", e)
		toast({ title: __("Failed to get details"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		rptDetailLoading.value = false
	}
}


const filters = reactive({
	from_date: dayjs().format("YYYY-MM-DD"),
	to_date: dayjs().format("YYYY-MM-DD"),
	department: "",
	shift: "",
	status: "",
	employee: "",
})

const datePresets = [
	{ key: "today", label: "Today" },
	{ key: "yesterday", label: "Yesterday" },
	{ key: "week", label: "This Week" },
	{ key: "month", label: "This Month" },
	{ key: "lastmonth", label: "Last Month" },
	{ key: "custom", label: "Custom" },
]

function applyPreset(p) {
	activePreset.value = p.key
	const now = dayjs()
	switch (p.key) {
		case "today":
			filters.from_date = now.format("YYYY-MM-DD")
			filters.to_date = now.format("YYYY-MM-DD")
			break
		case "yesterday":
			filters.from_date = now.subtract(1, "day").format("YYYY-MM-DD")
			filters.to_date = now.subtract(1, "day").format("YYYY-MM-DD")
			break
		case "week":
			filters.from_date = now.startOf("week").format("YYYY-MM-DD")
			filters.to_date = now.format("YYYY-MM-DD")
			break
		case "month":
			filters.from_date = now.startOf("month").format("YYYY-MM-DD")
			filters.to_date = now.format("YYYY-MM-DD")
			break
		case "lastmonth":
			filters.from_date = now.subtract(1, "month").startOf("month").format("YYYY-MM-DD")
			filters.to_date = now.subtract(1, "month").endOf("month").format("YYYY-MM-DD")
			break
		case "custom":
			return
	}
	loadReport()
}

function clearFilters() {
	filters.department = ""
	filters.shift = ""
	filters.status = ""
	filters.employee = ""
	employeeSearch.value = ""
	activePreset.value = "today"
	filters.from_date = dayjs().format("YYYY-MM-DD")
	filters.to_date = dayjs().format("YYYY-MM-DD")
	loadReport()
}

function selectEmployee(emp) {
	filters.employee = emp.name
	employeeSearch.value = emp.employee_name
	employeeSuggestions.value = []
	loadReport()
}

watch(employeeSearch, (val) => {
	if (searchTimer) clearTimeout(searchTimer)
	if (!val || val.length < 2) {
		employeeSuggestions.value = []
		if (!val) filters.employee = ""
		return
	}
	if (filters.employee) return
	searchTimer = setTimeout(async () => {
		try {
			const emps = await call(`${API}.manager_get_list`, {
				doctype: "Employee",
				filters: { status: "Active", employee_name: ["like", `%${val}%`] },
				fields: ["name", "employee_name", "department"],
				limit_page_length: 5,
			})
			employeeSuggestions.value = emps || []
		} catch (e) { employeeSuggestions.value = [] }
	}, 300)
})

function toggleExpand(idx) {
	expandedIdx.value = expandedIdx.value === idx ? null : idx
}

function statusColor(s) {
	return { Valid: '#10b981', Suspicious: '#f59e0b', Rejected: '#ef4444', 'Pending Review': '#6b7280' }[s] || '#9ca3af'
}

function statusBadge(s) {
	return {
		Valid: 'bg-emerald-50 text-emerald-700',
		Suspicious: 'bg-amber-50 text-amber-700',
		Rejected: 'bg-red-50 text-red-700',
		'Pending Review': 'bg-gray-100 text-gray-700',
	}[s] || 'bg-gray-100 text-gray-700'
}

function distanceClass(d) {
	if (d == null) return 'text-gray-700'
	if (d <= 100) return 'text-emerald-600'
	if (d <= 500) return 'text-amber-600'
	return 'text-red-600'
}

function fmtTime(ts) {
	if (!ts) return '--:--'
	const d = dayjs(ts)
	return d.isValid() ? d.format('h:mm A') : '--:--'
}

function fmtDate(d) {
	if (!d) return ''
	const dt = dayjs(d)
	return dt.isValid() ? dt.format('ddd, D MMM') : d
}

// ============ EXPORT ============

const exportColumns = [
	{ label: "#", field: (r, i) => i + 1 },
	{ label: "Date", field: (r) => fmtDate(r.date) },
	{ label: "Employee", field: "employee_name" },
	{ label: "Department", field: (r) => (r.department || "").replace(/ - I$/, "") },
	{ label: "Shift", field: (r) => r.shift || "-" },
	{ label: "Check In", field: (r) => r.check_in ? fmtTime(r.check_in) : "-" },
	{ label: "Check Out", field: (r) => r.check_out ? fmtTime(r.check_out) : "-" },
	{ label: "Hours", field: (r) => r.hours || "-" },
	{ label: "Status", field: "status" },
	{ label: "Geo", field: (r) => r.geofence ? "Yes" : "No" },
	{ label: "Face", field: (r) => r.face_ok ? "Yes" : "-" },
	{ label: "WiFi", field: (r) => r.wifi ? (r.wifi_ok === 1 ? "Yes" : "No") : "N/A" },
	{ label: "Penalty", field: (r) => r.late_entry ? `Late${r.late_minutes ? " " + r.late_minutes + "m" : ""}${r.deduction_days ? " -" + r.deduction_days + "d" : ""}${r.excuse_status ? " (" + r.excuse_status + ")" : ""}` : "-" },
	{ label: "Location", field: (r) => r.location || "-" },
	{ label: "Device", field: (r) => r.device || "-" },
]

function getExportPayload() {
	const dept = filters.department ? filters.department.replace(/ - I$/, "") : "All Departments"
	return {
		title: "Attendance Report",
		dateRange: `${filters.from_date} to ${filters.to_date}`,
		department: dept + (filters.shift ? ` | ${filters.shift}` : ""),
		summaryCards: [
			{ label: "Total", value: summary.value?.total || 0 },
			{ label: "Valid", value: summary.value?.valid || 0 },
			{ label: "Suspicious", value: summary.value?.suspicious || 0 },
			{ label: "Rejected", value: summary.value?.rejected || 0 },
			{ label: "Late", value: summary.value?.late_count || 0 },
			{ label: "Penalties", value: summary.value?.penalties || 0 },
		],
		columns: exportColumns,
		rows: records.value,
	}
}

function exportExcel() { if (records.value.length) doExportExcel(getExportPayload()) }
function exportPDF() { if (records.value.length) doExportPDF(getExportPayload()) }

// ============ DATA LOADING ============

async function loadDepartments() {
	try {
		const deps = await call(`${API}.manager_get_list`, {
			doctype: "Department",
			filters: { is_group: 0 },
			fields: ["name"],
			limit_page_length: 0,
		})
		departmentList.value = (deps || []).map(d => d.name)
	} catch (e) {
		console.warn("Failed to load departments:", e)
	}
}

async function loadShifts() {
	try {
		const shifts = await call(`${API}.manager_get_list`, {
			doctype: "Shift Type",
			fields: ["name"],
			limit_page_length: 0,
		})
		shiftList.value = (shifts || []).map(s => s.name)
	} catch (e) {
		console.warn("Failed to load shifts:", e)
	}
}

async function loadReport() {
	isLoading.value = true
	hasSearched.value = true
	expandedIdx.value = null
	try {
		const data = await call(`${API}.get_attendance_report`, {
			from_date: filters.from_date,
			to_date: filters.to_date,
			department: filters.department || undefined,
			shift: filters.shift || undefined,
			status: filters.status || undefined,
			employee: filters.employee || undefined,
		})
		records.value = data?.records || []
		summary.value = data?.summary || null
	} catch (e) {
		toast({ title: __("Failed to load report"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		records.value = []
		summary.value = null
	} finally {
		isLoading.value = false
	}
}

onMounted(() => {
	loadDepartments()
	loadShifts()
	loadReport()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.sheet-overlay {
	position: fixed; inset: 0; z-index: 9999;
	background: rgba(0,0,0,0.4);
	display: flex; align-items: stretch; justify-content: center;
}
.sheet-panel {
	background: #f3f4f6;
	width: 100%; max-width: 480px;
	display: flex; flex-direction: column;
	overflow: hidden;
	padding-top: env(safe-area-inset-top, 0);
}
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s ease; }
.sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: transform 0.3s ease; }
.sheet-enter-from, .sheet-leave-to { background: rgba(0,0,0,0); }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel { transform: translateY(100%); }
</style>
