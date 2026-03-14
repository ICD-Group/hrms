<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Meal Request") }}</h2>
			</div>
		</ion-header>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Cutoff Warning -->
				<div v-if="settings && !settings.is_before_cutoff"
					class="flex items-center gap-2.5 p-3 bg-orange-50 border border-orange-200 rounded-xl">
					<FeatherIcon name="alert-triangle" class="w-5 h-5 text-orange-500 flex-shrink-0" />
					<div class="text-xs text-orange-700 font-semibold">
						{{ __("Cutoff time ({0}) has passed. Request may need special approval.", [settings.cutoff_time]) }}
					</div>
				</div>

				<!-- Meal Type -->
				<section>
					<div class="section-title mb-3">{{ __("Meal Type") }}</div>
					<div class="grid grid-cols-2 gap-3">
						<button
							v-for="opt in mealTypes" :key="opt.value"
							@click="form.meal_type = opt.value"
							class="card-premium p-4 text-center transition-all"
							:class="form.meal_type === opt.value
								? 'ring-2 ring-icd-500 bg-icd-50/50'
								: 'hover:bg-gray-100'"
						>
							<FeatherIcon :name="opt.icon" class="w-6 h-6 mx-auto mb-1.5"
								:class="form.meal_type === opt.value ? 'text-icd-600' : 'text-gray-600'" />
							<div class="text-xs font-bold"
								:class="form.meal_type === opt.value ? 'text-icd-700' : 'text-gray-600'">
								{{ __(opt.label) }}
							</div>
						</button>
					</div>
				</section>

				<!-- Restaurant & Details -->
				<section>
					<div class="section-title mb-3">{{ __("Details") }}</div>
					<div class="info-card !p-0 overflow-hidden divide-y divide-gray-100">
						<!-- Restaurant Selector -->
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Restaurant") }} *</label>
							<select v-if="restaurants.length" v-model="form.restaurant_name"
								class="w-full text-sm text-gray-800 bg-transparent outline-none">
								<option value="" disabled>{{ __("Select restaurant...") }}</option>
								<option v-for="r in restaurants" :key="r.name" :value="r.name">
									{{ r.name }} (max {{ fmt(r.max_amount) }})
								</option>
								<option value="__other">{{ __("Other...") }}</option>
							</select>
							<input v-else type="text" v-model="form.restaurant_name"
								:placeholder="__('e.g., Pizza Hut, KFC')"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
						<!-- Custom restaurant name if "Other" -->
						<div v-if="form.restaurant_name === '__other'" class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Restaurant Name") }} *</label>
							<input type="text" v-model="form.custom_restaurant"
								:placeholder="__('Enter restaurant name')"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Amount (EGP)") }} *</label>
							<input type="number" v-model="form.amount" min="0" step="0.01"
								:placeholder="maxAmountHint"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
							<div v-if="selectedMaxAmount > 0 && form.amount > selectedMaxAmount"
								class="text-[11px] text-red-500 mt-1 font-semibold">
								Exceeds max {{ fmt(selectedMaxAmount) }} for this restaurant
							</div>
						</div>
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Description") }}</label>
							<input type="text" v-model="form.meal_description"
								:placeholder="__('e.g., 2x Chicken Meal + Drinks')"
								class="w-full text-sm text-gray-800 bg-transparent outline-none" />
						</div>
						<div class="p-3.5">
							<label class="text-[11px] font-bold text-gray-600 uppercase mb-1 block">{{ __("Paid By") }}</label>
							<select v-model="form.paid_by"
								class="w-full text-sm text-gray-800 bg-transparent outline-none">
								<option v-for="opt in paidByOptions" :key="opt" :value="opt">{{ opt }}</option>
							</select>
						</div>
					</div>
				</section>

				<!-- Reason -->
				<section>
					<div class="section-title mb-3">{{ __("Reason") }}</div>
					<div class="info-card !p-0">
						<textarea v-model="form.reason" :placeholder="__('e.g., Overtime, late work, client meeting')"
							class="w-full p-3.5 text-sm text-gray-800 bg-transparent outline-none resize-none"
							rows="3"></textarea>
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
import { ref, reactive, computed, inject, onMounted } from "vue"
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

const API = "icd3s_attendance.icd3s_attendance.api.attendance"

const mealTypes = [
	{ value: "Breakfast", label: "Breakfast", icon: "coffee" },
	{ value: "Lunch", label: "Lunch", icon: "sun" },
	{ value: "Dinner", label: "Dinner", icon: "moon" },
	{ value: "Snack", label: "Snack", icon: "package" },
]

const settings = ref(null)
const restaurants = ref([])
const paidByOptions = ref(["Company", "Employee"])

const form = reactive({
	meal_type: "Lunch",
	restaurant_name: "",
	custom_restaurant: "",
	amount: "",
	meal_description: "",
	paid_by: "Company",
	reason: "",
})

const submitting = ref(false)
const successMsg = ref("")

const selectedMaxAmount = computed(() => {
	if (!form.restaurant_name || form.restaurant_name === "__other") return 0
	const r = restaurants.value.find(x => x.name === form.restaurant_name)
	return r?.max_amount || 0
})

const maxAmountHint = computed(() => {
	if (selectedMaxAmount.value > 0) return `Max ${fmt(selectedMaxAmount.value)}`
	return __("e.g., 150")
})

const isValid = computed(() => {
	const rName = form.restaurant_name === "__other" ? form.custom_restaurant?.trim() : form.restaurant_name?.trim()
	if (!rName) return false
	if (!form.amount || parseFloat(form.amount) <= 0) return false
	return true
})

async function loadSettings() {
	try {
		const res = await call(`${API}.get_meal_settings`)
		settings.value = res
		restaurants.value = res?.restaurants || []
		paidByOptions.value = res?.paid_by_options || ["Company", "Employee"]
		if (res?.default_paid_by) form.paid_by = res.default_paid_by
	} catch (e) {
		_errToast(e, "Failed to load meal settings")
	}
}

async function submitRequest() {
	if (!isValid.value || submitting.value) return
	submitting.value = true
	successMsg.value = ""

	const restaurantName = form.restaurant_name === "__other" ? form.custom_restaurant : form.restaurant_name

	try {
		const res = await call(`${API}.submit_meal_request`, {
			restaurant_name: restaurantName,
			meal_type: form.meal_type,
			amount: parseFloat(form.amount),
			reason: form.reason || undefined,
			meal_description: form.meal_description || undefined,
			paid_by: form.paid_by || undefined,
		})
		successMsg.value = res?.message || __("Meal request submitted successfully")

		form.restaurant_name = ""
		form.custom_restaurant = ""
		form.amount = ""
		form.meal_description = ""
		form.reason = ""
	} catch (e) {
		_errToast(e, "Failed to submit meal request")
	} finally {
		submitting.value = false
	}
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

onMounted(loadSettings)
</script>
