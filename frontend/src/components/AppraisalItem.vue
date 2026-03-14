<template>
	<ListItem
		:isTeamRequest="props.isTeamRequest"
		:employee="props.doc.employee"
		:employeeName="props.doc.employee_name"
	>
		<template #left>
			<FeatherIcon name="award" class="h-5 w-5 mt-[3px] text-gray-700" />
			<div class="flex flex-col items-start gap-1">
				<div class="text-base font-normal text-gray-800">
					{{ props.doc.appraisal_cycle || props.doc.name }}
				</div>
				<div class="text-xs font-normal text-gray-700">
					<span v-if="props.doc.start_date">{{ dateRange }}</span>
					<template v-if="props.doc.final_score || props.doc.total_score">
						<span class="whitespace-pre"> &middot; </span>
						<span class="font-semibold">
							{{ __("Score") }}: {{ props.doc.final_score || props.doc.total_score }}
						</span>
					</template>
				</div>
			</div>
		</template>
		<template #right>
			<Badge variant="outline" :theme="colorMap[status]" :label="__(status, null, 'Appraisal')" size="md" />
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
	Submitted: "blue",
	Completed: "green",
	Cancelled: "red",
}

const status = computed(() => {
	if (props.workflowStateField) {
		return props.doc[props.workflowStateField]
	}
	const ds = props.doc.docstatus
	if (ds === 0) return "Draft"
	if (ds === 1) return "Submitted"
	if (ds === 2) return "Cancelled"
	return "Draft"
})

const dateRange = computed(() => {
	if (props.doc.start_date === props.doc.end_date) {
		return dayjs(props.doc.start_date).format("DD-MM")
	}
	return `${dayjs(props.doc.start_date).format("DD-MM")} - ${dayjs(props.doc.end_date).format("DD-MM-YYYY")}`
})
</script>
