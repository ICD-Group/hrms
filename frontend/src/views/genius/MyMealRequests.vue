<template>
	<BaseLayout :pageTitle="__('My Meal Requests')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Month Selector -->
				<div class="flex items-center justify-between bg-white dark:bg-white/10 rounded-xl p-3 shadow-sm dark:shadow-none">
					<button @click="prevMonth" class="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-left" class="w-5 text-gray-600 dark:text-gray-400" />
					</button>
					<div class="text-sm font-bold text-gray-800 dark:text-gray-200">
						{{ monthNames[month - 1] }} {{ year }}
					</div>
					<button @click="nextMonth" class="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center active:bg-gray-200">
						<FeatherIcon name="chevron-right" class="w-5 text-gray-600 dark:text-gray-400" />
					</button>
				</div>

				<!-- Summary -->
				<div v-if="totalAmount > 0" class="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white shadow-lg">
					<div class="text-xs font-medium opacity-80">{{ __("Total Meals") }}</div>
					<div class="text-3xl font-black mt-0.5">{{ fmt(totalAmount) }} EGP</div>
					<div class="text-xs opacity-70 mt-1">{{ requests.length }} {{ __("requests") }}</div>
				</div>

				<!-- New Request Button -->
				<button @click="router.push({ name: 'MealClaimFormView' })"
					class="w-full bg-icd-600 text-white rounded-xl py-3 text-sm font-bold active:bg-icd-700 flex items-center justify-center gap-2">
					<FeatherIcon name="plus" class="w-4 h-4" />
					{{ __("New Meal Request") }}
				</button>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!requests.length" class="text-center py-16">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<FeatherIcon name="coffee" class="w-8 h-8 text-gray-700" />
					</div>
					<div class="text-sm font-semibold text-gray-700">{{ __("No Requests") }}</div>
					<div class="text-xs text-gray-700 mt-1">{{ __("No meal requests for this month") }}</div>
				</div>

				<!-- Request Cards -->
				<div v-else class="flex flex-col gap-2">
					<div v-for="req in requests" :key="req.name"
						class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-3.5">
						<div class="flex items-start justify-between mb-2">
							<div>
								<div class="text-base font-bold text-gray-900 dark:text-gray-100">{{ req.restaurant_name }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400">{{ req.meal_type }}
									<span v-if="req.meal_description"> - {{ req.meal_description }}</span>
								</div>
							</div>
							<span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusCls(req.status)">
								{{ req.status }}
							</span>
						</div>
						<div class="flex items-center justify-between text-xs">
							<span class="text-gray-700">{{ formatDate(req.request_date) }}</span>
							<span class="font-black text-emerald-700">{{ fmt(req.amount) }} EGP</span>
						</div>
						<div v-if="req.paid_by" class="text-[11px] text-gray-600 mt-1">
							{{ __("Paid by") }}: {{ req.paid_by }}
						</div>
						<div v-if="req.rejection_reason" class="text-[11px] text-red-500 mt-1 italic">
							{{ req.rejection_reason }}
						</div>
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()

const API = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())
const isLoading = ref(false)
const requests = ref([])

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const totalAmount = ref(0)

function prevMonth() {
	if (month.value === 1) { month.value = 12; year.value-- }
	else month.value--
}
function nextMonth() {
	if (month.value === 12) { month.value = 1; year.value++ }
	else month.value++
}

async function loadData() {
	isLoading.value = true
	try {
		const res = await call(`${API}.get_my_meal_requests`, { month: month.value, year: year.value })
		requests.value = res?.requests || []
		totalAmount.value = requests.value.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
	} catch (e) { _errToast(e, "Failed to load meal requests") }
	isLoading.value = false
}

watch([month, year], loadData)

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function formatDate(d) {
	if (!d) return ""
	return dayjs(d).format("DD-MM-YYYY")
}

function statusCls(status) {
	return {
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Ordered": "bg-blue-100 text-blue-700",
		"Delivered": "bg-emerald-100 text-emerald-700",
		"Rejected": "bg-red-100 text-red-700",
	}[status] || "bg-gray-100 text-gray-600"
}

loadData()
</script>
