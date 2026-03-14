<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<FormView
				v-if="formFields.data"
				doctype="Employee Tax Exemption Declaration"
				v-model="taxDeclaration"
				:isSubmittable="true"
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

const taxDeclaration = ref({
	employee: employee.data.name,
	employee_name: employee.data.employee_name,
	company: employee.data.company,
	department: employee.data.department,
})

const formFields = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: "Employee Tax Exemption Declaration" },
	transform(data) {
		const excludeFields = ["naming_series", "amended_from"]
		const employeeFields = [
			"employee",
			"employee_name",
			"department",
			"company",
		]
		const exclude = [...excludeFields]
		if (!props.id) exclude.push(...employeeFields)
		return data.filter((field) => !exclude.includes(field.fieldname))
	},
})
formFields.reload()
</script>
