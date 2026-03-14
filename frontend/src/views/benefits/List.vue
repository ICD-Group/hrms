<template>
	<ion-page>
		<ListView
			doctype="Employee Benefit Application"
			:pageTitle="__('Benefit Applications')"
			:fields="FIELDS"
			:filterConfig="FILTER_CONFIG"
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
	"employee",
	"employee_name",
	"payroll_period",
	"date",
	"total_amount",
	"docstatus",
]
const FILTER_CONFIG = [
	{
		fieldname: "payroll_period",
		fieldtype: "Link",
		label: __("Period"),
		options: "Payroll Period",
	},
	{
		fieldname: "employee",
		fieldtype: "Link",
		label: __("Employee"),
		options: "Employee",
	},
	{ fieldname: "date", fieldtype: "Date", label: __("Date") },
]
</script>
