<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
				<button @click="router.back()"
					class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors">
					<FeatherIcon name="arrow-left" class="w-4 h-4 text-gray-700" />
				</button>
				<h2 class="text-lg font-bold text-gray-900">{{ __("Salary Slip") }}</h2>
			</div>
		</ion-header>

		<ion-content class="ion-no-padding">
			<div class="salary-bg min-h-full">
				<div class="flex flex-col p-4 gap-4 pb-8">

					<!-- Loading -->
					<div v-if="loading" class="flex flex-col items-center justify-center py-20">
						<div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
							<FeatherIcon name="file-text" class="w-6 h-6 text-gray-400" />
						</div>
						<div class="text-sm text-gray-500">{{ __("Loading salary slip...") }}</div>
					</div>

					<!-- Error -->
					<div v-else-if="error" class="flex flex-col items-center justify-center py-20">
						<div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
							<FeatherIcon name="alert-circle" class="w-6 h-6 text-red-400" />
						</div>
						<div class="text-sm text-red-500">{{ error }}</div>
					</div>

					<!-- Salary Slip Content -->
					<template v-else-if="slip">
						<!-- Employee & Period -->
						<div class="card-premium p-4">
							<div class="flex items-center justify-between">
								<div class="min-w-0">
									<div class="text-sm font-bold text-gray-900 dark:text-white">{{ slip.employee_name }}</div>
									<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ slip.designation || slip.department }}</div>
								</div>
								<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex-shrink-0">
									{{ slip.posting_date }}
								</span>
							</div>
						</div>

						<!-- Net Pay -->
						<div class="card-premium p-4">
							<div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{{ __("Net Pay") }}</div>
							<div class="text-2xl font-black text-emerald-600">{{ fmtCurrency(slip.net_pay, slip.currency) }}</div>
							<div class="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
								<div>
									<div class="text-[11px] text-gray-500 dark:text-gray-400">{{ __("Gross Pay") }}</div>
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ fmtCurrency(slip.gross_pay, slip.currency) }}</div>
								</div>
								<div>
									<div class="text-[11px] text-gray-500 dark:text-gray-400">{{ __("Deductions") }}</div>
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ fmtCurrency(slip.total_deduction, slip.currency) }}</div>
								</div>
								<div>
									<div class="text-[11px] text-gray-500 dark:text-gray-400">{{ __("Payment Days") }}</div>
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ slip.payment_days || 0 }}</div>
								</div>
							</div>
						</div>

						<!-- Earnings -->
						<div v-if="slip.earnings?.length > 0">
							<div class="section-title mb-2">{{ __("Earnings") }}</div>
							<div class="card-premium overflow-hidden">
								<div class="divide-y divide-gray-100 dark:divide-white/10">
									<div v-for="e in slip.earnings" :key="e.name || e.salary_component" class="px-4 py-3 flex items-center justify-between">
										<div class="min-w-0 flex-1">
											<div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ e.salary_component }}</div>
											<div v-if="e.abbr" class="text-xs text-gray-400 mt-0.5">{{ e.abbr }}</div>
										</div>
										<div class="text-sm font-bold text-green-600 flex-shrink-0 ml-3">{{ fmtCurrency(e.amount, slip.currency) }}</div>
									</div>
								</div>
								<div class="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border-t border-gray-100 dark:border-white/10">
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ __("Total Earnings") }}</div>
									<div class="text-sm font-black text-green-600">{{ fmtCurrency(slip.gross_pay, slip.currency) }}</div>
								</div>
							</div>
						</div>

						<!-- Deductions -->
						<div v-if="slip.deductions?.length > 0">
							<div class="section-title mb-2">{{ __("Deductions") }}</div>
							<div class="card-premium overflow-hidden">
								<div class="divide-y divide-gray-100 dark:divide-white/10">
									<div v-for="d in slip.deductions" :key="d.name || d.salary_component" class="px-4 py-3 flex items-center justify-between">
										<div class="min-w-0 flex-1">
											<div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ d.salary_component }}</div>
											<div v-if="d.abbr" class="text-xs text-gray-400 mt-0.5">{{ d.abbr }}</div>
										</div>
										<div class="text-sm font-bold text-red-500 flex-shrink-0 ml-3">-{{ fmtCurrency(d.amount, slip.currency) }}</div>
									</div>
								</div>
								<div class="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-gray-100 dark:border-white/10">
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ __("Total Deductions") }}</div>
									<div class="text-sm font-black text-red-500">{{ fmtCurrency(slip.total_deduction, slip.currency) }}</div>
								</div>
							</div>
						</div>

						<!-- Pay Details -->
						<div>
							<div class="section-title mb-2">{{ __("Pay Details") }}</div>
							<div class="card-premium overflow-hidden">
								<div class="divide-y divide-gray-100 dark:divide-white/10">
									<div v-if="slip.total_working_days" class="px-4 py-3 flex items-center justify-between">
										<div class="text-sm text-gray-600 dark:text-gray-300">{{ __("Working Days") }}</div>
										<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ slip.total_working_days }}</div>
									</div>
									<div class="px-4 py-3 flex items-center justify-between">
										<div class="text-sm text-gray-600 dark:text-gray-300">{{ __("Payment Days") }}</div>
										<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ slip.payment_days || 0 }}</div>
									</div>
									<div v-if="slip.leave_without_pay" class="px-4 py-3 flex items-center justify-between">
										<div class="text-sm text-gray-600 dark:text-gray-300">{{ __("Leave Without Pay") }}</div>
										<div class="text-sm font-bold text-red-500">{{ slip.leave_without_pay }}</div>
									</div>
									<div class="px-4 py-3 flex items-center justify-between">
										<div class="text-sm text-gray-600 dark:text-gray-300">{{ __("Gross Pay") }}</div>
										<div class="text-sm font-bold text-green-600">{{ fmtCurrency(slip.gross_pay, slip.currency) }}</div>
									</div>
									<div class="px-4 py-3 flex items-center justify-between">
										<div class="text-sm text-gray-600 dark:text-gray-300">{{ __("Total Deduction") }}</div>
										<div class="text-sm font-bold text-red-500">{{ fmtCurrency(slip.total_deduction, slip.currency) }}</div>
									</div>
								</div>
								<div class="flex items-center justify-between px-4 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border-t border-gray-100 dark:border-white/10">
									<div class="text-sm font-bold text-gray-900 dark:text-white">{{ __("Net Pay") }}</div>
									<div class="text-lg font-black text-emerald-600">{{ fmtCurrency(slip.net_pay, slip.currency) }}</div>
								</div>
							</div>
						</div>

						<!-- Download PDF -->
						<button @click="downloadPDF"
							:disabled="downloadingPDF"
							class="w-full bg-icd-600 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 active:bg-icd-700 active:scale-[0.98] disabled:opacity-50 transition-all">
							<FeatherIcon :name="downloadingPDF ? 'loader' : 'download'" class="w-4 h-4" :class="downloadingPDF ? 'animate-spin' : ''" />
							{{ downloadingPDF ? __("Downloading...") : __("Download PDF") }}
						</button>
					</template>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, inject, onMounted } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { FeatherIcon, call } from "frappe-ui"
import { formatCurrency } from "@/utils/formatters"

const props = defineProps({
	id: { type: String, required: true },
})

const __ = inject("$translate")
const router = useRouter()

const slip = ref(null)
const loading = ref(true)
const error = ref("")
const downloadingPDF = ref(false)

onMounted(async () => {
	if (!props.id) {
		error.value = "No salary slip specified"
		loading.value = false
		return
	}
	try {
		const data = await call("frappe.client.get", {
			doctype: "Salary Slip",
			name: props.id,
		})
		if (data) {
			slip.value = data
		} else {
			error.value = "Salary slip not found"
		}
	} catch (e) {
		error.value = e.message || "Failed to load salary slip"
	}
	loading.value = false
})

function fmtCurrency(val, currency) {
	if (!val) return "0.00"
	try {
		return formatCurrency(val, currency)
	} catch {
		return parseFloat(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	}
}

function downloadPDF() {
	if (!slip.value?.name) return
	downloadingPDF.value = true

	let headers = {
		"X-Frappe-Site-Name": window.location.hostname,
		"Content-Type": "application/x-www-form-urlencoded",
		"Accept": "application/json",
	}
	if (window.csrf_token) {
		headers["X-Frappe-CSRF-Token"] = window.csrf_token
	}

	fetch("/api/method/hrms.api.download_salary_slip", {
		method: "POST",
		headers,
		body: new URLSearchParams({ name: slip.value.name }),
	})
		.then((response) => {
			if (!response.ok) throw new Error("Failed to download PDF")
			return response.json()
		})
		.then((data) => {
			const dataUri = data.message
			if (!dataUri) throw new Error("No PDF data received")
			if (!dataUri.includes(",")) throw new Error("Invalid PDF data format")

			const base64 = dataUri.split(",")[1]
			const mimeType = dataUri.split(":")[1]?.split(";")?.[0] || "application/pdf"
			const byteString = atob(base64)
			const ab = new ArrayBuffer(byteString.length)
			const ia = new Uint8Array(ab)
			for (let i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i)
			}
			const blob = new Blob([ab], { type: mimeType })
			const blobUrl = window.URL.createObjectURL(blob)
			const link = document.createElement("a")
			link.href = blobUrl
			link.download = `${slip.value.name}.pdf`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000)
		})
		.catch((err) => {
			console.error("[SalarySlip] PDF download error:", err)
		})
		.finally(() => {
			downloadingPDF.value = false
		})
}
</script>

<style scoped>
.salary-bg {
	background: #f9fafb;
}
.dark .salary-bg {
	background: #111827;
}
</style>
