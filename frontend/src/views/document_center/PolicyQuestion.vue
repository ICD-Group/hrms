<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center gap-2">
					<button @click="router.back()"
						class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 active:bg-gray-200 active:scale-90 transition-all flex-shrink-0">
						<FeatherIcon name="arrow-left" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Ask About Policies') }}</h2>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Question Input -->
				<div class="glass-section rounded-2xl p-4">
					<div class="flex items-center gap-3 mb-3">
						<div class="w-10 h-10 rounded-xl bg-[var(--icd-purple)]/10 flex items-center justify-center">
							<FeatherIcon name="help-circle" class="w-5 h-5 text-[var(--icd-purple)]" />
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900 dark:text-white">{{ __('Policy Assistant') }}</h3>
							<p class="text-xs text-gray-500">{{ __('Ask any question about company policies') }}</p>
						</div>
					</div>
					<div class="relative">
						<textarea
							v-model="question"
							:placeholder="__('e.g., What is the leave policy? How many vacation days do I get?')"
							rows="3"
							class="premium-textarea !min-h-[80px]"
						></textarea>
					</div>
					<button
						@click="askQuestion"
						:disabled="!question.trim() || asking"
						class="premium-submit mt-3"
					>
						<FeatherIcon v-if="!asking" name="send" class="w-4 h-4 mr-2" />
						<span>{{ asking ? __('Searching...') : __('Ask Question') }}</span>
					</button>
				</div>

				<!-- Answer -->
				<div v-if="answer" class="glass-section rounded-2xl p-4">
					<div class="flex items-center gap-2 mb-3">
						<FeatherIcon name="message-circle" class="w-5 h-5 text-[var(--icd-purple)]" />
						<span class="text-sm font-bold text-gray-900 dark:text-white">{{ __('Answer') }}</span>
					</div>
					<p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{{ answer.answer || answer }}</p>

					<!-- Related Policies -->
					<div v-if="answer.related_policies?.length" class="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
						<span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ __('Related Policies') }}</span>
						<div class="flex flex-col gap-1.5 mt-2">
							<button
								v-for="pol in answer.related_policies"
								:key="pol.name"
								@click="router.push({ name: 'PolicyDetailView', params: { id: pol.name } })"
								class="text-left text-sm font-semibold text-[var(--icd-purple)] active:opacity-70"
							>
								{{ pol.policy_title }}
							</button>
						</div>
					</div>
				</div>

				<!-- Suggested Questions -->
				<div v-if="!answer" class="flex flex-col gap-1.5">
					<span class="text-sm font-bold text-gray-900 dark:text-white px-1">{{ __('Suggested Questions') }}</span>
					<div class="flex flex-col gap-2">
						<button
							v-for="q in suggestedQuestions"
							:key="q"
							@click="question = q; askQuestion()"
							class="glass-section rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 active:scale-[0.98] transition-all"
						>
							{{ q }}
						</button>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()

const question = ref("")
const answer = ref(null)
const asking = ref(false)

const suggestedQuestions = [
	"What is the annual leave policy?",
	"How do I report harassment?",
	"What is the dress code?",
	"How does the probation period work?",
	"What are the working hours?",
	"What is the data protection policy?",
]

const askResource = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.ask_policy_question",
})

async function askQuestion() {
	if (!question.value.trim()) return
	asking.value = true
	answer.value = null
	try {
		await askResource.submit({ question: question.value })
		answer.value = askResource.data
	} catch (e) {
		answer.value = { answer: __("Sorry, I couldn't find an answer. Please contact HR.") }
	}
	asking.value = false
}
</script>
