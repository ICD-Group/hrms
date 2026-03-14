<template>
	<ion-page>
		<div class="app-bg-ambient"></div>

		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Attendance") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Date Selector -->
					<div class="flex items-center gap-3 card-premium p-3">
						<button @click="changeDate(-1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200">
							<FeatherIcon name="chevron-left" class="w-4 text-gray-600" />
						</button>
						<div class="flex-1 text-center">
							<div class="text-sm font-bold text-gray-900">{{ dayjs(selectedDate).format("dddd") }}</div>
							<div class="text-xs text-gray-700">{{ dayjs(selectedDate).format("DD-MM-YYYY") }}</div>
						</div>
						<button @click="changeDate(1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200" :disabled="isToday">
							<FeatherIcon name="chevron-right" class="w-4 text-gray-600" :class="isToday ? 'opacity-30' : ''" />
						</button>
					</div>

					<!-- Summary -->
					<div class="grid grid-cols-4 gap-2">
						<div class="bg-green-50 rounded-xl p-3 text-center border border-green-100">
							<div class="text-lg font-bold text-green-700">{{ summary.present }}</div>
							<div class="text-[11px] text-green-600 font-medium">{{ __("Present") }}</div>
						</div>
						<div class="bg-red-50 rounded-xl p-3 text-center border border-red-100">
							<div class="text-lg font-bold text-red-700">{{ summary.absent }}</div>
							<div class="text-[11px] text-red-600 font-medium">{{ __("Absent") }}</div>
						</div>
						<div class="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
							<div class="text-lg font-bold text-orange-700">{{ summary.leave }}</div>
							<div class="text-[11px] text-orange-600 font-medium">{{ __("Leave") }}</div>
						</div>
						<div class="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
							<div class="text-lg font-bold text-blue-700">{{ summary.half_day }}</div>
							<div class="text-[11px] text-blue-600 font-medium">{{ __("Half Day") }}</div>
						</div>
					</div>

					<!-- Filter Tabs -->
					<div class="flex gap-2 overflow-x-auto pb-1">
						<button
							v-for="tab in statusTabs"
							:key="tab.value"
							@click="statusFilter = tab.value"
							class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
							:class="statusFilter === tab.value
								? 'bg-icd-600 text-white'
								: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
						>
							{{ tab.label }}
						</button>
					</div>

					<!-- Attendance List -->
					<ListSkeleton v-if="isLoading" :rows="6" />

					<div v-else-if="filteredAttendance.length === 0" class="text-center py-10 text-sm text-gray-700">
						{{ __("No attendance records for this date") }}
					</div>

					<div v-else class="flex flex-col gap-2">
						<button
							v-for="att in filteredAttendance"
							:key="att.name"
							@click="openDetail(att)"
							class="card-premium p-3 flex items-start gap-3 text-left active:scale-[0.98] transition-transform"
						>
							<div
								class="w-2 rounded-full self-stretch min-h-[48px]"
								:class="{
									'bg-green-500': att.status === 'Present',
									'bg-red-500': att.status === 'Absent',
									'bg-orange-500': att.status === 'On Leave',
									'bg-blue-500': att.status === 'Half Day',
									'bg-gray-300': !att.status,
								}"
							></div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-1.5 flex-wrap">
									<div class="text-sm font-semibold text-gray-900 truncate">{{ att.employee_name }}</div>
									<span v-if="att.late_entry" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">LATE</span>
									<span v-if="att.early_exit" class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">EARLY EXIT</span>
								</div>
								<div class="text-xs text-gray-700">{{ (att.department || "").replace(/ - I$/, '') }}</div>
								<!-- In/Out Times -->
								<div v-if="att.status === 'Present' || att.status === 'Half Day'" class="flex items-center gap-2 mt-1">
									<span v-if="att.in_time" class="inline-flex items-center gap-0.5 text-[13px] font-extrabold text-green-600">
										<span class="text-[9px]">IN</span> {{ formatTime(att.in_time) }}
									</span>
									<span v-if="att.out_time" class="inline-flex items-center gap-0.5 text-[13px] font-extrabold text-red-600">
										<span class="text-[9px]">OUT</span> {{ formatTime(att.out_time) }}
									</span>
									<span v-if="att.working_hours" class="text-[11px] text-gray-700 font-medium">
										{{ att.working_hours?.toFixed(1) }}h
									</span>
								</div>
								<!-- Verification Indicators -->
								<div v-if="(att.status === 'Present' || att.status === 'Half Day') && verificationData[att.employee]" class="flex flex-wrap gap-1 mt-1">
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold"
										:class="verificationData[att.employee].is_within_geofence ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
										<FeatherIcon :name="verificationData[att.employee].is_within_geofence ? 'check-circle' : 'x-circle'" class="w-2.5" />
										GPS
									</span>
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold"
										:class="verificationData[att.employee].face_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
										<FeatherIcon :name="verificationData[att.employee].face_verified ? 'check-circle' : 'minus-circle'" class="w-2.5" />
										Face
									</span>
									<span v-if="verificationData[att.employee].wifi_matched" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
										<FeatherIcon name="check-circle" class="w-2.5" />
										WiFi
									</span>
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold"
										:class="verificationData[att.employee].fraud_score === 0 ? 'bg-green-100 text-green-700' : verificationData[att.employee].fraud_score < 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
										<FeatherIcon name="shield" class="w-2.5" />
										{{ verificationData[att.employee].fraud_score === 0 ? 'Clean' : verificationData[att.employee].fraud_score + ' risk' }}
									</span>
									<span v-if="verificationData[att.employee].is_mock_location" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
										<FeatherIcon name="alert-triangle" class="w-2.5" />
										FAKE GPS
									</span>
								</div>
								<div v-else-if="att.status === 'Absent'" class="mt-1">
									<span class="text-[11px] text-red-400 italic">No check-in recorded</span>
								</div>
							</div>
							<div class="flex flex-col items-end gap-0.5 flex-shrink-0">
								<span
									class="text-[11px] font-bold px-2 py-0.5 rounded-full"
									:class="{
										'bg-green-100 text-green-700': att.status === 'Present',
										'bg-red-100 text-red-700': att.status === 'Absent',
										'bg-orange-100 text-orange-700': att.status === 'On Leave',
										'bg-blue-100 text-blue-700': att.status === 'Half Day',
									}"
								>
									{{ att.status }}
								</span>
								<FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-gray-700 mt-1" />
							</div>
						</button>
					</div>
				</div>
			</div>
		</ion-content>

		<!-- Employee Detail Bottom Sheet -->
		<Teleport to="body">
			<Transition name="sheet">
				<div v-if="detailOpen" class="sheet-overlay" @click.self="detailOpen = false">
					<div class="sheet-panel">
						<div class="flex justify-center pt-2 pb-1">
							<div class="w-9 h-[5px] rounded-full bg-black/15"></div>
						</div>
						<!-- Header -->
						<div class="px-4 py-3 flex items-center gap-3" :style="{ background: statusGrad(selectedAtt?.status) }">
							<div class="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
								{{ selectedAtt?.employee_name?.[0] || '?' }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-lg font-bold text-white truncate">{{ selectedAtt?.employee_name }}</div>
								<div class="text-[13px] text-white/70">{{ (selectedAtt?.department || '').replace(/ - I$/, '') }} &middot; {{ dayjs(selectedDate).format("DD-MM-YYYY") }}</div>
							</div>
							<button @click="detailOpen = false" class="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white">
								<FeatherIcon name="x" class="w-4 h-4" />
							</button>
						</div>
						<!-- Body -->
						<div class="p-4 flex-1 overflow-y-auto space-y-3" style="background: #f3f4f6">
							<!-- Attendance Status -->
							<div class="bg-white rounded-xl p-3.5 shadow-sm">
								<div class="flex items-center gap-2 mb-3">
									<FeatherIcon name="activity" class="w-4 h-4 text-icd-600" />
									<span class="text-sm font-bold text-gray-900">{{ __("Attendance") }}</span>
									<span class="ml-auto text-[13px] font-bold px-2 py-0.5 rounded-full"
										:class="{
											'bg-green-100 text-green-700': selectedAtt?.status === 'Present',
											'bg-red-100 text-red-700': selectedAtt?.status === 'Absent',
											'bg-orange-100 text-orange-700': selectedAtt?.status === 'On Leave',
											'bg-blue-100 text-blue-700': selectedAtt?.status === 'Half Day',
										}">{{ selectedAtt?.status }}</span>
								</div>
								<div class="grid grid-cols-3 gap-3">
									<div class="text-center">
										<div class="text-[12px] text-gray-900 font-medium">{{ __("Check In") }}</div>
										<div class="text-base font-extrabold text-emerald-600 mt-1">{{ formatTime(selectedAtt?.in_time) || '--:--' }}</div>
									</div>
									<div class="text-center">
										<div class="text-[12px] text-gray-900 font-medium">{{ __("Check Out") }}</div>
										<div class="text-base font-extrabold mt-1" :class="selectedAtt?.out_time ? 'text-red-600' : 'text-gray-900'">{{ selectedAtt?.out_time ? formatTime(selectedAtt.out_time) : '--:--' }}</div>
									</div>
									<div class="text-center">
										<div class="text-[12px] text-gray-900 font-medium">{{ __("Hours") }}</div>
										<div class="text-base font-bold text-gray-800 mt-1">{{ selectedAtt?.working_hours ? selectedAtt.working_hours.toFixed(1) + 'h' : '--' }}</div>
									</div>
								</div>
								<div v-if="selectedAtt?.late_entry" class="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
									<FeatherIcon name="alert-circle" class="w-3.5 h-3.5 text-amber-500" />
									<span class="text-[13px] font-bold text-amber-700">{{ __("Late Entry") }}</span>
								</div>
								<div v-if="selectedAtt?.early_exit" class="mt-2 flex items-center gap-2">
									<FeatherIcon name="log-out" class="w-3.5 h-3.5 text-purple-500" />
									<span class="text-[13px] font-bold text-purple-700">{{ __("Early Exit") }}</span>
								</div>
							</div>

							<!-- Detail Loading -->
							<div v-if="detailLoading" class="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center gap-2">
								<div class="w-4 h-4 border-2 border-gray-300 border-t-icd-600 rounded-full animate-spin"></div>
								<span class="text-[13px] text-gray-800">{{ __("Loading details...") }}</span>
							</div>

							<!-- Location Card -->
							<template v-else-if="detailData">
								<!-- ===== CHECK-IN DETAILS ===== -->
								<template v-if="detailData.checkin">
									<!-- Selfie Photo -->
									<div v-if="detailData.checkin.selfie_photo" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2.5">
											<FeatherIcon name="camera" class="w-4 h-4 text-gray-800" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-In Selfie") }}</span>
										</div>
										<img :src="detailData.checkin.selfie_photo" class="w-full rounded-lg max-h-40 object-cover" alt="Check-in selfie" />
									</div>

									<!-- Check-In Location -->
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="map-pin" class="w-4 h-4 text-blue-600" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-In Location") }}</span>
											<span v-if="detailData.checkin.is_within_geofence" class="ml-auto text-[11px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">IN ZONE</span>
											<span v-else class="ml-auto text-[11px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">OUT OF ZONE</span>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<div v-if="detailData.checkin.location_name" class="bg-gray-50 rounded-lg px-2.5 py-2 col-span-2">
												<div class="text-[12px] text-gray-900">{{ __("Location") }}</div>
												<div class="text-sm font-semibold text-gray-900 mt-0.5">{{ detailData.checkin.location_name }}</div>
											</div>
											<div v-if="detailData.checkin.distance_from_office != null" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">{{ __("Distance") }}</div>
												<div class="text-sm font-semibold mt-0.5" :class="detailData.checkin.distance_from_office <= 100 ? 'text-emerald-600' : detailData.checkin.distance_from_office <= 500 ? 'text-amber-600' : 'text-red-600'">{{ Math.round(detailData.checkin.distance_from_office) }}m</div>
											</div>
											<div v-if="detailData.checkin.latitude" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">GPS</div>
												<div class="text-[12px] font-mono text-gray-800 mt-0.5">{{ Number(detailData.checkin.latitude).toFixed(4) }}, {{ Number(detailData.checkin.longitude).toFixed(4) }}</div>
											</div>
										</div>
									</div>

									<!-- Check-In Verification -->
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="shield" class="w-4 h-4 text-indigo-600" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-In Verification") }}</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">WiFi</div>
												<div class="text-base mt-0.5" :class="detailData.checkin.wifi_ssid ? (detailData.checkin.wifi_matched ? 'text-emerald-500' : 'text-red-400') : 'text-gray-900'">{{ detailData.checkin.wifi_ssid ? (detailData.checkin.wifi_matched ? '&#10003;' : '&#10007;') : '&mdash;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5 truncate" :class="detailData.checkin.wifi_ssid ? 'text-emerald-600' : 'text-gray-900'">{{ detailData.checkin.wifi_ssid || 'N/A' }}</div>
											</div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">{{ __("Face") }}</div>
												<div class="text-base mt-0.5" :class="detailData.checkin.face_verified ? 'text-emerald-500' : 'text-red-400'">{{ detailData.checkin.face_verified ? '&#10003;' : '&#10007;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5" :class="detailData.checkin.face_verified ? 'text-emerald-600' : 'text-gray-900'">{{ detailData.checkin.face_confidence ? Math.round(detailData.checkin.face_confidence) + '%' : '-' }}</div>
											</div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">{{ __("Geofence") }}</div>
												<div class="text-base mt-0.5" :class="detailData.checkin.is_within_geofence ? 'text-emerald-500' : 'text-red-400'">{{ detailData.checkin.is_within_geofence ? '&#10003;' : '&#10007;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5" :class="detailData.checkin.is_within_geofence ? 'text-emerald-600' : 'text-red-500'">{{ detailData.checkin.is_within_geofence ? 'Inside' : 'Outside' }}</div>
											</div>
										</div>
									</div>
								</template>

								<!-- ===== CHECK-OUT DETAILS ===== -->
								<template v-if="detailData.checkout">
									<!-- Check-Out Selfie -->
									<div v-if="detailData.checkout.selfie_photo" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2.5">
											<FeatherIcon name="camera" class="w-4 h-4 text-red-500" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-Out Selfie") }}</span>
										</div>
										<img :src="detailData.checkout.selfie_photo" class="w-full rounded-lg max-h-40 object-cover" alt="Check-out selfie" />
									</div>

									<!-- Check-Out Location -->
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="map-pin" class="w-4 h-4 text-red-500" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-Out Location") }}</span>
											<span v-if="detailData.checkout.is_within_geofence" class="ml-auto text-[11px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">IN ZONE</span>
											<span v-else class="ml-auto text-[11px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">OUT OF ZONE</span>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<div v-if="detailData.checkout.location_name" class="bg-gray-50 rounded-lg px-2.5 py-2 col-span-2">
												<div class="text-[12px] text-gray-900">{{ __("Location") }}</div>
												<div class="text-sm font-semibold text-gray-900 mt-0.5">{{ detailData.checkout.location_name }}</div>
											</div>
											<div v-if="detailData.checkout.distance_from_office != null" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">{{ __("Distance") }}</div>
												<div class="text-sm font-semibold mt-0.5" :class="detailData.checkout.distance_from_office <= 100 ? 'text-emerald-600' : detailData.checkout.distance_from_office <= 500 ? 'text-amber-600' : 'text-red-600'">{{ Math.round(detailData.checkout.distance_from_office) }}m</div>
											</div>
											<div v-if="detailData.checkout.latitude" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">GPS</div>
												<div class="text-[12px] font-mono text-gray-800 mt-0.5">{{ Number(detailData.checkout.latitude).toFixed(4) }}, {{ Number(detailData.checkout.longitude).toFixed(4) }}</div>
											</div>
										</div>
									</div>

									<!-- Check-Out Verification -->
									<div class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="shield" class="w-4 h-4 text-red-500" />
											<span class="text-sm font-bold text-gray-900">{{ __("Check-Out Verification") }}</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">WiFi</div>
												<div class="text-base mt-0.5" :class="detailData.checkout.wifi_ssid ? (detailData.checkout.wifi_matched ? 'text-emerald-500' : 'text-red-400') : 'text-gray-900'">{{ detailData.checkout.wifi_ssid ? (detailData.checkout.wifi_matched ? '&#10003;' : '&#10007;') : '&mdash;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5 truncate" :class="detailData.checkout.wifi_ssid ? 'text-emerald-600' : 'text-gray-900'">{{ detailData.checkout.wifi_ssid || 'N/A' }}</div>
											</div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">{{ __("Face") }}</div>
												<div class="text-base mt-0.5" :class="detailData.checkout.face_verified ? 'text-emerald-500' : 'text-red-400'">{{ detailData.checkout.face_verified ? '&#10003;' : '&#10007;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5" :class="detailData.checkout.face_verified ? 'text-emerald-600' : 'text-gray-900'">{{ detailData.checkout.face_confidence ? Math.round(detailData.checkout.face_confidence) + '%' : '-' }}</div>
											</div>
											<div class="bg-gray-50 rounded-lg px-2 py-2 text-center">
												<div class="text-[12px] text-gray-900">{{ __("Geofence") }}</div>
												<div class="text-base mt-0.5" :class="detailData.checkout.is_within_geofence ? 'text-emerald-500' : 'text-red-400'">{{ detailData.checkout.is_within_geofence ? '&#10003;' : '&#10007;' }}</div>
												<div class="text-[11px] font-semibold mt-0.5" :class="detailData.checkout.is_within_geofence ? 'text-emerald-600' : 'text-red-500'">{{ detailData.checkout.is_within_geofence ? 'Inside' : 'Outside' }}</div>
											</div>
										</div>
									</div>
								</template>

								<!-- ===== DEVICE & ANTI-FRAUD ===== -->
								<template v-if="detailData.checkin || detailData.checkout">
									<!-- Device Card -->
									<div v-if="(detailData.checkin || detailData.checkout).device_model" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="smartphone" class="w-4 h-4 text-gray-800" />
											<span class="text-sm font-bold text-gray-900">{{ __("Device") }}</span>
										</div>
										<div class="grid grid-cols-2 gap-2">
											<div class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">{{ __("Model") }}</div>
												<div class="text-sm font-semibold text-gray-900 mt-0.5 truncate">{{ (detailData.checkin || detailData.checkout).device_model }}</div>
											</div>
											<div v-if="(detailData.checkin || detailData.checkout).os_version" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">OS</div>
												<div class="text-sm font-semibold text-gray-900 mt-0.5 truncate">{{ (detailData.checkin || detailData.checkout).os_version }}</div>
											</div>
											<div v-if="(detailData.checkin || detailData.checkout).app_version" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">App Ver</div>
												<div class="text-sm font-semibold text-gray-900 mt-0.5">{{ (detailData.checkin || detailData.checkout).app_version }}</div>
											</div>
											<div v-if="(detailData.checkin || detailData.checkout).ip_address" class="bg-gray-50 rounded-lg px-2.5 py-2">
												<div class="text-[12px] text-gray-900">IP</div>
												<div class="text-[12px] font-mono text-gray-800 mt-0.5">{{ (detailData.checkin || detailData.checkout).ip_address }}</div>
											</div>
										</div>
									</div>

									<!-- Anti-Fraud Card -->
									<div v-if="overviewHasAntiFraud" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="alert-triangle" class="w-4 h-4 text-red-600" />
											<span class="text-sm font-bold text-red-700">{{ __("Anti-Fraud") }}</span>
										</div>
										<div class="flex gap-2 flex-wrap">
											<template v-for="log in [detailData.checkin, detailData.checkout].filter(Boolean)" :key="log.name">
												<span class="text-[11px] font-bold bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">{{ log.log_type === 'Check-in' ? 'IN' : 'OUT' }}</span>
												<span v-if="log.fraud_score > 0" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Fraud: {{ log.fraud_score }}</span>
												<span v-if="log.is_mock_location" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">MOCK GPS</span>
												<span v-if="log.is_vpn" class="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">VPN</span>
												<span v-if="log.is_developer_mode" class="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Dev Mode</span>
											</template>
										</div>
									</div>

									<!-- All Logs Timeline -->
									<div v-if="detailData.all_logs?.length > 2" class="bg-white rounded-xl p-3.5 shadow-sm">
										<div class="flex items-center gap-2 mb-2">
											<FeatherIcon name="list" class="w-4 h-4 text-gray-800" />
											<span class="text-sm font-bold text-gray-900">All Logs ({{ detailData.all_logs.length }})</span>
										</div>
										<div class="space-y-1.5">
											<div v-for="log in detailData.all_logs" :key="log.name" class="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
												<span class="text-[12px] font-bold px-1.5 py-0.5 rounded" :class="log.log_type === 'Check-in' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ log.log_type === 'Check-in' ? 'IN' : 'OUT' }}</span>
												<span class="text-[13px] font-semibold text-gray-900">{{ formatTime(log.timestamp) }}</span>
												<span v-if="log.location_name" class="text-[11px] text-gray-800 truncate ml-auto">{{ log.location_name }}</span>
											</div>
										</div>
									</div>
								</template>
							</template>

							<!-- No detail for absent/leave -->
							<div v-else-if="selectedAtt?.status === 'Absent'" class="bg-white rounded-xl p-4 shadow-sm text-center">
								<FeatherIcon name="user-x" class="w-8 h-8 text-red-300 mx-auto mb-2" />
								<div class="text-base text-gray-800">{{ __("No check-in recorded") }}</div>
							</div>
							<div v-else-if="selectedAtt?.status === 'On Leave'" class="bg-white rounded-xl p-4 shadow-sm text-center">
								<FeatherIcon name="calendar" class="w-8 h-8 text-orange-300 mx-auto mb-2" />
								<div class="text-base text-gray-800">{{ selectedAtt?.leave_type || __("On Leave") }}</div>
							</div>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</ion-page>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, createResource, call, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList } = useManagerApi()
import ListSkeleton from "@/components/ListSkeleton.vue"

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const selectedDate = ref(dayjs().format("YYYY-MM-DD"))
const statusFilter = ref("all")
const attendanceData = ref([])
const isLoading = ref(true)
const verificationData = ref({})

// Detail sheet state
const detailOpen = ref(false)
const selectedAtt = ref(null)
const detailLoading = ref(false)
const detailData = ref(null)
const overviewHasAntiFraud = computed(() => {
	if (!detailData.value) return false
	const logs = [detailData.value.checkin, detailData.value.checkout].filter(Boolean)
	return logs.some(l => l.fraud_score > 0 || l.is_mock_location || l.is_vpn || l.is_developer_mode)
})

const isToday = computed(() => selectedDate.value === dayjs().format("YYYY-MM-DD"))

const statusTabs = [
	{ label: "All", value: "all" },
	{ label: "Present", value: "Present" },
	{ label: "Absent", value: "Absent" },
	{ label: "Leave", value: "On Leave" },
	{ label: "Half Day", value: "Half Day" },
]

function changeDate(offset) {
	const d = dayjs(selectedDate.value).add(offset, "day")
	if (d.isAfter(dayjs(), "day")) return
	selectedDate.value = d.format("YYYY-MM-DD")
}

function formatTime(datetime) {
	if (!datetime) return ""
	const d = dayjs(datetime)
	return d.isValid() ? d.format("h:mm A") : ""
}

function statusGrad(status) {
	return {
		Present: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
		Absent: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
		'On Leave': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
		'Half Day': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
	}[status] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
}

async function openDetail(att) {
	selectedAtt.value = att
	detailData.value = null
	detailOpen.value = true

	if (att.status === 'Absent' || att.status === 'On Leave') return

	detailLoading.value = true
	try {
		const data = await call(`${API}.get_employee_attendance_detail`, {
			employee: att.employee,
			date: selectedDate.value,
		})
		detailData.value = data || null
	} catch (e) {
		_errToast(e, "Failed to load details")
	} finally {
		detailLoading.value = false
	}
}

async function loadVerificationData() {
	try {
		const verifyResource = createResource({
			url: "icd3s_attendance.icd3s_attendance.api.modules.manager.get_team_verification_status",
		})
		await verifyResource.submit({ date: selectedDate.value })
		verificationData.value = verifyResource.data || {}
	} catch (e) {
		verificationData.value = {}
	}
}

async function loadAttendance() {
	if (!employee.data?.company) return
	isLoading.value = true
	try {
		const data = await getList({
			doctype: "Attendance",
			filters: {
				attendance_date: selectedDate.value,
				company: employee.data.company,
				docstatus: 1,
			},
			fields: ["name", "employee", "employee_name", "status", "department", "working_hours", "late_entry", "early_exit", "in_time", "out_time", "shift", "leave_type"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})
		attendanceData.value = data || []
		loadVerificationData()
	} catch (e) {
		_errToast(e, "Failed to load attendance")
		attendanceData.value = []
	} finally {
		isLoading.value = false
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) loadAttendance()
	},
	{ immediate: true }
)

watch(selectedDate, () => {
	loadAttendance()
})

const summary = computed(() => {
	const data = attendanceData.value
	return {
		present: data.filter((a) => a.status === "Present").length,
		absent: data.filter((a) => a.status === "Absent").length,
		leave: data.filter((a) => a.status === "On Leave").length,
		half_day: data.filter((a) => a.status === "Half Day").length,
	}
})

const filteredAttendance = computed(() => {
	if (statusFilter.value === "all") return attendanceData.value
	return attendanceData.value.filter((a) => a.status === statusFilter.value)
})
</script>

<style scoped>
.sheet-overlay {
	position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999;
	display: flex; align-items: stretch; justify-content: center;
}
.sheet-panel {
	background: white;
	width: 100%; max-width: 480px;
	overflow: hidden; display: flex; flex-direction: column;
	padding-top: env(safe-area-inset-top, 0);
}
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); opacity: 0; }
</style>
