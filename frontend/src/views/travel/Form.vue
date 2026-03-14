<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<FormView
				v-if="formFields.data"
				doctype="Travel Request"
				v-model="travelRequest"
				:isSubmittable="true"
				:fields="formFields.data"
				:id="props.id"
				:showAttachmentView="true"
				@validateForm="validateForm"
			/>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { createResource } from "frappe-ui"
import { ref, inject } from "vue"
import FormView from "@/components/FormView.vue"

const employee = inject("$employee")

const props = defineProps({
	id: { type: String, required: false },
})

const travelRequest = ref({
	employee: employee.data.name,
	employee_name: employee.data.employee_name,
	company: employee.data.company,
	department: employee.data.department,
})

const formFields = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: "Travel Request" },
	transform(data) {
		const excludeFields = ["naming_series", "amended_from"]
		const employeeFields = [
			"employee",
			"employee_name",
			"department",
			"company",
			"status",
		]
		const exclude = [...excludeFields]
		if (!props.id) exclude.push(...employeeFields)
		return data.filter((field) => !exclude.includes(field.fieldname))
	},
})
formFields.reload()

function validateForm() {
	travelRequest.value.employee = employee.data.name
}
</script>
