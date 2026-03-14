<template>
	<BaseLayout :pageTitle="__('Settings')">
		<template #body>
			<div class="flex flex-col gap-4 my-3 w-full px-3">

				<!-- Skeleton loading -->
				<div v-if="settingsLoading" class="flex flex-col gap-4">
					<div class="skeleton-pills"></div>
					<div v-for="i in 4" :key="i" class="skeleton-card"></div>
				</div>

				<template v-else>
					<!-- Tab Pills -->
					<SettingsTabPills v-model="activeTab" :tabs="tabs" />

					<!-- ========== TAB 1: GENERAL ========== -->
					<template v-if="activeTab === 'general'">
						<!-- Company Info -->
						<SettingsSection title="Company" icon="briefcase" iconColor="#1B7A3D">
							<div class="p-4">
								<div class="text-sm font-semibold text-gray-900 dark:text-white">{{ employee.data?.company || "-" }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-700 mt-1">{{ employee.data?.department || "" }}</div>
							</div>
						</SettingsSection>

						<!-- Appearance -->
						<SettingsSection title="Appearance" icon="moon" iconColor="#374151">
							<div class="settings-row">
								<div class="settings-icon bg-gray-800">
									<FeatherIcon name="moon" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Dark Mode") }}</div>
									<div class="settings-sub">{{ __("Reduce eye strain in low light") }}</div>
								</div>
								<Switch :modelValue="!!darkMode" size="md" @update:modelValue="toggleDarkMode" />
							</div>
						</SettingsSection>

						<!-- About -->
						<SettingsSection title="About" icon="info" iconColor="#6366f1">
							<div class="p-4">
								<div class="flex justify-between text-sm text-gray-700 py-1">
									<span>{{ __("Version") }}</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">v12.0</span>
								</div>
								<div class="flex justify-between text-sm text-gray-700 py-1">
									<span>{{ __("Build") }}</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">2026-02-15</span>
								</div>
							</div>
						</SettingsSection>

						<!-- Reset -->
						<button @click="confirmReset" class="w-full text-sm font-semibold text-red-500 dark:text-red-400 text-center py-3 rounded-xl border border-red-200 dark:border-red-800 active:bg-red-50 dark:active:bg-red-900/20 transition-colors">
							{{ __("Reset All Settings to Default") }}
						</button>
					</template>

					<!-- ========== TAB 2: LOCATIONS ========== -->
					<template v-if="activeTab === 'locations'">
						<div class="flex items-center justify-between mb-1">
							<div class="text-xs font-semibold text-gray-600 dark:text-gray-700 uppercase tracking-wider px-1">{{ __("Office Locations") }}</div>
							<button @click="showAddLocation = true" class="text-xs text-icd-600 dark:text-icd-300 font-semibold active:text-icd-700">
								+ {{ __("Add") }}
							</button>
						</div>
						<div v-if="locationsLoading" class="flex items-center justify-center py-6">
							<LoadingIndicator class="w-6 h-6 text-gray-600" />
						</div>
						<div v-else-if="officeLocations.length === 0" class="settings-card p-4 text-center text-xs text-gray-700">
							{{ __("No office locations configured. Geofencing is disabled.") }}
						</div>
						<div v-else class="flex flex-col gap-2">
							<div
								v-for="loc in officeLocations"
								:key="loc.name"
								class="settings-card p-3 flex items-start gap-3"
								@click="openEditLocation(loc)"
							>
								<div class="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
									<FeatherIcon name="map-pin" class="w-4 text-green-600 dark:text-green-400" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ loc.location_name || loc.name }}</div>
									<div class="text-[11px] text-gray-600">
										{{ fmtCoord(loc.latitude) }}, {{ fmtCoord(loc.longitude) }} | {{ loc.radius_meters || 100 }}m
									</div>
									<div v-if="getLocWifiNetworks(loc).length" class="flex flex-wrap items-center gap-1 mt-1">
										<FeatherIcon name="wifi" class="w-3 text-blue-500 flex-shrink-0" />
										<span v-for="(net, ni) in getLocWifiNetworks(loc)" :key="ni"
											class="text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium px-1.5 py-0.5 rounded-full">
											{{ net.ssid || net.bssid || __("Unknown") }}
										</span>
									</div>
									<div v-else class="flex items-center gap-1 mt-1">
										<FeatherIcon name="wifi-off" class="w-3 text-gray-700" />
										<span class="text-[11px] text-gray-600 italic">{{ __("No WiFi - tap to configure") }}</span>
									</div>
								</div>
								<div class="flex flex-col gap-1 flex-shrink-0">
									<button @click.stop="openEditLocation(loc)" class="w-8 h-8 rounded-lg flex items-center justify-center active:bg-blue-50 dark:active:bg-blue-900/20">
										<FeatherIcon name="edit-2" class="w-3.5 text-blue-400" />
									</button>
									<button @click.stop="removeLocation(loc)" class="w-8 h-8 rounded-lg flex items-center justify-center active:bg-red-50 dark:active:bg-red-900/20">
										<FeatherIcon name="trash-2" class="w-3.5 text-red-400" />
									</button>
								</div>
							</div>
						</div>

						<!-- Geofence Radius Default -->
						<SettingsSection title="Default Geofence" icon="target" iconColor="#10b981" :collapsed="true">
							<div class="p-4">
								<SettingsSlider
									v-model="adminSettings.location_jump_threshold_km"
									:min="10" :max="200" :step="10"
									suffix="km" color="#10b981"
									@change="saveAdminField('location_jump_threshold_km', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Location Jump Threshold") }}</div>
										<div class="settings-sub">{{ __("Max distance between check-ins") }}</div>
									</template>
								</SettingsSlider>
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 3: CHECK-IN ========== -->
					<template v-if="activeTab === 'checkin'">
						<!-- Photo & Face -->
						<SettingsSection title="Photo & Face" icon="camera" iconColor="#22c55e">
							<div class="settings-row">
								<div class="settings-icon bg-green-500">
									<FeatherIcon name="camera" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Require Photo") }}</div>
									<div class="settings-sub">{{ __("Must take selfie for check-in") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.photo_required" size="md" @update:modelValue="saveAdminField('photo_required', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-purple-500">
									<FeatherIcon name="eye" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Face Recognition") }}</div>
									<div class="settings-sub">{{ __("Require face match for check-in") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.face_recognition_enabled" size="md" @update:modelValue="saveAdminField('face_recognition_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-blue-500">
									<FeatherIcon name="maximize" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Selfie Check-in") }}</div>
									<div class="settings-sub">{{ __("Selfie-only check-in mode") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.selfie_checkin_enabled" size="md" @update:modelValue="saveAdminField('selfie_checkin_enabled', $event)" />
							</div>
						</SettingsSection>

						<!-- Device & Method -->
						<SettingsSection title="Device & Method" icon="smartphone" iconColor="#3b82f6">
							<div class="settings-row">
								<div class="settings-icon bg-blue-500">
									<FeatherIcon name="smartphone" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Device Binding") }}</div>
									<div class="settings-sub">{{ __("Lock check-in to registered device") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.device_binding_enabled" size="md" @update:modelValue="saveAdminField('device_binding_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-indigo-500">
									<FeatherIcon name="grid" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("QR Code Check-in") }}</div>
									<div class="settings-sub">{{ __("Scan QR to check in") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.qr_checkin_enabled" size="md" @update:modelValue="saveAdminField('qr_checkin_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-teal-500">
									<FeatherIcon name="cpu" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("NFC Check-in") }}</div>
									<div class="settings-sub">{{ __("Tap NFC tag to check in") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.nfc_checkin_enabled" size="md" @update:modelValue="saveAdminField('nfc_checkin_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-violet-500">
									<FeatherIcon name="unlock" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Biometric API") }}</div>
									<div class="settings-sub">{{ __("Fingerprint/FaceID via browser API") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.biometric_api_enabled" size="md" @update:modelValue="saveAdminField('biometric_api_enabled', $event)" />
							</div>
						</SettingsSection>

						<!-- Grace Periods -->
						<SettingsSection title="Grace Periods" icon="clock" iconColor="#f59e0b">
							<div class="p-4 flex flex-col gap-4">
								<SettingsSlider
									v-model="adminSettings.grace_period_minutes"
									:min="0" :max="60" :step="5"
									suffix="min" color="#f59e0b"
									@change="saveAdminField('grace_period_minutes', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Late Grace") }}</div>
										<div class="settings-sub">{{ __("Minutes before counted as late") }}</div>
									</template>
								</SettingsSlider>
								<SettingsSlider
									v-model="adminSettings.early_leave_grace_minutes"
									:min="0" :max="60" :step="5"
									suffix="min" color="#f59e0b"
									@change="saveAdminField('early_leave_grace_minutes', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Early Leave Grace") }}</div>
										<div class="settings-sub">{{ __("Minutes before counted as early leave") }}</div>
									</template>
								</SettingsSlider>
							</div>
						</SettingsSection>

						<!-- Offline Sync -->
						<SettingsSection title="Offline" icon="cloud-off" iconColor="#6b7280" :collapsed="true">
							<div class="p-4">
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Max Offline Sync") }}</div>
										<div class="settings-sub">{{ __("Hours before offline data expires") }}</div>
									</div>
									<SettingsNumberInput
										v-model="adminSettings.max_offline_sync_hours"
										:min="1" :max="72" suffix="hrs"
										@update:modelValue="saveAdminField('max_offline_sync_hours', $event)"
									/>
								</div>
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 4: SECURITY ========== -->
					<template v-if="activeTab === 'security'">
						<!-- Anti-Fraud Detection -->
						<SettingsSection title="Anti-Fraud Detection" icon="shield" iconColor="#ef4444">
							<div class="settings-row">
								<div class="settings-icon bg-red-500"><FeatherIcon name="map-pin" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Detect Mock Location") }}</div>
									<div class="settings-sub">{{ __("Block GPS spoofing apps") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.detect_mock_location" size="md" @update:modelValue="saveAdminField('detect_mock_location', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-blue-600"><FeatherIcon name="wifi" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("WiFi BSSID Verification") }}</div>
									<div class="settings-sub">{{ __("Verify office WiFi MAC address") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.wifi_bssid_verification" size="md" @update:modelValue="saveAdminField('wifi_bssid_verification', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-orange-600"><FeatherIcon name="zap" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Detect Location Jump") }}</div>
									<div class="settings-sub">{{ __("Flag impossible travel speed") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.detect_location_jump" size="md" @update:modelValue="saveAdminField('detect_location_jump', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-teal-600"><FeatherIcon name="globe" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("IP Geolocation Check") }}</div>
									<div class="settings-sub">{{ __("Verify IP matches country") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.ip_geolocation_check" size="md" @update:modelValue="saveAdminField('ip_geolocation_check', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-cyan-600"><FeatherIcon name="lock" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("IP Restriction") }}</div>
									<div class="settings-sub">{{ __("Restrict check-in to allowed IPs") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.ip_restriction_enabled" size="md" @update:modelValue="saveAdminField('ip_restriction_enabled', $event)" />
							</div>
						</SettingsSection>

						<!-- Multi-Factor -->
						<SettingsSection title="Enforcement" icon="lock" iconColor="#7c3aed">
							<div class="settings-row">
								<div class="settings-icon bg-purple-600"><FeatherIcon name="lock" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Enforce Multi-Factor") }}</div>
									<div class="settings-sub">{{ __("GPS + Face both required") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.enforce_multi_factor" size="md" @update:modelValue="saveAdminField('enforce_multi_factor', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-rose-600"><FeatherIcon name="alert-circle" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Auto-Escalate Suspicious") }}</div>
									<div class="settings-sub">{{ __("Alert manager on fraud detection") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.auto_escalate_suspicious" size="md" @update:modelValue="saveAdminField('auto_escalate_suspicious', $event)" />
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 5: PENALTIES ========== -->
					<template v-if="activeTab === 'penalties'">
						<!-- Late Thresholds -->
						<SettingsSection title="Late Thresholds" icon="clock" iconColor="#f59e0b">
							<div class="p-4">
								<div class="grid grid-cols-3 gap-3">
									<div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-center">
										<div class="text-[11px] text-yellow-700 dark:text-yellow-300 font-medium">{{ __("Warning") }}</div>
										<div class="text-lg font-bold text-yellow-800 dark:text-yellow-200">{{ adminSettings.late_warning_minutes }}</div>
										<div class="text-[11px] text-yellow-600 dark:text-yellow-400">{{ __("min") }}</div>
									</div>
									<div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5 text-center">
										<div class="text-[11px] text-orange-700 dark:text-orange-300 font-medium">{{ __("Minor") }}</div>
										<div class="text-lg font-bold text-orange-800 dark:text-orange-200">{{ adminSettings.late_minor_minutes }}</div>
										<div class="text-[11px] text-orange-600 dark:text-orange-400">{{ __("min") }}</div>
									</div>
									<div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 text-center">
										<div class="text-[11px] text-red-700 dark:text-red-300 font-medium">{{ __("Major") }}</div>
										<div class="text-lg font-bold text-red-800 dark:text-red-200">{{ adminSettings.late_major_minutes }}</div>
										<div class="text-[11px] text-red-600 dark:text-red-400">{{ __("min") }}</div>
									</div>
								</div>
							</div>
						</SettingsSection>

						<!-- Edit Late Thresholds -->
						<SettingsSection title="Edit Thresholds" icon="edit-2" iconColor="#d97706" :collapsed="true">
							<div class="p-4 flex flex-col gap-4">
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Warning") }}</div>
										<div class="settings-sub">{{ __("First late warning") }}</div>
									</div>
									<SettingsNumberInput
										v-model="adminSettings.late_warning_minutes"
										:min="5" :max="120" :step="5" suffix="min"
										@update:modelValue="saveAdminField('late_warning_minutes', $event)"
									/>
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Minor Violation") }}</div>
										<div class="settings-sub">{{ __("Small deduction applies") }}</div>
									</div>
									<SettingsNumberInput
										v-model="adminSettings.late_minor_minutes"
										:min="15" :max="180" :step="5" suffix="min"
										@update:modelValue="saveAdminField('late_minor_minutes', $event)"
									/>
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Major Violation") }}</div>
										<div class="settings-sub">{{ __("Full deduction applies") }}</div>
									</div>
									<SettingsNumberInput
										v-model="adminSettings.late_major_minutes"
										:min="30" :max="240" :step="15" suffix="min"
										@update:modelValue="saveAdminField('late_major_minutes', $event)"
									/>
								</div>
							</div>
						</SettingsSection>

						<!-- Deductions -->
						<SettingsSection title="Deductions" icon="minus-circle" iconColor="#ef4444">
							<div class="p-4 flex flex-col gap-4">
								<SettingsSlider
									v-model="adminSettings.late_minor_deduction"
									:min="0" :max="2" :step="0.05"
									suffix="day" color="#f97316"
									@change="saveAdminField('late_minor_deduction', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Minor Late Deduction") }}</div>
										<div class="settings-sub">{{ __("Fraction of daily salary") }}</div>
									</template>
								</SettingsSlider>
								<SettingsSlider
									v-model="adminSettings.late_major_deduction"
									:min="0" :max="2" :step="0.05"
									suffix="day" color="#ef4444"
									@change="saveAdminField('late_major_deduction', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Major Late Deduction") }}</div>
										<div class="settings-sub">{{ __("Fraction of daily salary") }}</div>
									</template>
								</SettingsSlider>
								<div class="border-t border-gray-100 dark:border-gray-700 pt-3">
									<div class="flex items-center justify-between">
										<div>
											<div class="settings-label">{{ __("Monthly Late Threshold") }}</div>
											<div class="settings-sub">{{ __("Late count before monthly deduction") }}</div>
										</div>
										<SettingsNumberInput
											v-model="adminSettings.monthly_late_threshold"
											:min="1" :max="10" suffix="x"
											@update:modelValue="saveAdminField('monthly_late_threshold', $event)"
										/>
									</div>
								</div>
								<SettingsSlider
									v-model="adminSettings.monthly_late_deduction"
									:min="0" :max="3" :step="0.1"
									suffix="day" color="#dc2626"
									@change="saveAdminField('monthly_late_deduction', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Monthly Deduction") }}</div>
										<div class="settings-sub">{{ __("Extra deduction when threshold exceeded") }}</div>
									</template>
								</SettingsSlider>
							</div>
						</SettingsSection>

						<!-- Overtime Rates -->
						<SettingsSection title="Overtime Rates" icon="trending-up" iconColor="#8b5cf6" :collapsed="true">
							<div class="p-4 flex flex-col gap-4">
								<SettingsSlider
									v-model="adminSettings.overtime_day_rate"
									:min="1" :max="3" :step="0.05"
									suffix="x" color="#8b5cf6"
									@change="saveAdminField('overtime_day_rate', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Day Rate") }}</div>
										<div class="settings-sub">{{ __("Multiplier for day overtime") }}</div>
									</template>
								</SettingsSlider>
								<SettingsSlider
									v-model="adminSettings.overtime_night_rate"
									:min="1" :max="3" :step="0.05"
									suffix="x" color="#8b5cf6"
									@change="saveAdminField('overtime_night_rate', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Night Rate") }}</div>
										<div class="settings-sub">{{ __("Multiplier for night overtime") }}</div>
									</template>
								</SettingsSlider>
								<SettingsSlider
									v-model="adminSettings.overtime_holiday_rate"
									:min="1" :max="4" :step="0.05"
									suffix="x" color="#8b5cf6"
									@change="saveAdminField('overtime_holiday_rate', $event)"
								>
									<template #label>
										<div class="settings-label">{{ __("Holiday Rate") }}</div>
										<div class="settings-sub">{{ __("Multiplier for holiday work") }}</div>
									</template>
								</SettingsSlider>
								<div class="border-t border-gray-100 dark:border-gray-700 pt-3 flex flex-col gap-3">
									<div class="flex items-center justify-between">
										<div>
											<div class="settings-label">{{ __("Max Daily Hours") }}</div>
											<div class="settings-sub">{{ __("Standard work hours/day") }}</div>
										</div>
										<SettingsNumberInput
											v-model="adminSettings.max_daily_hours"
											:min="4" :max="12" suffix="hrs"
											@update:modelValue="saveAdminField('max_daily_hours', $event)"
										/>
									</div>
									<div class="flex items-center justify-between">
										<div>
											<div class="settings-label">{{ __("Max Presence") }}</div>
											<div class="settings-sub">{{ __("Max hours on-site per day") }}</div>
										</div>
										<SettingsNumberInput
											v-model="adminSettings.max_daily_presence"
											:min="8" :max="18" suffix="hrs"
											@update:modelValue="saveAdminField('max_daily_presence', $event)"
										/>
									</div>
								</div>
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 6: REWARDS ========== -->
					<template v-if="activeTab === 'rewards'">
						<!-- Points Overview -->
						<SettingsSection title="Check-in Points" icon="star" iconColor="#f59e0b">
							<div class="p-4">
								<div class="grid grid-cols-2 gap-2">
									<div class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
										<span class="text-xs text-green-700 dark:text-green-300">{{ __("On Time") }}</span>
										<span class="text-sm font-bold text-green-800 dark:text-green-200">+{{ adminSettings.points_on_time }}</span>
									</div>
									<div class="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
										<span class="text-xs text-emerald-700 dark:text-emerald-300">{{ __("Early") }}</span>
										<span class="text-sm font-bold text-emerald-800 dark:text-emerald-200">+{{ adminSettings.points_early }}</span>
									</div>
									<div class="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
										<span class="text-xs text-red-700 dark:text-red-300">{{ __("Late") }}</span>
										<span class="text-sm font-bold text-red-800 dark:text-red-200">{{ adminSettings.points_late }}</span>
									</div>
									<div class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
										<span class="text-xs text-gray-700 dark:text-gray-300">{{ __("Absent") }}</span>
										<span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ adminSettings.points_absent }}</span>
									</div>
								</div>
							</div>
						</SettingsSection>

						<!-- Edit Points -->
						<SettingsSection title="Edit Points" icon="edit-2" iconColor="#f59e0b" :collapsed="true">
							<div class="p-4 flex flex-col gap-3">
								<div class="flex items-center justify-between">
									<div class="settings-label">{{ __("On Time") }}</div>
									<SettingsNumberInput v-model="adminSettings.points_on_time" :min="0" :max="100" suffix="pts" @update:modelValue="saveAdminField('points_on_time', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div class="settings-label">{{ __("Early Arrival") }}</div>
									<SettingsNumberInput v-model="adminSettings.points_early" :min="0" :max="100" suffix="pts" @update:modelValue="saveAdminField('points_early', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div class="settings-label">{{ __("Late Penalty") }}</div>
									<SettingsNumberInput v-model="adminSettings.points_late" :min="-50" :max="0" suffix="pts" @update:modelValue="saveAdminField('points_late', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div class="settings-label">{{ __("Absent Penalty") }}</div>
									<SettingsNumberInput v-model="adminSettings.points_absent" :min="-50" :max="0" suffix="pts" @update:modelValue="saveAdminField('points_absent', $event)" />
								</div>
							</div>
						</SettingsSection>

						<!-- Streak Bonuses -->
						<SettingsSection title="Streak Bonuses" icon="zap" iconColor="#ec4899">
							<div class="p-4 flex flex-col gap-3">
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("5-Day Streak") }}</div>
										<div class="settings-sub">{{ __("Bonus for 5 consecutive days") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.points_streak_5" :min="0" :max="200" suffix="pts" @update:modelValue="saveAdminField('points_streak_5', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("10-Day Streak") }}</div>
										<div class="settings-sub">{{ __("Bonus for 10 consecutive days") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.points_streak_10" :min="0" :max="300" suffix="pts" @update:modelValue="saveAdminField('points_streak_10', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("20-Day Streak") }}</div>
										<div class="settings-sub">{{ __("Bonus for 20 consecutive days") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.points_streak_20" :min="0" :max="500" suffix="pts" @update:modelValue="saveAdminField('points_streak_20', $event)" />
								</div>
							</div>
						</SettingsSection>

						<!-- UI & Visual Toggles -->
						<SettingsSection title="Visual Effects" icon="sliders" iconColor="#6366f1">
							<div class="settings-row">
								<div class="settings-icon bg-amber-500"><FeatherIcon name="activity" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Streak Animations") }}</div>
									<div class="settings-sub">{{ __("Visual streak fire effects") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.streak_visual_enabled" size="md" @update:modelValue="saveAdminField('streak_visual_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-pink-500"><FeatherIcon name="star" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Achievement Confetti") }}</div>
									<div class="settings-sub">{{ __("Celebrate badge unlocks") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.confetti_on_achievement_enabled" size="md" @update:modelValue="saveAdminField('confetti_on_achievement_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-cyan-500"><FeatherIcon name="layers" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Glassmorphism") }}</div>
									<div class="settings-sub">{{ __("Frosted glass card effects") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.glassmorphism_enabled" size="md" @update:modelValue="saveAdminField('glassmorphism_enabled', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-indigo-500"><FeatherIcon name="trending-up" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Show Leaderboard") }}</div>
									<div class="settings-sub">{{ __("Points ranking on dashboard") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.show_leaderboard" size="md" @update:modelValue="saveAdminField('show_leaderboard', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-violet-500"><FeatherIcon name="cpu" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Show AI Insights") }}</div>
									<div class="settings-sub">{{ __("Weekly AI analysis cards") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.show_ai_insights" size="md" @update:modelValue="saveAdminField('show_ai_insights', $event)" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-emerald-500"><FeatherIcon name="pie-chart" class="w-4 h-4 text-white" /></div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Calendar Heatmap") }}</div>
									<div class="settings-sub">{{ __("Color-coded attendance calendar") }}</div>
								</div>
								<Switch :modelValue="!!adminSettings.calendar_heatmap_enabled" size="md" @update:modelValue="saveAdminField('calendar_heatmap_enabled', $event)" />
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 7: ALERTS ========== -->
					<template v-if="activeTab === 'alerts'">
						<!-- System Push Notifications -->
						<SettingsSection title="Push Notifications" icon="bell" iconColor="#ef4444">
							<div class="settings-row">
								<div class="settings-icon bg-red-500">
									<FeatherIcon name="bell" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Push Notifications") }}</div>
									<div v-if="pushDescription" class="settings-sub text-red-400">{{ pushDescription }}</div>
									<div v-else class="settings-sub">{{ __("System push alerts") }}</div>
								</div>
								<div class="flex items-center gap-2">
									<LoadingIndicator v-if="pushLoading" class="w-4 h-4 text-gray-600" />
									<Switch :modelValue="!!pushState" :disabled="pushDisabled" size="md" @update:modelValue="togglePush(!pushState)" />
								</div>
							</div>
						</SettingsSection>

						<!-- Notification Alert Preferences -->
						<SettingsSection v-if="prefsLoaded" title="Alert Preferences" icon="sliders" iconColor="#8b5cf6">
							<div class="settings-row" v-for="(item, idx) in alertItems" :key="item.key"
								:class="{ 'border-t border-gray-100 dark:border-gray-700': idx > 0 }">
								<div class="settings-icon" :class="item.bg">
									<FeatherIcon :name="item.icon" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __(item.label) }}</div>
									<div class="settings-sub">{{ __(item.sub) }}</div>
								</div>
								<Switch :modelValue="!!prefs[item.key]" size="md" @update:modelValue="prefs[item.key] = prefs[item.key] ? 0 : 1" />
							</div>
						</SettingsSection>

						<!-- Channels -->
						<SettingsSection v-if="prefsLoaded" title="Channels" icon="send" iconColor="#4D067B">
							<div class="settings-row">
								<div class="settings-icon" style="background:#4D067B">
									<FeatherIcon name="smartphone" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0"><div class="settings-label">{{ __("Push") }}</div></div>
								<Switch :modelValue="!!prefs.push_notifications" size="md" @update:modelValue="prefs.push_notifications = prefs.push_notifications ? 0 : 1" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-blue-500">
									<FeatherIcon name="mail" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0"><div class="settings-label">{{ __("Email") }}</div></div>
								<Switch :modelValue="!!prefs.email_notifications" size="md" @update:modelValue="prefs.email_notifications = prefs.email_notifications ? 0 : 1" />
							</div>
							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-green-500">
									<FeatherIcon name="message-circle" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0"><div class="settings-label">{{ __("WhatsApp") }}</div></div>
								<Switch :modelValue="!!prefs.whatsapp_notifications" size="md" @update:modelValue="prefs.whatsapp_notifications = prefs.whatsapp_notifications ? 0 : 1" />
							</div>
						</SettingsSection>

						<!-- Quiet Hours -->
						<SettingsSection v-if="prefsLoaded" title="Quiet Hours" icon="moon" iconColor="#6366f1">
							<div class="settings-row">
								<div class="settings-icon bg-indigo-500">
									<FeatherIcon name="moon" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Enable Quiet Hours") }}</div>
									<div class="settings-sub">{{ __("Mute during set hours") }}</div>
								</div>
								<Switch :modelValue="!!prefs.quiet_hours_enabled" size="md" @update:modelValue="prefs.quiet_hours_enabled = prefs.quiet_hours_enabled ? 0 : 1" />
							</div>
							<div v-if="prefs.quiet_hours_enabled" class="border-t border-gray-100 dark:border-gray-700 p-4 grid grid-cols-2 gap-3">
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("From") }}</label>
									<input type="time" v-model="prefs.quiet_start" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("To") }}</label>
									<input type="time" v-model="prefs.quiet_end" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
							</div>
						</SettingsSection>

						<!-- Reminder Times -->
						<SettingsSection v-if="prefsLoaded" title="Reminders" icon="clock" iconColor="#0ea5e9">
							<div class="p-4 grid grid-cols-2 gap-3">
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-in") }}</label>
									<input type="time" v-model="prefs.checkin_reminder_time" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("Check-out") }}</label>
									<input type="time" v-model="prefs.checkout_reminder_time" class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
								</div>
							</div>
						</SettingsSection>

						<!-- Save Preferences Button -->
						<button
							v-if="prefsLoaded"
							@click="savePrefs"
							:disabled="isSaving"
							class="w-full text-white rounded-xl py-3.5 font-bold text-sm shadow-md disabled:opacity-50 transition-all active:scale-[0.97]"
							style="background:#4D067B"
						>
							{{ isSaving ? __("Saving...") : __("Save Preferences") }}
						</button>

						<!-- Sounds & Feedback -->
						<SettingsSection v-if="hasSounds" title="Sounds & Feedback" icon="volume-2" iconColor="#f97316">
							<div class="settings-row">
								<div class="settings-icon bg-orange-500">
									<FeatherIcon name="volume-2" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Sound Effects") }}</div>
									<div class="settings-sub">{{ __("Check-in & check-out chimes") }}</div>
								</div>
								<Switch :modelValue="!!soundsOn" size="md" @update:modelValue="toggleSounds" />
							</div>

							<div v-if="soundsOn" class="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
								<div class="flex items-center justify-between text-xs text-gray-700 mb-2">
									<span>{{ __("Volume") }}</span>
									<span class="font-medium" style="color:#4D067B">{{ Math.round(sndVolume * 100) }}%</span>
								</div>
								<input type="range" min="0" max="100" :value="sndVolume * 100" @input="setVol($event.target.value / 100)" class="w-full h-1.5 rounded-full appearance-none cursor-pointer" style="accent-color:#4D067B" />
							</div>

							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-purple-500">
									<FeatherIcon name="mouse-pointer" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Tap Sounds") }}</div>
									<div class="settings-sub">{{ __("Subtle clicks on button taps") }}</div>
								</div>
								<Switch :modelValue="!!tapOn" size="md" @update:modelValue="toggleTap" />
							</div>

							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-pink-500">
									<FeatherIcon name="zap" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Haptic Feedback") }}</div>
									<div class="settings-sub">{{ __("Vibration on actions") }}</div>
								</div>
								<Switch :modelValue="!!hapticOn" size="md" @update:modelValue="toggleHaptic" />
							</div>

							<div class="settings-row border-t border-gray-100 dark:border-gray-700">
								<div class="settings-icon bg-yellow-500">
									<FeatherIcon name="star" class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="settings-label">{{ __("Celebrations") }}</div>
									<div class="settings-sub">{{ __("Confetti on streak milestones") }}</div>
								</div>
								<Switch :modelValue="!!confettiOn" size="md" @update:modelValue="toggleConfetti" />
							</div>
						</SettingsSection>
					</template>

					<!-- ========== TAB 8: SCHEDULE ========== -->
					<template v-if="activeTab === 'schedule'">
						<!-- Shift Types -->
						<SettingsSection title="Shift Types" icon="clock" iconColor="#3b82f6">
							<div v-if="shiftTypes.loading" class="flex items-center justify-center py-6">
								<LoadingIndicator class="w-6 h-6 text-gray-600" />
							</div>
							<div v-else-if="(shiftTypes.data || []).length === 0" class="p-4 text-center text-xs text-gray-700">
								{{ __("No shift types configured") }}
							</div>
							<div v-else>
								<div
									v-for="(shift, idx) in shiftTypes.data"
									:key="shift.name"
									class="flex items-center gap-3 p-3 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800"
									:class="{ 'border-t border-gray-100 dark:border-gray-700': idx > 0 }"
									@click="openShiftDetail(shift)"
								>
									<div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
										<FeatherIcon name="clock" class="w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ shift.name }}</div>
										<div class="text-[11px] text-gray-600">{{ shift.start_time }} - {{ shift.end_time }}</div>
									</div>
									<FeatherIcon name="chevron-right" class="w-4 text-gray-700 dark:text-gray-600" />
								</div>
							</div>
						</SettingsSection>

						<!-- Holiday Lists -->
						<SettingsSection title="Holiday Lists" icon="sun" iconColor="#f97316">
							<div v-if="holidayLists.loading" class="flex items-center justify-center py-6">
								<LoadingIndicator class="w-6 h-6 text-gray-600" />
							</div>
							<div v-else-if="(holidayLists.data || []).length === 0" class="p-4 text-center text-xs text-gray-700">
								{{ __("No holiday lists found") }}
							</div>
							<div v-else>
								<div
									v-for="(hl, idx) in holidayLists.data"
									:key="hl.name"
									class="flex items-center gap-3 p-3 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800"
									:class="{ 'border-t border-gray-100 dark:border-gray-700': idx > 0 }"
									@click="openHolidayDetail(hl)"
								>
									<div class="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
										<FeatherIcon name="sun" class="w-4 text-orange-600 dark:text-orange-400" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ hl.name }}</div>
										<div class="text-[11px] text-gray-600">{{ hl.total_holidays }} {{ __("holidays") }}</div>
									</div>
									<FeatherIcon name="chevron-right" class="w-4 text-gray-700 dark:text-gray-600" />
								</div>
							</div>
						</SettingsSection>

						<!-- Scheduling Config -->
						<SettingsSection title="Scheduling Config" icon="settings" iconColor="#6b7280" :collapsed="true">
							<div class="p-4 flex flex-col gap-3">
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Open Shift Deadline") }}</div>
										<div class="settings-sub">{{ __("Hours before shift to claim") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.open_shift_deadline_hours" :min="1" :max="48" suffix="hrs" @update:modelValue="saveAdminField('open_shift_deadline_hours', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Swap Reminder") }}</div>
										<div class="settings-sub">{{ __("Days before swap expires") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.swap_reminder_days" :min="1" :max="7" suffix="d" @update:modelValue="saveAdminField('swap_reminder_days', $event)" />
								</div>
								<div class="flex items-center justify-between">
									<div>
										<div class="settings-label">{{ __("Stale Swap Days") }}</div>
										<div class="settings-sub">{{ __("Auto-reject swaps after") }}</div>
									</div>
									<SettingsNumberInput v-model="adminSettings.stale_swap_days" :min="1" :max="30" suffix="d" @update:modelValue="saveAdminField('stale_swap_days', $event)" />
								</div>
							</div>
						</SettingsSection>
					</template>

				</template>

				<div class="h-8"></div>
			</div>

			<!-- Add Location Modal -->
			<ion-modal
				:is-open="showAddLocation"
				@didDismiss="showAddLocation = false"
				:initial-breakpoint="0.75"
				:breakpoints="[0, 0.75, 0.95]"
			>
				<div class="p-5 pb-8">
					<h3 class="text-base font-bold text-gray-900 dark:text-white mb-4">{{ __("Add Office Location") }}</h3>
					<div class="flex flex-col gap-3">
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Location Name") }}</label>
							<input v-model="newLocation.name" type="text" :placeholder="__('e.g., HQ Maadi')"
								class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Latitude") }}</label>
								<input v-model.number="newLocation.latitude" type="number" step="0.0001"
									class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Longitude") }}</label>
								<input v-model.number="newLocation.longitude" type="number" step="0.0001"
									class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
							</div>
						</div>
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Radius (meters)") }}</label>
							<input v-model.number="newLocation.radius" type="number" min="50" max="500"
								class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
						</div>
						<div class="border-t border-gray-100 dark:border-gray-700 pt-3">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<FeatherIcon name="wifi" class="w-4 text-blue-500" />
									<span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ __("WiFi Networks (Optional)") }}</span>
								</div>
								<button @click="newLocation.wifi_networks.push({ ssid: '', bssid: '' })"
									class="text-[11px] text-icd-600 dark:text-icd-300 font-semibold active:text-icd-700">
									+ {{ __("Add WiFi") }}
								</button>
							</div>
							<div v-if="newLocation.wifi_networks.length === 0" class="text-[11px] text-gray-600 italic text-center py-2">
								{{ __("No WiFi networks. Tap + Add WiFi to add one.") }}
							</div>
							<div v-for="(net, idx) in newLocation.wifi_networks" :key="idx" class="flex items-start gap-2 mb-2">
								<div class="flex-1 grid grid-cols-1 gap-1">
									<input v-model="net.ssid" type="text" :placeholder="__('SSID (e.g., ICD-5G)')"
										class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
									<input v-model="net.bssid" type="text" :placeholder="__('BSSID (e.g., AA:BB:CC:DD:EE:FF)')"
										class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-icd-400" />
								</div>
								<button @click="newLocation.wifi_networks.splice(idx, 1)"
									class="w-8 h-8 rounded-lg flex items-center justify-center active:bg-red-50 dark:active:bg-red-900/20 mt-1 flex-shrink-0">
									<FeatherIcon name="x" class="w-3.5 text-red-400" />
								</button>
							</div>
						</div>
						<button @click="getCurrentLocation"
							class="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl py-2.5 text-sm font-semibold active:bg-gray-200 dark:active:bg-gray-600">
							<FeatherIcon name="navigation" class="w-4 inline mr-1" />
							{{ __("Use Current Location") }}
						</button>
						<button @click="addLocation" :disabled="!newLocation.name || !newLocation.latitude || addingLocation"
							class="w-full text-white rounded-xl py-3 font-bold text-sm active:opacity-80 disabled:opacity-50"
							style="background:#4D067B">
							{{ addingLocation ? __("Adding...") : __("Add Location") }}
						</button>
					</div>
				</div>
			</ion-modal>

			<!-- Edit Location Modal -->
			<ion-modal
				:is-open="showEditLocation"
				@didDismiss="showEditLocation = false"
				:initial-breakpoint="0.75"
				:breakpoints="[0, 0.75, 0.95]"
			>
				<div class="p-5 pb-8">
					<h3 class="text-base font-bold text-gray-900 dark:text-white mb-4">{{ __("Edit Office Location") }}</h3>
					<div class="flex flex-col gap-3">
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Location Name") }}</label>
							<input v-model="editLocation.location_name" type="text"
								class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Latitude") }}</label>
								<input v-model.number="editLocation.latitude" type="number" step="0.0001"
									class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Longitude") }}</label>
								<input v-model.number="editLocation.longitude" type="number" step="0.0001"
									class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
							</div>
						</div>
						<div>
							<label class="text-xs text-gray-700 mb-1 block">{{ __("Radius (meters)") }}</label>
							<input v-model.number="editLocation.radius_meters" type="number" min="50" max="500"
								class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
						</div>
						<div class="border-t border-gray-100 dark:border-gray-700 pt-3">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<FeatherIcon name="wifi" class="w-4 text-blue-500" />
									<span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ __("WiFi Networks") }}</span>
								</div>
								<button @click="editLocation.wifi_networks.push({ ssid: '', bssid: '' })"
									class="text-[11px] text-icd-600 dark:text-icd-300 font-semibold active:text-icd-700">
									+ {{ __("Add WiFi") }}
								</button>
							</div>
							<div v-if="editLocation.wifi_networks.length === 0" class="text-[11px] text-gray-600 italic text-center py-2">
								{{ __("No WiFi networks configured.") }}
							</div>
							<div v-for="(net, idx) in editLocation.wifi_networks" :key="idx" class="flex items-start gap-2 mb-2">
								<div class="flex-1 grid grid-cols-1 gap-1">
									<input v-model="net.ssid" type="text" :placeholder="__('SSID (e.g., ICD-5G)')"
										class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-icd-400" />
									<input v-model="net.bssid" type="text" :placeholder="__('BSSID (e.g., AA:BB:CC:DD:EE:FF)')"
										class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-icd-400" />
								</div>
								<button @click="editLocation.wifi_networks.splice(idx, 1)"
									class="w-8 h-8 rounded-lg flex items-center justify-center active:bg-red-50 dark:active:bg-red-900/20 mt-1 flex-shrink-0">
									<FeatherIcon name="x" class="w-3.5 text-red-400" />
								</button>
							</div>
						</div>
						<button @click="saveEditLocation" :disabled="!editLocation.location_name || savingEdit"
							class="w-full text-white rounded-xl py-3 font-bold text-sm active:opacity-80 disabled:opacity-50"
							style="background:#4D067B">
							{{ savingEdit ? __("Saving...") : __("Save Changes") }}
						</button>
					</div>
				</div>
			</ion-modal>

			<!-- Shift Detail Modal -->
			<ion-modal :is-open="showShiftModal" @didDismiss="showShiftModal = false"
				:initial-breakpoint="0.5" :breakpoints="[0, 0.5, 0.85]">
				<div v-if="selectedShift" class="p-5 pb-8">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
							<FeatherIcon name="clock" class="w-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<div class="text-base font-bold text-gray-900 dark:text-white">{{ selectedShift.name }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-700">{{ __("Shift Type") }}</div>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
							<div class="text-xs text-gray-700">{{ __("Start Time") }}</div>
							<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{{ selectedShift.start_time || "-" }}</div>
						</div>
						<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
							<div class="text-xs text-gray-700">{{ __("End Time") }}</div>
							<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{{ selectedShift.end_time || "-" }}</div>
						</div>
						<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
							<div class="text-xs text-gray-700">{{ __("Holiday List") }}</div>
							<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{{ selectedShift.holiday_list || "-" }}</div>
						</div>
						<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
							<div class="text-xs text-gray-700">{{ __("Status") }}</div>
							<div class="text-sm font-semibold text-green-700 dark:text-green-400 mt-0.5">{{ __("Active") }}</div>
						</div>
					</div>
				</div>
			</ion-modal>

			<!-- Holiday Detail Modal -->
			<ion-modal :is-open="showHolidayModal" @didDismiss="showHolidayModal = false"
				:initial-breakpoint="0.7" :breakpoints="[0, 0.7, 1]">
				<div v-if="selectedHoliday" class="p-5 pb-8">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
							<FeatherIcon name="sun" class="w-6 text-orange-600 dark:text-orange-400" />
						</div>
						<div>
							<div class="text-base font-bold text-gray-900 dark:text-white">{{ selectedHoliday.name }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-700">{{ selectedHoliday.total_holidays }} {{ __("holidays") }}</div>
						</div>
					</div>
					<div v-if="holidayDetails.loading" class="flex items-center justify-center py-6">
						<LoadingIndicator class="w-6 h-6 text-gray-600" />
					</div>
					<div v-else-if="(holidayDetails.data || []).length === 0" class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center text-xs text-gray-700">
						{{ __("No holidays in this list") }}
					</div>
					<div v-else class="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
						<div v-for="(h, idx) in holidayDetails.data" :key="idx"
							class="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
							<div class="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800 flex-shrink-0">
								{{ idx + 1 }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{{ h.description || h.holiday_date }}</div>
								<div class="text-[11px] text-gray-600">{{ h.holiday_date }}</div>
							</div>
							<span v-if="h.weekly_off" class="text-[11px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold">
								{{ __("Weekly Off") }}
							</span>
						</div>
					</div>
				</div>
			</ion-modal>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, reactive, inject, watch, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { IonModal } from "@ionic/vue"
import BaseLayout from "@/components/BaseLayout.vue"
import { FeatherIcon, Switch, createResource, LoadingIndicator, call, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"
import SettingsTabPills from "@/components/SettingsTabPills.vue"
import SettingsSection from "@/components/SettingsSection.vue"
import SettingsSlider from "@/components/SettingsSlider.vue"
import SettingsNumberInput from "@/components/SettingsNumberInput.vue"

const { getDoc: mgrGetDoc, setValue: mgrSetValue, getList: mgrGetList } = useManagerApi()
import soundManager from "@/utils/sounds"

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// ===== TAB SYSTEM =====
const activeTab = ref("general")
const tabs = [
	{ key: "general", label: "General", icon: "settings" },
	{ key: "locations", label: "Locations", icon: "map-pin" },
	{ key: "checkin", label: "Check-in", icon: "log-in" },
	{ key: "security", label: "Security", icon: "shield" },
	{ key: "penalties", label: "Penalties", icon: "alert-triangle" },
	{ key: "rewards", label: "Rewards", icon: "award" },
	{ key: "alerts", label: "Alerts", icon: "bell" },
	{ key: "schedule", label: "Schedule", icon: "calendar" },
]

// ===== ADMIN SETTINGS STATE =====
const settingsLoading = ref(true)
const locationsLoading = ref(true)
const addingLocation = ref(false)
const showAddLocation = ref(false)
const showShiftModal = ref(false)
const showHolidayModal = ref(false)
const selectedShift = ref(null)
const selectedHoliday = ref(null)
const officeLocations = ref([])

const newLocation = reactive({
	name: "",
	latitude: null,
	longitude: null,
	radius: 100,
	wifi_networks: [],
})

const adminSettings = reactive({
	// Check-in
	photo_required: true,
	device_binding_enabled: true,
	face_recognition_enabled: true,
	grace_period_minutes: 15,
	early_leave_grace_minutes: 15,
	max_offline_sync_hours: 24,
	selfie_checkin_enabled: false,
	qr_checkin_enabled: false,
	nfc_checkin_enabled: false,
	biometric_api_enabled: false,
	ip_restriction_enabled: false,
	// Security
	detect_mock_location: true,
	wifi_bssid_verification: false,
	enforce_multi_factor: true,
	detect_location_jump: true,
	location_jump_threshold_km: 50,
	ip_geolocation_check: false,
	auto_escalate_suspicious: true,
	// Penalties
	late_warning_minutes: 30,
	late_minor_minutes: 60,
	late_major_minutes: 120,
	late_minor_deduction: 0.25,
	late_major_deduction: 0.5,
	monthly_late_threshold: 3,
	monthly_late_deduction: 0.5,
	// Overtime
	overtime_day_rate: 1.35,
	overtime_night_rate: 1.70,
	overtime_holiday_rate: 2.00,
	max_daily_hours: 8,
	max_daily_presence: 12,
	// Gamification
	points_on_time: 10,
	points_early: 15,
	points_late: -5,
	points_absent: -10,
	points_streak_5: 25,
	points_streak_10: 50,
	points_streak_20: 100,
	// Scheduling
	open_shift_deadline_hours: 12,
	swap_reminder_days: 1,
	stale_swap_days: 7,
	max_shift_notifications: 10,
	// Notifications
	enable_push_notifications: false,
	enable_whatsapp_notifications: false,
	enable_quiet_hours: true,
	// UI
	sounds_enabled: true,
	streak_visual_enabled: true,
	confetti_on_achievement_enabled: true,
	glassmorphism_enabled: true,
	show_leaderboard: true,
	show_ai_insights: true,
	calendar_heatmap_enabled: false,
})

// ===== EDIT LOCATION STATE =====
const showEditLocation = ref(false)
const savingEdit = ref(false)
const editLocation = reactive({
	row_name: "",
	location_name: "",
	latitude: null,
	longitude: null,
	radius_meters: 100,
	wifi_networks: [],
})

function openEditLocation(loc) {
	editLocation.row_name = loc.name
	editLocation.location_name = loc.location_name || ""
	editLocation.latitude = loc.latitude
	editLocation.longitude = loc.longitude
	editLocation.radius_meters = loc.radius_meters || 100
	// Deep copy wifi_networks array
	const nets = getLocWifiNetworks(loc)
	editLocation.wifi_networks = nets.map(n => ({ ssid: n.ssid || "", bssid: n.bssid || "" }))
	showEditLocation.value = true
}

async function saveEditLocation() {
	if (savingEdit.value) return
	savingEdit.value = true
	try {
		const result = await call(`${API_BASE}.update_office_location`, {
			row_name: editLocation.row_name,
			location_name: editLocation.location_name,
			latitude: editLocation.latitude,
			longitude: editLocation.longitude,
			radius_meters: editLocation.radius_meters,
			wifi_networks: JSON.stringify(editLocation.wifi_networks.filter(n => n.ssid || n.bssid)),
		})
		if (result?.success) {
			const idx = officeLocations.value.findIndex(l => l.name === editLocation.row_name)
			if (idx !== -1) {
				officeLocations.value[idx] = result.location
			}
			showEditLocation.value = false
			toast({ title: __("Saved"), text: __("Location updated"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		}
	} catch (err) {
		_errToast(err, "Failed to update location")
	}
	savingEdit.value = false
}

// ===== DARK MODE =====
const darkMode = ref(false)
try { darkMode.value = localStorage.getItem("icd3s_dark_mode") === "1" } catch(e) {}

function toggleDarkMode() {
	darkMode.value = !darkMode.value
	try { localStorage.setItem("icd3s_dark_mode", darkMode.value ? "1" : "0") } catch(e) {}
	applyDark()
}

function applyDark() {
	try {
		if (darkMode.value) document.documentElement.classList.add("dark")
		else document.documentElement.classList.remove("dark")
	} catch(e) {}
}

// ===== PUSH NOTIFICATIONS (VAPID Web Push) =====
const pushState = ref(false)
const pushLoading = ref(false)

if ("serviceWorker" in navigator && "PushManager" in window) {
	navigator.serviceWorker.ready.then(reg => {
		reg.pushManager.getSubscription().then(sub => { pushState.value = !!sub }).catch(() => {})
	}).catch(() => {})
}

const pushDisabled = computed(() => {
	try {
		return !("PushManager" in window && "serviceWorker" in navigator) || pushLoading.value
	} catch(e) { return true }
})

const pushDescription = computed(() => {
	try {
		if (!("PushManager" in window)) return __("Push not supported in this browser")
		if (!("serviceWorker" in navigator)) return __("Service worker not available")
		return ""
	} catch(e) { return "" }
})

function _b64ToUint8(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = atob(base64)
	const out = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i)
	return out
}

async function togglePush(newVal) {
	pushLoading.value = true
	try {
		const reg = await navigator.serviceWorker.ready
		if (newVal) {
			let perm = Notification.permission
			if (perm === "default") perm = await Notification.requestPermission()
			if (perm !== "granted") { pushState.value = false; return }
			const resp = await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.get_vapid_public_key", {
				headers: { "X-Frappe-CSRF-Token": window.csrf_token || "" }
			})
			const data = await resp.json()
			const vapidKey = data.message?.public_key
			if (!vapidKey) { pushState.value = false; return }
			const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _b64ToUint8(vapidKey) })
			const ua = navigator.userAgent
			await fetch("/api/method/icd3s_attendance.icd3s_attendance.push_service.save_subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": window.csrf_token || "" },
				body: JSON.stringify({
					subscription_json: JSON.stringify(sub.toJSON()),
					browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Other",
					device_type: /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop",
					user_agent: ua,
				}),
			})
			pushState.value = true
		} else {
			const sub = await reg.pushManager.getSubscription()
			if (sub) await sub.unsubscribe()
			pushState.value = false
		}
	} catch(e) {
		_errToast(e, "Failed to toggle push notifications")
	} finally {
		pushLoading.value = false
	}
}

// ===== NOTIFICATION PREFERENCES (API-backed) =====
const prefsLoaded = ref(false)
const isSaving = ref(false)

const prefs = reactive({
	checkin_reminder: 1, checkout_reminder: 1,
	checkin_reminder_time: "08:45:00", checkout_reminder_time: "16:45:00",
	late_warning_alert: 1, penalty_alert: 1, overtime_alert: 1,
	leave_status_alert: 1, salary_ready_alert: 1, commission_alert: 1,
	monthly_summary_alert: 1, push_notifications: 1, email_notifications: 1,
	whatsapp_notifications: 0, quiet_hours_enabled: 0,
	quiet_start: "22:00:00", quiet_end: "07:00:00",
})

const alertItems = [
	{ key: "checkin_reminder", label: "Check-in Reminder", sub: "Before shift starts", icon: "log-in", bg: "bg-green-500" },
	{ key: "checkout_reminder", label: "Check-out Reminder", sub: "Before shift ends", icon: "log-out", bg: "bg-blue-500" },
	{ key: "late_warning_alert", label: "Late Warning", sub: "When running late", icon: "clock", bg: "bg-orange-500" },
	{ key: "penalty_alert", label: "Penalty Alert", sub: "When penalty recorded", icon: "alert-triangle", bg: "bg-red-500" },
	{ key: "overtime_alert", label: "Overtime Alert", sub: "OT approval updates", icon: "trending-up", bg: "bg-purple-500" },
	{ key: "leave_status_alert", label: "Leave Status", sub: "Application updates", icon: "calendar", bg: "bg-teal-500" },
	{ key: "salary_ready_alert", label: "Salary Ready", sub: "Slip available", icon: "dollar-sign", bg: "bg-emerald-500" },
	{ key: "commission_alert", label: "Commission Alert", sub: "New commissions", icon: "gift", bg: "bg-pink-500" },
	{ key: "monthly_summary_alert", label: "Monthly Summary", sub: "End of month report", icon: "bar-chart-2", bg: "bg-indigo-500" },
]

async function loadPrefs() {
	try {
		const empName = employee?.data?.name
		if (!empName) { prefsLoaded.value = true; return }
		const res = await fetch(`/api/method/icd3s_attendance.icd3s_attendance.api.modules.profile.get_notification_preferences?employee=${encodeURIComponent(empName)}`, {
			headers: { "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "", "Accept": "application/json" },
		})
		if (res.ok) {
			const json = await res.json()
			if (json?.message?.preferences) Object.assign(prefs, json.message.preferences)
		}
	} catch(e) {
		console.warn("[Settings] Failed to load prefs:", e)
	}
	prefsLoaded.value = true
}

async function savePrefs() {
	isSaving.value = true
	try {
		const empName = employee?.data?.name
		if (!empName) { toast({ title: __("Error"), text: __("Employee not found"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" }); return }
		const res = await fetch("/api/method/icd3s_attendance.icd3s_attendance.api.modules.profile.update_notification_preferences", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "", "Accept": "application/json" },
			body: JSON.stringify({ employee: empName, preferences: JSON.stringify(prefs) }),
		})
		if (res.ok) {
			toast({ title: __("Saved"), text: __("Preferences updated"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
		} else {
			toast({ title: __("Error"), text: __("Failed to save"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
		}
	} catch(e) {
		console.warn("[Settings] Save error:", e)
		toast({ title: __("Error"), text: __("Network error"), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
	} finally {
		isSaving.value = false
	}
}

// ===== SOUNDS & FEEDBACK (localStorage) =====
const hasSounds = ref(false)
const soundsOn = ref(true)
const sndVolume = ref(0.5)
const tapOn = ref(true)
const hapticOn = ref(true)
const confettiOn = ref(true)
let _sm = null

function initSounds() {
	try {
		_sm = soundManager
		if (_sm && typeof _sm.isEnabled === "function") {
			hasSounds.value = true
			soundsOn.value = _sm.isEnabled()
			sndVolume.value = _sm.getVolume()
			tapOn.value = _sm.isTapSoundsEnabled()
			hapticOn.value = _sm.isHapticEnabled()
			confettiOn.value = _sm.isConfettiEnabled()
		}
	} catch(e) {
		console.warn("[Settings] SoundManager not available:", e)
		hasSounds.value = false
	}
}

function toggleSounds() { soundsOn.value = !soundsOn.value; try { _sm?.setEnabled(soundsOn.value) } catch(e) {} }
function setVol(v) { sndVolume.value = v; try { _sm?.setVolume(v) } catch(e) {} }
function toggleTap() { tapOn.value = !tapOn.value; try { _sm?.setTapSoundsEnabled(tapOn.value) } catch(e) {} }
function toggleHaptic() { hapticOn.value = !hapticOn.value; try { _sm?.setHapticEnabled(hapticOn.value) } catch(e) {} }
function toggleConfetti() { confettiOn.value = !confettiOn.value; try { _sm?.setConfettiEnabled(confettiOn.value) } catch(e) {} }

// ===== RESET =====
function confirmReset() {
	if (!confirm(__("Are you sure you want to reset all settings to default? This cannot be undone."))) return
	resetAll()
}

function resetAll() {
	darkMode.value = false
	try { localStorage.setItem("icd3s_dark_mode", "0") } catch(e) {}
	applyDark()
	try { _sm?.setEnabled(true); _sm?.setVolume(0.5); _sm?.setTapSoundsEnabled(true); _sm?.setHapticEnabled(true); _sm?.setConfettiEnabled(true) } catch(e) {}
	soundsOn.value = true; sndVolume.value = 0.5; tapOn.value = true; hapticOn.value = true; confettiOn.value = true
	toast({ title: __("Reset"), text: __("All settings restored to defaults"), icon: "check-circle", position: "bottom-center", iconClasses: "text-green-500" })
}

// ===== ADMIN SETTINGS LOAD/SAVE =====
function fmtCoord(val) {
	return val != null ? parseFloat(val).toFixed(4) : "-"
}

function getLocWifiNetworks(loc) {
	// Returns array of {ssid, bssid} from loc.wifi_networks (array or JSON string)
	if (loc.wifi_networks) {
		if (Array.isArray(loc.wifi_networks)) return loc.wifi_networks
		try { return JSON.parse(loc.wifi_networks) } catch(e) {}
	}
	// Fallback to old single fields
	if (loc.wifi_ssid || loc.wifi_bssid) {
		return [{ ssid: loc.wifi_ssid || "", bssid: loc.wifi_bssid || "" }]
	}
	return []
}

async function loadAdminSettings() {
	settingsLoading.value = true
	locationsLoading.value = true
	try {
		const data = await call(`${API_BASE}.get_manager_settings`)
		if (data) {
			for (const key of Object.keys(adminSettings)) {
				if (data[key] !== undefined && data[key] !== null) {
					adminSettings[key] = data[key] === 1 ? true : data[key] === 0 ? false : data[key]
				}
			}
			officeLocations.value = data.office_locations || []
		}
	} catch (e) {
		try {
			const doc = await mgrGetDoc({
				doctype: "ICD3S Attendance Settings",
				name: "ICD3S Attendance Settings",
			})
			if (doc) {
				for (const key of Object.keys(adminSettings)) {
					if (doc[key] !== undefined && doc[key] !== null) {
						adminSettings[key] = doc[key] === 1 ? true : doc[key] === 0 ? false : doc[key]
					}
				}
				officeLocations.value = (doc.office_locations || []).map(loc => ({
					name: loc.name,
					location_name: loc.location_name,
					latitude: loc.latitude,
					longitude: loc.longitude,
					radius_meters: loc.radius_meters || 100,
					wifi_ssid: loc.wifi_ssid || "",
					wifi_bssid: loc.wifi_bssid || "",
					wifi_networks: getLocWifiNetworks(loc),
					is_active: loc.is_active,
				}))
			}
		} catch (e2) {
			// Use defaults
		}
	}
	settingsLoading.value = false
	locationsLoading.value = false
}

async function saveAdminField(fieldname, value) {
	const saveValue = value === true ? 1 : value === false ? 0 : value
	adminSettings[fieldname] = value
	try {
		await call(`${API_BASE}.update_attendance_setting`, {
			fieldname: fieldname,
			value: saveValue,
		})
	} catch (e) {
		try {
			await mgrSetValue({
				doctype: "ICD3S Attendance Settings",
				name: "ICD3S Attendance Settings",
				fieldname: fieldname,
				value: saveValue,
			})
		} catch (e2) {
			_errToast(e2, "Failed to save setting")
		}
	}
}

// ===== MOUNT =====
onMounted(() => {
	applyDark()
	initSounds()
	loadPrefs()
	loadAdminSettings()
})

watch(() => employee?.data?.name, (newVal, oldVal) => {
	if (newVal && !oldVal) loadPrefs()
})

// ===== SHIFT & HOLIDAY RESOURCES =====
const shiftTypes = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.manager_get_list",
	makeParams() {
		return {
			doctype: "Shift Type",
			fields: ["name", "start_time", "end_time", "holiday_list"],
			limit_page_length: 100,
		}
	},
	auto: true,
	onError() { shiftTypes.data = [] },
})

const holidayLists = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.manager_get_list",
	makeParams() {
		return {
			doctype: "Holiday List",
			fields: ["name", "total_holidays"],
			order_by: "name desc",
			limit_page_length: 10,
		}
	},
	auto: true,
	onError() { holidayLists.data = [] },
})

const holidayDetails = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.attendance.manager_get",
	makeParams() {
		return {
			doctype: "Holiday List",
			name: selectedHoliday.value?.name,
		}
	},
	transform(doc) {
		return (doc?.holidays || []).sort((a, b) => a.holiday_date?.localeCompare(b.holiday_date))
	},
})

function openShiftDetail(shift) { selectedShift.value = shift; showShiftModal.value = true }
function openHolidayDetail(hl) { selectedHoliday.value = hl; showHolidayModal.value = true; holidayDetails.reload() }

// ===== LOCATION MANAGEMENT =====
function getCurrentLocation() {
	if (!navigator.geolocation) return
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			newLocation.latitude = parseFloat(pos.coords.latitude.toFixed(6))
			newLocation.longitude = parseFloat(pos.coords.longitude.toFixed(6))
		},
		(err) => { console.error("Location error:", err) },
		{ enableHighAccuracy: true }
	)
}

async function addLocation() {
	if (addingLocation.value) return
	addingLocation.value = true
	try {
		const result = await call(`${API_BASE}.add_office_location`, {
			location_name: newLocation.name,
			latitude: newLocation.latitude,
			longitude: newLocation.longitude,
			radius_meters: newLocation.radius,
			wifi_networks: JSON.stringify(newLocation.wifi_networks.filter(n => n.ssid || n.bssid)),
		})
		if (result?.success) {
			officeLocations.value.push(result.location)
			showAddLocation.value = false
			Object.assign(newLocation, { name: "", latitude: null, longitude: null, radius: 100 })
			newLocation.wifi_networks = []
		}
	} catch (err) {
		_errToast(err, "Failed to add location")
	}
	addingLocation.value = false
}

async function removeLocation(loc) {
	if (!confirm(__("Remove this office location?"))) return
	try {
		await call(`${API_BASE}.remove_office_location`, { row_name: loc.name })
		officeLocations.value = officeLocations.value.filter(l => l.name !== loc.name)
	} catch (err) {
		_errToast(err, "Failed to remove location")
	}
}
</script>

<style scoped>
.settings-card {
	background: rgba(255, 255, 255, 0.45);
	border-radius: 0.85rem;
	border: 0.5px solid rgba(255, 255, 255, 0.65);
	box-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.04);
	overflow: hidden;
}
:global(.dark) .settings-card {
	background: rgba(30, 30, 46, 0.45);
	border-color: rgba(255, 255, 255, 0.06);
}
.settings-row {
	display: flex;
	align-items: center;
	padding: 0.85rem 1rem;
	gap: 0.75rem;
}
.settings-icon {
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.settings-label {
	font-size: 0.875rem;
	font-weight: 500;
	color: #1f2937;
}
:global(.dark) .settings-label {
	color: #e5e7eb;
}
.settings-sub {
	font-size: 0.7rem;
	color: #9ca3af;
	margin-top: 1px;
}

/* frappe-ui Switch - scale up for mobile touch targets */
.settings-row :deep(button[role="switch"]) {
	transform: scale(1.5);
	transform-origin: center right;
	margin-right: 4px;
}
/* ICD Purple when ON */
.settings-row :deep(button[role="switch"][aria-checked="true"]) {
	background-color: #4D067B !important;
}
:global(.dark) .settings-row :deep(button[role="switch"][aria-checked="true"]) {
	background-color: #a86cc9 !important;
}

/* Skeleton loading */
.skeleton-pills {
	height: 2.5rem;
	border-radius: 9999px;
	background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;
}
.skeleton-card {
	height: 5rem;
	border-radius: 0.85rem;
	background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;
}
:global(.dark) .skeleton-pills,
:global(.dark) .skeleton-card {
	background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
	background-size: 200% 100%;
}
@keyframes shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}
</style>
