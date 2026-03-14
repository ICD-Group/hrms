<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("File Appeal") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Warning Banner -->
				<div class="card-premium p-4 bg-orange-50 border border-orange-200">
					<div class="flex items-start gap-3">
						<FeatherIcon name="alert-triangle" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
						<div class="text-xs text-orange-700 leading-relaxed">
							{{ __("Per Art. 146, you have 3 business days from the penalty date to file an appeal. This is a formal process.") }}
						</div>
					</div>
				</div>

				<!-- Case Reference -->
				<div class="card-premium p-4">
					<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Appealing Case") }}</div>
					<div class="text-sm font-semibold text-gray-900">{{ route.params.id }}</div>
				</div>

				<!-- Appeal Reason -->
				<section>
					<div class="section-title mb-3">{{ __("Appeal Reason") }} *</div>
					<div class="info-card !p-0">
						<textarea v-model="appealReason"
							:placeholder="__('Explain why you believe the penalty should be reconsidered. Include new evidence or procedural concerns...')"
							class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
							rows="6"></textarea>
					</div>
				</section>

				<!-- Submit -->
				<button @click="submitAppeal" :disabled="submitting || !appealReason.trim()"
					class="premium-submit disabled:opacity-50">
					<FeatherIcon v-if="!submitting" name="send" class="w-4 mr-2 inline" />
					{{ submitting ? __("Submitting...") : __("Submit Appeal") }}
				</button>

				<!-- Success -->
				<div v-if="successMsg" class="card-premium p-4 text-center bg-green-50 border border-green-200">
					<FeatherIcon name="check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
					<div class="text-sm font-bold text-green-700">{{ successMsg }}</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, inject } from "vue"
import { useRouter, useRoute } from "vue-router"
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
const route = useRoute()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

const appealReason = ref("")
const submitting = ref(false)
const successMsg = ref("")

async function submitAppeal() {
	if (!appealReason.value.trim() || submitting.value) return
	submitting.value = true
	successMsg.value = ""

	try {
		const res = await call(`${API_BASE}.submit_appeal`, {
			action_name: route.params.id,
			appeal_reason: appealReason.value.trim(),
		})
		successMsg.value = res?.message || __("Appeal submitted successfully")

		setTimeout(() => {
			router.push({ name: "DisciplinaryDetail", params: { id: route.params.id } })
		}, 1500)
	} catch (e) {
		_errToast(e, "Failed to submit appeal")
	} finally {
		submitting.value = false
	}
}
</script>
