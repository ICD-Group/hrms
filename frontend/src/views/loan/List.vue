<template>
	<ion-page>
		<ListView
			doctype="Loan Application"
			:pageTitle="__('Loan Applications')"
			:fields="FIELDS"
			:filterConfig="FILTER_CONFIG"
			employeeFieldName="applicant"
		/>
	</ion-page>
</template>

<script setup>
import { IonPage } from "@ionic/vue"
import ListView from "@/components/ListView.vue"
import { inject } from "vue"

const __ = inject("$translate")
const FIELDS = [
	"name",
	"applicant_name",
	"loan_product",
	"loan_amount",
	"posting_date",
	"status",
]
const FILTER_CONFIG = [
	{
		fieldname: "status",
		fieldtype: "Select",
		label: __("Status"),
		options: ["Open", "Approved", "Rejected", "Cancelled"],
	},
	{
		fieldname: "loan_product",
		fieldtype: "Link",
		label: __("Loan Product"),
		options: "Loan Product",
	},
	{ fieldname: "posting_date", fieldtype: "Date", label: __("Date") },
]
</script>
