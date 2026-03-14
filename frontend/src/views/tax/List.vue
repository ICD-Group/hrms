<template>
	<ion-page>
		<ListView
			doctype="Employee Tax Exemption Declaration"
			:pageTitle="__('Tax Declarations')"
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
	"total_exemption_amount",
	"department",
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
	{
		fieldname: "department",
		fieldtype: "Link",
		label: __("Department"),
		options: "Department",
	},
]
</script>
