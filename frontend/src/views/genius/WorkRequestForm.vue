<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("WFH / Mission") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Request Type -->
				<section>
					<div class="section-title mb-3">{{ __("Request Type") }}</div>
					<div class="grid grid-cols-2 gap-3">
						<button
							v-for="opt in typeOptions" :key="opt.value"
							@click="form.request_type = opt.value"
							class="card-premium p-4 text-center transition-all"
							:class="form.request_type === opt.value
								? 'ring-2 ring-icd-500 bg-icd-50/50'
								: 'hover:bg-gray-100'"
						>
							<FeatherIcon :name="opt.icon" class="w-6 h-6 mx-auto mb-1.5"
								:class="form.request_type === opt.value ? 'text-icd-600' : 'text-gray-600'" />
							<div class="text-xs font-bold"
								:class="form.request_type === opt.value ? 'text-icd-700' : 'text-gray-600'">
								{{ __(opt.label) }}
							</div>
						</button>
					</div>
				</section>

				<!-- Date & Time -->
				<section>
					<div class="section-title mb-3">{{ __("Date & Time") }}</div>
					<div class="info-card !p-0 overflow-hidden divide-y divide-gray-100">
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("From") }}</label>
							<input type="datetime-local" v-model="form.from_datetime"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("To") }}</label>
							<input type="datetime-local" v-model="form.to_datetime"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
					</div>
					<div v-if="totalHours > 0" class="mt-2 text-center">
						<span class="text-xs font-bold text-icd-600 bg-icd-50 px-3 py-1 rounded-full">
							{{ totalHours }} {{ __("hours") }}
						</span>
					</div>
				</section>

				<!-- Reason -->
				<section>
					<div class="section-title mb-3">{{ __("Reason") }}</div>
					<div class="info-card !p-0">
						<textarea v-model="form.reason" :placeholder="__('Why do you need this request?')"
							class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
							rows="3"></textarea>
					</div>
				</section>

				<!-- Mission Fields (conditional) -->
				<section v-if="form.request_type === 'Mission'">
					<div class="section-title mb-3">{{ __("Mission Details") }}</div>
					<div class="info-card !p-0 overflow-hidden divide-y divide-gray-100">
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Location") }} *</label>
							<input type="text" v-model="form.mission_location"
								:placeholder="__('e.g., Client Office, Maadi')"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Client / Site") }}</label>
							<input type="text" v-model="form.mission_client"
								:placeholder="__('e.g., ACME Corp')"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
					</div>
				</section>

				<!-- Submit -->
				<button @click="submitRequest" :disabled="submitting || !isValid"
					class="premium-submit disabled:opacity-50">
					<FeatherIcon v-if="!submitting" name="send" class="w-4 mr-2 inline" />
					{{ submitting ? __("Submitting...") : __("Submit Request") }}
				</button>

				<!-- Success Message -->
				<div v-if="successMsg" class="card-premium p-4 text-center bg-green-50 border border-green-200">
					<FeatherIcon name="check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
					<div class="text-sm font-bold text-green-700">{{ successMsg }}</div>
				</div>

			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { FeatherIcon, call, toast } from "frappe-ui"

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

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const typeOptions = [
	{ value: "Work From Home", label: "Work From Home", icon: "home" },
	{ value: "Mission", label: "Mission", icon: "map-pin" },
]

const form = reactive({
	request_type: "Work From Home",
	from_datetime: "",
	to_datetime: "",
	reason: "",
	mission_location: "",
	mission_client: "",
})

const submitting = ref(false)
const successMsg = ref("")

const totalHours = computed(() => {
	if (!form.from_datetime || !form.to_datetime) return 0
	const from = new Date(form.from_datetime)
	const to = new Date(form.to_datetime)
	if (to <= from) return 0
	return Math.round(((to - from) / 3600000) * 10) / 10
})

const isValid = computed(() => {
	if (!form.from_datetime || !form.to_datetime || !form.reason.trim()) return false
	if (totalHours.value <= 0) return false
	if (form.request_type === "Mission" && !form.mission_location.trim()) return false
	return true
})

async function submitRequest() {
	if (!isValid.value || submitting.value) return
	submitting.value = true
	successMsg.value = ""

	try {
		const params = {
			request_type: form.request_type,
			from_datetime: form.from_datetime,
			to_datetime: form.to_datetime,
			reason: form.reason,
		}
		if (form.request_type === "Mission") {
			params.mission_location = form.mission_location
			params.mission_client = form.mission_client
		}

		const res = await call(`${API_BASE}.submit_work_request`, params)
		successMsg.value = res?.message || __("Request submitted successfully")

		// Reset form
		form.from_datetime = ""
		form.to_datetime = ""
		form.reason = ""
		form.mission_location = ""
		form.mission_client = ""
	} catch (e) {
		_errToast(e, "Failed to submit request")
	} finally {
		submitting.value = false
	}
}
</script>
