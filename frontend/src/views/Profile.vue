<template>
	<ion-page>
		<!-- Ambient gradient background -->
		<div class="app-bg-ambient"></div>

		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<div class="w-full">
					<header
						class="flex items-center px-4 py-2.5 sticky top-0 z-10 glass-header"
					>
						<Button
							variant="ghost"
							class="!pl-0 hover:bg-white/50"
							@click="router.back()"
						>
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __("Profile") }}</h2>
					</header>

					<div class="flex flex-col items-center mt-5 p-4">
						<!-- Profile Image with Upload -->
						<div class="relative" @click="triggerPhotoUpload">
							<img
								v-if="user.data.user_image"
								class="h-28 w-28 rounded-full object-cover ring-3 ring-white/60 shadow-lg"
								:src="user.data.user_image"
								:alt="user.data.first_name"
							/>
							<div
								v-else
								class="flex items-center justify-center bg-icd-100 dark:bg-icd-800/40 uppercase text-icd-600 dark:text-icd-300 h-28 w-28 rounded-full object-cover ring-3 ring-white/60 shadow-lg text-2xl"
							>
								{{ user.data.first_name[0] }}
							</div>
							<!-- Camera overlay -->
							<div class="absolute bottom-0 right-0 w-8 h-8 bg-icd-600 rounded-full flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-90 transition-transform">
								<FeatherIcon v-if="!photoUploading" name="camera" class="w-3.5 h-3.5 text-white" />
								<span v-else class="w-3.5 h-3.5 text-white animate-spin text-xs">&#8635;</span>
							</div>
							<input
								ref="photoInput"
								type="file"
								accept="image/*"
								class="hidden"
								@change="uploadProfilePhoto"
							/>
						</div>

						<div class="flex flex-col gap-1.5 items-center mt-2 mb-5">
							<span v-if="employee" class="text-lg font-bold text-gray-900 dark:text-white">{{
								employee?.data?.employee_name
							}}</span>
							<span v-if="employee" class="font-normal text-sm text-gray-700 dark:text-gray-400">{{
								employee?.data?.designation
							}}</span>
						</div>

						<!-- Profile Links -->
						<div class="flex flex-col gap-5 my-4 w-full">
							<div class="flex flex-col glass-section rounded-xl overflow-hidden">
								<div
									class="flex flex-row cursor-pointer flex-start p-4 items-center justify-between"
									:class="link !== profileLinks[profileLinks.length - 1] && 'border-b border-white/40'"
									v-for="link in profileLinks"
									:key="link.title"
									@click="openInfoModal(link)"
								>
									<div class="flex flex-row items-center gap-3 grow">
										<FeatherIcon
											:name="link.icon"
											class="h-5 w-5 text-gray-700 dark:text-gray-400"
										/>
										<div class="text-base font-normal text-gray-800 dark:text-gray-200">
											{{ link.title }}
										</div>
									</div>
									<FeatherIcon
										name="chevron-right"
										class="h-5 w-5 text-gray-600 dark:text-gray-500"
									/>
								</div>
							</div>
						</div>

						<!-- Manager Mode Toggle -->
						<div
							class="flex flex-col gap-5 my-4 w-full"
							v-if="isManager"
						>
							<div class="flex flex-col glass-section rounded-xl overflow-hidden">
								<div
									class="flex flex-row cursor-pointer flex-start p-4 items-center justify-between active:bg-white/30 transition-colors"
									@click="toggleMode"
								>
									<div class="flex flex-row items-center gap-3 grow">
										<FeatherIcon
											:name="isManagerMode ? 'shield' : 'user'"
											class="h-5 w-5"
											:class="isManagerMode ? 'text-icd-600 dark:text-icd-300' : 'text-gray-700 dark:text-gray-400'"
										/>
										<div>
											<div class="text-base font-semibold" :class="isManagerMode ? 'text-icd-700 dark:text-icd-200' : 'text-gray-800 dark:text-gray-200'">
												{{ isManagerMode ? __("Manager Mode") : __("Employee Mode") }}
											</div>
											<div class="text-xs text-gray-700 dark:text-gray-400">
												{{ isManagerMode ? __("Tap to switch to Employee") : __("Tap to switch to Manager") }}
											</div>
										</div>
									</div>
									<!-- Toggle pill -->
									<div
										class="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0"
										:class="isManagerMode ? 'bg-icd-600' : 'bg-gray-300 dark:bg-gray-600'"
									>
										<div
											class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200"
											:class="isManagerMode ? 'translate-x-5' : 'translate-x-0.5'"
										></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Settings -->
						<div
							class="flex flex-col gap-5 my-4 w-full"
						>
							<div class="flex flex-col glass-section rounded-xl overflow-hidden">
								<router-link
									:to="{ name: 'Settings' }"
									class="flex flex-row cursor-pointer flex-start p-4 items-center justify-between"
								>
									<div class="flex flex-row items-center gap-3 grow">
										<FeatherIcon
											name="settings"
											class="h-5 w-5 text-gray-700 dark:text-gray-400"
										/>
										<div class="text-base font-normal text-gray-800 dark:text-gray-200">
											{{ __("Settings") }}
										</div>
									</div>
									<FeatherIcon
										name="chevron-right"
										class="h-5 w-5 text-gray-600 dark:text-gray-500"
									/>
								</router-link>
							</div>
						</div>

						<!-- Clear Cache & Refresh -->
						<div class="flex flex-col gap-5 my-4 w-full">
							<div class="flex flex-col glass-section rounded-xl overflow-hidden">
								<div
									@click="clearCacheAndRefresh"
									class="flex flex-row cursor-pointer flex-start p-4 items-center justify-between active:bg-white/40 transition-colors"
								>
									<div class="flex flex-row items-center gap-3 grow">
										<FeatherIcon
											name="refresh-cw"
											class="h-5 w-5 text-gray-700 dark:text-gray-400"
											:class="{ 'animate-spin': cacheClearing }"
										/>
										<div>
											<div class="text-base font-normal text-gray-800 dark:text-gray-200">
												{{ __("Clear Cache & Refresh") }}
											</div>
											<div class="text-xs text-gray-600 dark:text-gray-500">
												{{ __("Fix loading issues") }}
											</div>
										</div>
									</div>
									<FeatherIcon
										v-if="!cacheClearing"
										name="chevron-right"
										class="h-5 w-5 text-gray-600 dark:text-gray-500"
									/>
									<span v-else class="text-xs text-gray-600 dark:text-gray-500">{{ __("Clearing...") }}</span>
								</div>
							</div>
						</div>

						<Button
							@click="logout"
							variant="outline"
							theme="red"
							class="w-full shadow py-4 mt-5"
						>
							<template #prefix>
								<FeatherIcon name="log-out" class="w-4" />
							</template>
							{{ __("Log Out") }}
						</Button>
					</div>
				</div>
			</div>

			<ion-modal
				ref="modal"
				:is-open="isInfoModalOpen"
				@didDismiss="closeInfoModal"
				:initial-breakpoint="1"
				:breakpoints="[0, 1]"
			>
				<ProfileInfoModal
					:title="selectedItem.title"
					:data="
						selectedItem.fields.map((field) => {
							const [label, fieldtype] = getFieldInfo(field)
							return {
								fieldname: field,
								value: employeeDoc.doc[field],
								label: label,
								fieldtype: fieldtype,
							}
						})
					"
				/>
			</ion-modal>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, inject, ref, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { IonModal, IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, createDocumentResource, createResource, toast } from "frappe-ui"

import { formatCurrency } from "@/utils/formatters"

import ProfileInfoModal from "@/components/ProfileInfoModal.vue"

import { arePushNotificationsEnabled } from "@/data/notifications"

import { useManagerMode, hasManagerRole } from "@/composables/managerMode"

const DOCTYPE = "Employee"

const socket = inject("$socket")
const session = inject("$session")
const user = inject("$user")
const employee = inject("$employee")
const __ = inject("$translate")

const router = useRouter()
const { isManagerMode } = useManagerMode()

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

function toggleMode() {
	if (isManagerMode.value) {
		isManagerMode.value = false
		router.push("/home")
	} else {
		isManagerMode.value = true
		router.push("/manager/dashboard")
	}
}

const profileLinks = [
	{
		icon: "user",
		title: __("Employee Details"),
		fields: [
			"employee_name",
			"employee_number",
			"gender",
			"date_of_birth",
			"date_of_joining",
			"blood_group",
		],
	},
	{
		icon: "file",
		title: __("Company Information"),
		fields: [
			"company",
			"department",
			"designation",
			"branch",
			"grade",
			"reports_to",
			"employment_type",
		],
	},
	{
		icon: "book",
		title: __("Contact Information"),
		fields: [
			"cell_number",
			"personal_email",
			"company_email",
			"preferred_email",
		],
	},
	{
		icon: "dollar-sign",
		title: __("Salary Information"),
		fields: [
			"ctc",
			"payroll_cost_center",
			"pan_number",
			"provident_fund_account",
			"salary_mode",
			"bank_name",
			"bank_ac_no",
			"ifsc_code",
			"micr_code",
			"iban",
		],
	},
]

const isInfoModalOpen = ref(false)
const selectedItem = ref(null)
const photoInput = ref(null)
const photoUploading = ref(false)
const cacheClearing = ref(false)

const isManager = computed(() => {
	return hasManagerRole(user?.data?.roles || [])
})

function triggerPhotoUpload() {
	photoInput.value?.click()
}

async function uploadProfilePhoto(event) {
	const file = event.target.files?.[0]
	if (!file) return

	photoUploading.value = true
	try {
		// Fix EXIF orientation: draw on canvas (browser auto-applies rotation)
		const img = new Image()
		const url = URL.createObjectURL(file)
		await new Promise((resolve, reject) => {
			img.onload = resolve
			img.onerror = reject
			img.src = url
		})

		// Resize to max 800px for faster uploads
		const maxSize = 800
		let w = img.naturalWidth
		let h = img.naturalHeight
		if (w > maxSize || h > maxSize) {
			if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
			else { w = Math.round(w * maxSize / h); h = maxSize }
		}

		const canvas = document.createElement("canvas")
		canvas.width = w
		canvas.height = h
		const ctx = canvas.getContext("2d")
		ctx.drawImage(img, 0, 0, w, h)
		URL.revokeObjectURL(url)

		// Export as JPEG (strips EXIF, correct orientation baked in)
		const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85))
		const fixedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })

		const formData = new FormData()
		formData.append("file", fixedFile)
		formData.append("doctype", "User")
		formData.append("docname", user.data.name)
		formData.append("fieldname", "user_image")
		formData.append("is_private", "0")

		const csrfToken = window.csrf_token || window.frappe?.csrf_token || ""
		const res = await fetch("/api/method/upload_file", {
			method: "POST",
			body: formData,
			headers: { "X-Frappe-CSRF-Token": csrfToken },
		})
		const data = await res.json()
		if (data.message?.file_url) {
			user.data.user_image = data.message.file_url
			user.reload?.()
		}
	} catch (err) {
		_errToast(err, "Photo upload failed")
	}
	photoUploading.value = false
	// Reset input so same file can be re-selected
	if (photoInput.value) photoInput.value.value = ""
}

const allowPushNotifications = computed(
	() =>
		window.frappe?.boot.push_relay_server_url &&
		arePushNotificationsEnabled.data
)

const openInfoModal = async (request) => {
	selectedItem.value = request
	isInfoModalOpen.value = true
}

const closeInfoModal = async (_request) => {
	isInfoModalOpen.value = false
	selectedItem.value = null
}

const employeeDoc = createDocumentResource({
	doctype: DOCTYPE,
	name: employee.data.name,
	fields: "*",
	auto: true,
	transform: (data) => {
		data.ctc = formatCurrency(data.ctc, data.salary_currency)
		return data
	},
})

const employeeDocType = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: DOCTYPE },
	auto: true,
})

const getFieldInfo = (fieldname) => {
	const field = employeeDocType.data.find(
		(field) => field.fieldname === fieldname
	)
	return [__(field?.label, null, "Employee"), field?.fieldtype]
}

const clearCacheAndRefresh = async () => {
	cacheClearing.value = true
	try {
		// 1. Clear all browser caches
		if ("caches" in window) {
			const names = await caches.keys()
			await Promise.all(names.map((name) => caches.delete(name)))
		}

		// 2. Unregister all service workers
		if ("serviceWorker" in navigator) {
			const regs = await navigator.serviceWorker.getRegistrations()
			await Promise.all(regs.map((reg) => reg.unregister()))
		}

		// 3. Clear session storage cache flags
		sessionStorage.clear()

		// 4. Force full reload from server
		setTimeout(() => {
			window.location.reload()
		}, 300)
	} catch (err) {
		_errToast(err, "Failed to clear cache")
		cacheClearing.value = false
		window.location.reload()
	}
}

const logout = async () => {
	try {
		await session.logout.submit()
	} catch (e) {
		_errToast(e, "An error occurred while attempting to log out!")
	}
}

onMounted(() => {
	socket.emit("doctype_subscribe", DOCTYPE)
	socket.on("list_update", (data) => {
		if (data.doctype === DOCTYPE && data.name === employee.data.name) {
			employeeDoc.reload()
		}
	})
})

onBeforeUnmount(() => {
	socket.emit("doctype_unsubscribe", DOCTYPE)
	socket.off("list_update")
})
</script>
