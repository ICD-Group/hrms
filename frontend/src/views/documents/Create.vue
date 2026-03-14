<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ presetType || __('Upload Document') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Document Type Selector (ONLY if no preset type) -->
				<div v-if="!presetType" class="glass-section p-4">
					<label class="field-label">
						<FeatherIcon name="file-text" class="field-icon" />
						{{ __('Document Type') }} *
					</label>
					<div v-if="docTypes.loading" class="mt-2 text-xs text-gray-600">{{ __('Loading...') }}</div>
					<div v-else class="grid grid-cols-2 gap-2 mt-2">
						<button
							v-for="dt in groupedTypes"
							:key="dt.name"
							@click="form.document_type = dt.name"
							class="text-left p-2.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.97]"
							:class="form.document_type === dt.name
								? 'border-[var(--icd-purple-300)] bg-icd-50 text-icd-600'
								: 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'"
						>
							<div class="flex items-center gap-1.5">
								<FeatherIcon :name="categoryIcon(dt.category)" class="w-3.5 h-3.5 flex-shrink-0" />
								<span class="truncate">{{ dt.type_name }}</span>
							</div>
							<div v-if="dt.is_mandatory" class="text-[11px] text-red-500 mt-0.5 ml-5">{{ __('Required') }}</div>
						</button>
					</div>
				</div>

				<!-- Document Title -->
				<div class="glass-section p-4">
					<div class="field-group">
						<label class="field-label">
							<FeatherIcon name="type" class="field-icon" />
							{{ __('Document Title') }} *
						</label>
						<input
							v-model="form.document_title"
							type="text"
							:placeholder="titlePlaceholder"
							class="premium-input"
						/>
					</div>
				</div>

				<!-- Dates -->
				<div class="glass-section p-4">
					<div class="field-row">
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="calendar" class="field-icon" />
								{{ __('Issue Date') }}
							</label>
							<input
								v-model="form.issue_date"
								type="date"
								class="premium-input"
							/>
						</div>
						<div class="field-group">
							<label class="field-label">
								<FeatherIcon name="calendar" class="field-icon" />
								{{ __('Expiry Date') }}
							</label>
							<input
								v-model="form.expiry_date"
								type="date"
								class="premium-input"
							/>
						</div>
					</div>
				</div>

				<!-- Smart File Slots -->
				<div class="glass-section p-4">
					<label class="field-label mb-3">
						<FeatherIcon name="camera" class="field-icon" />
						{{ __('Photos / Files') }} *
					</label>

					<div class="flex flex-col gap-3">
						<div v-for="(slot, idx) in fileSlots" :key="idx">
							<!-- Slot Label -->
							<div class="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
								<FeatherIcon :name="slot.icon" class="w-3.5 h-3.5" />
								{{ __(slot.label) }}
								<span v-if="slot.required" class="text-red-500">*</span>
							</div>

							<!-- Uploaded Preview -->
							<div v-if="slotFiles[idx]" class="relative">
								<!-- Image Preview -->
								<div v-if="isImage(slotFiles[idx].name)" class="relative rounded-xl overflow-hidden border border-white/40 dark:border-white/10">
									<img
										:src="slotFiles[idx].url"
										class="w-full h-40 object-cover"
										:alt="slot.label"
									/>
									<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
										<span class="text-xs text-white font-medium">{{ slotFiles[idx].name }}</span>
									</div>
								</div>
								<!-- File Preview (PDF etc) -->
								<div v-else class="flex items-center gap-2 p-3 glass-card rounded-xl">
									<div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
										<FeatherIcon name="check-circle" class="w-5 h-5 text-green-500" />
									</div>
									<div class="flex-1 min-w-0">
										<span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate block">{{ slotFiles[idx].name }}</span>
									</div>
								</div>
								<!-- Remove button -->
								<button
									@click="removeSlotFile(idx)"
									class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
								>
									<FeatherIcon name="x" class="w-4 h-4" />
								</button>
							</div>

							<!-- Capture Area - Single tap, phone shows camera/gallery natively -->
							<label
								v-else
								class="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-200 dark:border-white/15 rounded-xl cursor-pointer active:scale-[0.97] transition-all hover:border-[var(--icd-purple-300)] hover:bg-icd-50/30"
								:class="{ 'opacity-50 pointer-events-none': uploadingSlot === idx }"
							>
								<div v-if="uploadingSlot === idx" class="flex items-center gap-2">
									<div class="w-5 h-5 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
									<span class="text-xs text-icd-600 font-medium">{{ __('Uploading...') }}</span>
								</div>
								<template v-else>
									<div class="w-10 h-10 rounded-xl bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center">
										<FeatherIcon :name="slot.icon" class="w-5 h-5 text-icd-600 dark:text-icd-300" />
									</div>
									<span class="text-xs font-medium text-gray-700">{{ __('Tap to capture or select') }}</span>
								</template>
								<input type="file" class="hidden" accept="image/*,.pdf" @change="e => handleSlotCapture(e, idx)" />
							</label>
						</div>
					</div>
				</div>

				<!-- Submit Button -->
				<div class="sticky bottom-4 px-1 pb-2">
					<button
						@click="submitDocument"
						:disabled="!canSubmit || submitting"
						class="premium-submit gap-2"
					>
						<span v-if="submitting" class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{{ __('Uploading...') }}
						</span>
						<span v-else class="flex items-center justify-center gap-2">
							<FeatherIcon name="upload" class="w-5 h-5" />
							{{ __('Upload Document') }}
						</span>
					</button>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, reactive, computed, inject } from "vue"
import { useRouter, useRoute } from "vue-router"
import { createResource, FeatherIcon, Button, call, toast } from "frappe-ui"

const __ = inject("$translate")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}
const router = useRouter()
const route = useRoute()

const presetType = route.query.type || ""

const submitting = ref(false)
const uploadingSlot = ref(-1)
const slotFiles = ref({})

const form = reactive({
	document_type: presetType,
	document_title: "",
	issue_date: "",
	expiry_date: "",
})

const docTypes = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_document_types",
	auto: !presetType,
	cache: "doc_center:document_types",
})

const groupedTypes = computed(() => docTypes.data || [])

// Smart file slots based on document type
const fileSlots = computed(() => {
	const t = (form.document_type || presetType || "").toLowerCase()

	if (t.includes("national id") || t.includes("id card"))
		return [
			{ label: "Front Side", icon: "credit-card", required: true },
			{ label: "Back Side", icon: "credit-card", required: true },
		]

	if (t.includes("driver") || t.includes("license"))
		return [
			{ label: "Front Side", icon: "credit-card", required: true },
			{ label: "Back Side", icon: "credit-card", required: true },
		]

	if (t.includes("insurance"))
		return [
			{ label: "Card Front", icon: "credit-card", required: true },
			{ label: "Card Back", icon: "credit-card", required: false },
		]

	if (t.includes("passport"))
		return [{ label: "Photo Page", icon: "book-open", required: true }]

	if (t.includes("military"))
		return [{ label: "Certificate", icon: "shield", required: true }]

	if (t.includes("birth"))
		return [{ label: "Birth Certificate", icon: "file-text", required: true }]

	if (t.includes("degree") || t.includes("university"))
		return [{ label: "Degree Certificate", icon: "award", required: true }]

	if (t.includes("professional") || t.includes("certificate"))
		return [{ label: "Certificate", icon: "award", required: true }]

	if (t.includes("medical"))
		return [{ label: "Medical Report", icon: "heart", required: true }]

	if (t.includes("criminal"))
		return [{ label: "Criminal Record", icon: "file-text", required: true }]

	if (t.includes("contract"))
		return [{ label: "Contract Document", icon: "file-text", required: true }]

	if (t.includes("bank"))
		return [{ label: "Bank Letter", icon: "dollar-sign", required: true }]

	return [{ label: "Document", icon: "file", required: true }]
})

const canSubmit = computed(() => {
	if (!form.document_type || !form.document_title) return false
	// At least the first required slot must have a file
	const requiredSlots = fileSlots.value.filter((s, i) => s.required)
	return requiredSlots.every((s, i) => {
		const slotIdx = fileSlots.value.indexOf(s)
		return slotFiles.value[slotIdx]
	})
})

const titlePlaceholder = computed(() => {
	if (presetType) return presetType
	return __("e.g., National ID Card")
})

function categoryIcon(cat) {
	switch (cat) {
		case "Identity": return "credit-card"
		case "Education": return "award"
		case "Professional": return "briefcase"
		case "Medical": return "heart"
		case "Legal": return "file-text"
		case "Financial": return "dollar-sign"
		default: return "file"
	}
}

function isImage(name) {
	const ext = (name || "").split(".").pop().toLowerCase()
	return ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)
}

async function handleSlotCapture(event, slotIndex) {
	const file = event.target.files[0]
	if (!file) return
	if (file.size > 10 * 1024 * 1024) {
		alert(__("File size must be less than 10MB"))
		return
	}

	uploadingSlot.value = slotIndex
	const formData = new FormData()
	formData.append("file", file)
	formData.append("is_private", "1")
	formData.append("folder", "Home")

	try {
		const response = await fetch("/api/method/upload_file", {
			method: "POST",
			body: formData,
			headers: {
				"X-Frappe-CSRF-Token": window.csrf_token,
			},
		})
		const data = await response.json()
		if (data.message?.file_url) {
			slotFiles.value = {
				...slotFiles.value,
				[slotIndex]: { name: file.name, url: data.message.file_url },
			}
		}
	} catch (e) {
		_errToast(e, "Upload failed. Please try again.")
	} finally {
		uploadingSlot.value = -1
		event.target.value = ""
	}
}

function removeSlotFile(index) {
	const updated = { ...slotFiles.value }
	delete updated[index]
	slotFiles.value = updated
}

async function submitDocument() {
	if (!canSubmit.value || submitting.value) return
	submitting.value = true

	try {
		// First file = main document_file, rest = additional
		const allFiles = []
		for (let i = 0; i < fileSlots.value.length; i++) {
			if (slotFiles.value[i]) allFiles.push(slotFiles.value[i].url)
		}

		const mainFile = allFiles[0]
		const additionalFiles = allFiles.slice(1)

		await call(
			"icd3s_document_center.icd3s_document_center.api.create_employee_document",
			{
				document_type: form.document_type,
				document_title: form.document_title,
				document_file: mainFile,
				issue_date: form.issue_date || undefined,
				expiry_date: form.expiry_date || undefined,
				additional_files: additionalFiles.length ? JSON.stringify(additionalFiles) : undefined,
			}
		)
		router.back()
	} catch (e) {
		_errToast(e, "Failed to upload document")
	} finally {
		submitting.value = false
	}
}
</script>
