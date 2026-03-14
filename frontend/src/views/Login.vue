<template>
	<ion-page>
		<ion-content class="ion-padding">
			<div class="flex h-screen w-screen flex-col justify-center login-bg">
				<div class="flex flex-col mx-auto gap-4 items-center">
					<img :src="'/files/icd-login-logo.png'" alt="ICD" class="h-20 object-contain drop-shadow-sm" />
					<div class="text-lg font-medium text-gray-700 tracking-wide">
						Employee Self-Service
					</div>
				</div>

				<div class="mx-auto mt-10 w-full px-8 sm:w-96">
					<div class="glass-section p-6 rounded-2xl">
						<form class="flex flex-col space-y-4" @submit.prevent="submit">
							<Input
								:label="__('Email')"
								:placeholder="__('johndoe@mail.com')"
								v-model="email"
								type="text"
								autocomplete="username"
							/>
							<Input
								:label="__('Password')"
								type="password"
								placeholder="••••••"
								v-model="password"
								autocomplete="current-password"
							/>
							<ErrorMessage :message="errorMessage" />
							<Button
								:loading="session.login.loading"
								variant="solid"
								class="disabled:bg-gray-700 disabled:text-white !mt-6"
							>
								{{ __("Login") }}
							</Button>
						</form>

						<template v-if="authProviders.data?.length">
							<div class="text-center text-sm text-gray-600 my-4">or</div>
							<div class="space-y-4">
								<a
									v-for="provider in authProviders.data"
									:key="provider.name"
									class="flex items-center justify-center gap-2 transition-colors focus:outline-none text-gray-800 bg-white/60 hover:bg-white/80 active:bg-white focus-visible:ring focus-visible:ring-gray-400 h-7 text-base p-2 rounded"
									:href="provider.auth_url"
								>
									<img class="h-4 w-4" :src="provider.icon" :alt="provider.provider_name" />
									<span>Login with {{ provider.provider_name }}</span>
								</a>
							</div>
						</template>
					</div>
				</div>
			</div>

			<Dialog v-model="resetPassword.showDialog">
				<template #body-title>
					<h2 class="text-lg font-bold">{{ __("Reset Password") }} </h2>
				</template>
				<template #body-content>
					<p>
						{{ __("Your password has expired. Please reset your password to continue") }}
					</p>
				</template>
				<template #actions>
					<a
						class="inline-flex items-center justify-center gap-2 transition-colors focus:outline-none text-white bg-icd-600 hover:bg-icd-500 active:bg-icd-700 focus-visible:ring focus-visible:ring-icd-400 h-7 text-base px-2 rounded"
						:href="resetPassword.link"
						target="_blank"
					>
						{{ __("Go to Reset Password page") }}
					</a>
				</template>
			</Dialog>

			<Dialog v-model="otp.showDialog">
				<template #body-title>
					<h2 class="text-lg font-bold">{{ __("OTP Verification") }}</h2>
				</template>
				<template #body-content>
					<p class="mb-4" v-if="otp.verification.prompt">
						{{ otp.verification.prompt }}
					</p>

					<form class="flex flex-col space-y-4" @submit.prevent="submit">
						<Input
							:label="__('OTP Code')"
							type="text"
							placeholder="000000"
							v-model="otp.code"
							autocomplete="one-time-code"
						/>
						<ErrorMessage :message="errorMessage" />
						<Button
							:loading="session.otp.loading"
							variant="solid"
							class="disabled:bg-gray-700 disabled:text-white !mt-6"
						>
							{{ __("Verify") }}
						</Button>
					</form>
				</template>
			</Dialog>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { inject, reactive, ref } from "vue"
import { Input, Button, ErrorMessage, Dialog, createResource } from "frappe-ui"

const email = ref(null)
const password = ref(null)
const errorMessage = ref("")

const resetPassword = reactive({
	showDialog: false,
	link: "",
})
const otp = reactive({
	showDialog: false,
	tmp_id: "",
	code: "",
	verification: {},
})

const session = inject("$session")
const __ = inject("$translate")

async function submit(e) {
	try {
		let response
		if (otp.showDialog) {
			response = await session.otp(otp.tmp_id, otp.code)
		} else {
			response = await session.login(email.value, password.value)
		}

		if (response.message === "Password Reset") {
			resetPassword.showDialog = true
			resetPassword.link = response.redirect_to
		} else {
			resetPassword.showDialog = false
			resetPassword.link = ""
		}

		// OTP verification
		if (response.verification) {
			if (response.verification.setup) {
				otp.showDialog = true
				otp.tmp_id = response.tmp_id
				otp.verification = response.verification
			} else {
				// Don't bother handling impossible OTP setup (e.g. no phone number).
				window.open("/login?redirect-to=" + encodeURIComponent(window.location.pathname), "_blank")
			}
		}
	} catch (error) {
		errorMessage.value = error?.messages?.join?.("\n") || error?.message || "Login failed"
	}
}

const authProviders = createResource({
	url: "hrms.api.oauth.oauth_providers",
	auto: true,
})
</script>

<style scoped>
.login-bg {
	background:
		radial-gradient(ellipse 500px 500px at 20% 20%, rgba(77, 6, 123, 0.08) 0%, transparent 70%),
		radial-gradient(ellipse 400px 400px at 80% 70%, rgba(123, 47, 160, 0.06) 0%, transparent 70%),
		radial-gradient(ellipse 300px 300px at 60% 30%, rgba(168, 108, 201, 0.05) 0%, transparent 70%),
		linear-gradient(180deg, #f8f0fc 0%, #f2eef8 50%, #f8f0fc 100%);
}
</style>
