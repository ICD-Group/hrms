<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<FormView
				v-if="formFields.data"
				doctype="Loan Application"
				v-model="loanApplication"
				:fields="formFields.data"
				:id="props.id"
				:showAttachmentView="true"
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

const loanApplication = ref({
	applicant_type: "Employee",
	applicant: employee.data.name,
	applicant_name: employee.data.employee_name,
	company: employee.data.company,
})

const formFields = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: "Loan Application" },
	transform(data) {
		const excludeFields = ["naming_series", "amended_from"]
		const employeeFields = [
			"applicant_type",
			"applicant",
			"applicant_name",
			"company",
			"status",
		]
		const exclude = [...excludeFields]
		if (!props.id) exclude.push(...employeeFields)
		return data.filter((field) => !exclude.includes(field.fieldname))
	},
})
formFields.reload()
</script>
