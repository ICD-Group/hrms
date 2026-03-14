<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Submit Defense") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Info Banner -->
				<div class="card-premium p-4 bg-blue-50 border border-blue-200">
					<div class="flex items-start gap-3">
						<FeatherIcon name="info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
						<div class="text-xs text-blue-700 leading-relaxed">
							{{ __("Per Egyptian Labor Law (Art. 64), you have the right to submit a written defense before any penalty is imposed. This is mandatory for your protection.") }}
						</div>
					</div>
				</div>

				<!-- Case Reference -->
				<div class="card-premium p-4">
					<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Case") }}</div>
					<div class="text-sm font-semibold text-gray-900">{{ route.params.id }}</div>
				</div>

				<!-- Defense Text -->
				<section>
					<div class="section-title mb-3">{{ __("Your Written Defense") }} *</div>
					<div class="info-card !p-0">
						<textarea v-model="defenseText"
							:placeholder="__('Explain your side of the situation. Include any relevant facts, circumstances, or justifications...')"
							class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
							rows="6"></textarea>
					</div>
				</section>

				<!-- Mitigating Factors -->
				<section>
					<div class="section-title mb-3">{{ __("Mitigating Factors (Optional)") }}</div>
					<div class="info-card !p-0">
						<textarea v-model="mitigating"
							:placeholder="__('Any circumstances that should reduce the severity...')"
							class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
							rows="3"></textarea>
					</div>
				</section>

				<!-- Submit -->
				<button @click="submitDefense" :disabled="submitting || !defenseText.trim()"
					class="premium-submit disabled:opacity-50">
					<FeatherIcon v-if="!submitting" name="send" class="w-4 mr-2 inline" />
					{{ submitting ? __("Submitting...") : __("Submit Defense") }}
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

const defenseText = ref("")
const mitigating = ref("")
const submitting = ref(false)
const successMsg = ref("")

async function submitDefense() {
	if (!defenseText.value.trim() || submitting.value) return
	submitting.value = true
	successMsg.value = ""

	try {
		const res = await call(`${API_BASE}.submit_defense`, {
			action_name: route.params.id,
			defense_text: defenseText.value.trim(),
		})
		successMsg.value = res?.message || __("Defense submitted successfully")

		setTimeout(() => {
			router.push({ name: "DisciplinaryDetail", params: { id: route.params.id } })
		}, 1500)
	} catch (e) {
		_errToast(e, "Failed to submit defense")
	} finally {
		submitting.value = false
	}
}
</script>
