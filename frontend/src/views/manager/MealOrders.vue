<template>
	<BaseLayout :pageTitle="__('Meal Orders')" :showBack="true">
		<template #body>
			<div class="flex flex-col p-4 gap-3">
				<!-- Today Summary -->
				<div v-if="totalToday > 0" class="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white shadow-lg">
					<div class="text-xs font-medium opacity-80">Today's Meals</div>
					<div class="text-3xl font-black mt-0.5">{{ fmt(totalToday) }} EGP</div>
					<div class="text-xs opacity-70 mt-1">{{ allRequests.length }} requests</div>
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Empty -->
				<div v-else-if="!byRestaurant.length" class="text-center py-16">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<FeatherIcon name="coffee" class="w-8 h-8 text-gray-700" />
					</div>
					<div class="text-sm font-semibold text-gray-700">{{ __("No Orders Today") }}</div>
					<div class="text-xs text-gray-700 mt-1">{{ __("No meal requests for today") }}</div>
				</div>

				<!-- By Restaurant -->
				<div v-else class="flex flex-col gap-3">
					<div v-for="group in byRestaurant" :key="group.restaurant" class="card-premium overflow-hidden">
						<!-- Restaurant Header -->
						<div class="flex items-center justify-between p-3.5 bg-gray-100 border-b border-gray-100">
							<div>
								<div class="text-base font-bold text-gray-900">{{ group.restaurant }}</div>
								<div class="text-xs text-gray-700">{{ group.count }} meals</div>
							</div>
							<div class="text-lg font-black text-emerald-700">{{ fmt(group.total) }}</div>
						</div>

						<!-- Orders -->
						<div class="flex flex-col divide-y divide-gray-50">
							<div v-for="order in group.orders" :key="order.name"
								class="flex items-center gap-3 px-3.5 py-2.5">
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold text-gray-800 truncate">{{ order.employee_name }}</div>
									<div class="text-[11px] text-gray-600">
										{{ order.meal_type }}
										<span v-if="order.meal_description"> - {{ order.meal_description }}</span>
									</div>
								</div>
								<div class="flex items-center gap-2 flex-shrink-0">
									<span class="text-xs font-black text-gray-800">{{ fmt(order.amount) }}</span>
									<span class="text-[11px] font-bold px-1.5 py-0.5 rounded-full" :class="orderStatusCls(order.order_status || order.status)">
										{{ order.order_status || order.status }}
									</span>
								</div>
							</div>
						</div>

						<!-- Restaurant Actions -->
						<div class="flex gap-2 p-3 border-t border-gray-100">
							<button v-if="hasUnordered(group)" @click="bulkOrder(group)"
								:disabled="group._processing === 'order'"
								class="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
								{{ group._processing === 'order' ? '...' : 'Mark All Ordered' }}
							</button>
							<button v-if="hasOrdered(group)" @click="bulkDeliver(group)"
								:disabled="group._processing === 'deliver'"
								class="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
								{{ group._processing === 'deliver' ? '...' : 'Mark All Delivered' }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, inject, onMounted } from "vue"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const API = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const isLoading = ref(false)
const allRequests = ref([])
const byRestaurant = ref([])
const totalToday = ref(0)

async function loadData() {
	isLoading.value = true
	try {
		const res = await call(`${API}.get_today_meal_requests`)
		allRequests.value = res?.requests || []
		byRestaurant.value = (res?.by_restaurant || []).map(g => ({ ...g, _processing: null }))
		totalToday.value = res?.total_today || 0
	} catch (e) { _errToast(e, "Failed to load meal orders") }
	isLoading.value = false
}

function hasUnordered(group) {
	return group.orders.some(o => o.status === "Approved" && (!o.order_status || o.order_status === "Pending"))
}

function hasOrdered(group) {
	return group.orders.some(o => o.order_status === "Ordered")
}

async function bulkOrder(group) {
	group._processing = "order"
	try {
		const names = group.orders
			.filter(o => o.status === "Approved" && (!o.order_status || o.order_status === "Pending"))
			.map(o => o.name)
		if (names.length) {
			await call(`${API}.bulk_order_meals`, { request_names: JSON.stringify(names) })
			await loadData()
		}
	} catch (e) { console.error(e) }
	group._processing = null
}

async function bulkDeliver(group) {
	group._processing = "deliver"
	try {
		for (const order of group.orders.filter(o => o.order_status === "Ordered")) {
			await call(`${API}.mark_meal_delivered`, { request_name: order.name })
		}
		await loadData()
	} catch (e) { console.error(e) }
	group._processing = null
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function orderStatusCls(status) {
	return {
		"Pending": "bg-gray-100 text-gray-600",
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Ordered": "bg-blue-100 text-blue-700",
		"Delivered": "bg-emerald-100 text-emerald-700",
		"Rejected": "bg-red-100 text-red-700",
	}[status] || "bg-gray-100 text-gray-600"
}

onMounted(loadData)
</script>
