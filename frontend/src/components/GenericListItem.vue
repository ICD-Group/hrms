<template>
	<ListItem
		:isTeamRequest="props.isTeamRequest"
		:employee="props.doc.employee || props.doc.raised_by"
		:employeeName="props.doc.employee_name"
	>
		<template #left>
			<FeatherIcon name="file-text" class="h-5 w-5 mt-[3px] text-gray-700" />
			<div class="flex flex-col items-start gap-1">
				<div class="text-base font-normal text-gray-800">
					{{ displayTitle }}
				</div>
				<div class="text-xs font-normal text-gray-700" v-if="displaySubtitle">
					{{ displaySubtitle }}
				</div>
			</div>
		</template>
		<template #right>
			<Badge v-if="status" variant="outline" :theme="statusColor" :label="__(status)" size="md" />
			<FeatherIcon name="chevron-right" class="h-5 w-5 text-gray-700" />
		</template>
	</ListItem>
</template>

<script setup>
import { FeatherIcon, Badge } from "frappe-ui"
import { computed, inject } from "vue"

import ListItem from "@/components/ListItem.vue"

const dayjs = inject("$dayjs")
const __ = inject("$translate")
const props = defineProps({
	doc: {
		type: Object,
	},
	isTeamRequest: {
		type: Boolean,
		default: false,
	},
	workflowStateField: {
		type: String,
		required: false,
	},
})

const colorMap = {
	Draft: "gray",
	Open: "orange",
	Scheduled: "blue",
	Submitted: "blue",
	Approved: "green",
	Completed: "green",
	Resolved: "green",
	Rejected: "red",
	Cancelled: "red",
	Invalid: "red",
	Investigated: "orange",
}

const status = computed(() => {
	if (props.workflowStateField && props.doc[props.workflowStateField]) {
		return props.doc[props.workflowStateField]
	}
	if (props.doc.status) return props.doc.status
	if (props.doc.event_status) return props.doc.event_status
	const ds = props.doc.docstatus
	if (ds === 0) return "Draft"
	if (ds === 1) return "Submitted"
	if (ds === 2) return "Cancelled"
	return ""
})

const statusColor = computed(() => {
	return colorMap[status.value] || "gray"
})

const displayTitle = computed(() => {
	return (
		props.doc.event_name ||
		props.doc.subject ||
		props.doc.purpose_of_travel ||
		props.doc.grievance_type ||
		props.doc.loan_type ||
		props.doc.payroll_period ||
		props.doc.designation ||
		props.doc.name
	)
})

const displaySubtitle = computed(() => {
	const parts = []
	if (props.doc.start_time) parts.push(dayjs(props.doc.start_time).format("DD-MM-YYYY"))
	else if (props.doc.date) parts.push(dayjs(props.doc.date).format("DD-MM-YYYY"))
	else if (props.doc.posting_date) parts.push(dayjs(props.doc.posting_date).format("DD-MM-YYYY"))

	if (props.doc.type) parts.push(props.doc.type)
	if (props.doc.travel_type) parts.push(props.doc.travel_type)
	if (props.doc.trainer_name) parts.push(props.doc.trainer_name)
	if (props.doc.total_amount) parts.push(`${props.doc.total_amount}`)
	if (props.doc.total_exemption_amount) parts.push(`${props.doc.total_exemption_amount}`)

	return parts.join(" \u00B7 ")
})
</script>
