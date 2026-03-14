<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<FormView
				v-if="formFields.data"
				doctype="Appraisal"
				v-model="appraisal"
				:isSubmittable="true"
				:fields="formFields.data"
				:id="props.id"
				:showAttachmentView="true"
			/>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref } from "vue"
import { IonPage, IonContent } from "@ionic/vue"
import { createResource } from "frappe-ui"
import FormView from "@/components/FormView.vue"

const props = defineProps({
	id: { type: String, required: false },
})

const appraisal = ref({})

const formFields = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: "Appraisal" },
	transform(data) {
		const excludeFields = ["naming_series", "amended_from"]
		return data.filter((field) => !excludeFields.includes(field.fieldname))
	},
})
formFields.reload()
</script>
