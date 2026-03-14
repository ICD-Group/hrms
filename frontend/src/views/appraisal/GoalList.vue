<template>
	<ion-page>
		<ListView
			doctype="Employee Skill Map"
			:pageTitle="__('Skills & Goals')"
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
	"designation",
]
const FILTER_CONFIG = [
	{
		fieldname: "employee",
		fieldtype: "Link",
		label: __("Employee"),
		options: "Employee",
	},
	{
		fieldname: "designation",
		fieldtype: "Link",
		label: __("Designation"),
		options: "Designation",
	},
]
</script>
