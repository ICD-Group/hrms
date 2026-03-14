<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<FormView
				v-if="formFields.data"
				doctype="Employee Grievance"
				v-model="grievance"
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

const grievance = ref({
	employee: employee.data.name,
	employee_name: employee.data.employee_name,
	company: employee.data.company,
	department: employee.data.department,
	designation: employee.data.designation,
})

const formFields = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: "Employee Grievance" },
	transform(data) {
		const excludeFields = ["naming_series", "amended_from"]
		const employeeFields = [
			"employee",
			"employee_name",
			"department",
			"designation",
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
