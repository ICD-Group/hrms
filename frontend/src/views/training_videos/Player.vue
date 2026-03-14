<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="flex flex-col h-full w-full">
				<div class="app-bg-ambient"></div>
				<header class="flex flex-row glass-header px-4 py-2.5 items-center sticky top-0 z-[1000]">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<div class="flex flex-row items-center gap-2 overflow-hidden grow">
						<h2 class="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
							{{ video.title || __('Training Video') }}
						</h2>
					</div>
				</header>

				<div class="grow overflow-y-auto">
					<div class="flex flex-col gap-3">
						<!-- Loading -->
						<div v-if="detail.loading" class="flex justify-center py-12">
							<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
						</div>

						<template v-else-if="detail.data">
							<!-- YouTube Player -->
							<div class="relative w-full bg-black" style="padding-bottom: 56.25%;">
								<iframe
									class="absolute inset-0 w-full h-full"
									:src="`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1&playsinline=1`"
									frameborder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowfullscreen
								></iframe>
							</div>

							<!-- Video Info -->
							<div class="px-4 flex flex-col gap-3">
								<div class="glass-section p-3 rounded-xl">
									<div class="text-base font-bold text-gray-900 dark:text-white leading-snug">{{ video.title }}</div>
									<div v-if="video.title_ar" class="text-base font-bold text-gray-700 dark:text-gray-300 mt-1" dir="rtl">{{ video.title_ar }}</div>

									<div class="flex flex-wrap items-center gap-2 mt-2">
										<span class="text-[11px] font-bold px-2 py-0.5 rounded-full"
											:class="video.language === 'Arabic' ? 'bg-[#E92634] text-white' : video.language === 'English' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'">
											{{ video.language === 'Arabic' ? 'العربية' : video.language === 'English' ? 'English' : 'AR / EN' }}
										</span>
										<span v-if="video.difficulty" class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
											{{ video.difficulty }}
										</span>
										<span v-if="video.duration" class="text-[11px] font-medium text-gray-600 flex items-center gap-0.5">
											<FeatherIcon name="clock" class="w-3 h-3" /> {{ video.duration }}
										</span>
										<span class="text-[11px] font-medium text-gray-600 flex items-center gap-0.5">
											<FeatherIcon name="eye" class="w-3 h-3" /> {{ video.view_count }} {{ __('views') }}
										</span>
									</div>

									<!-- Creator -->
									<div v-if="video.creator_name" class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
										<div class="w-8 h-8 rounded-full bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center flex-shrink-0">
											<FeatherIcon name="user" class="w-4 h-4 text-icd-600" />
										</div>
										<div>
											<div class="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{{ video.creator_name }}</div>
											<a v-if="video.creator_channel_url"
												:href="video.creator_channel_url"
												target="_blank"
												class="text-[11px] text-icd-600 font-medium">
												{{ __('View Channel') }}
											</a>
										</div>
									</div>
								</div>

								<!-- Description -->
								<div v-if="video.description || video.description_ar" class="glass-section p-3 rounded-xl">
									<div class="text-[12px] font-bold text-gray-700 uppercase mb-1">{{ __('Description') }}</div>
									<div v-if="video.description" class="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{{ video.description }}</div>
									<div v-if="video.description_ar" class="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line mt-2" dir="rtl">{{ video.description_ar }}</div>
								</div>

								<!-- Tags -->
								<div v-if="video.tags" class="flex flex-wrap gap-1.5 px-1 pb-4">
									<span
										v-for="tag in parseTags(video.tags)"
										:key="tag"
										class="text-[11px] font-semibold bg-icd-50 text-icd-600 px-2 py-0.5 rounded-full"
									>{{ tag }}</span>
								</div>

								<!-- Open on YouTube -->
								<a v-if="video.youtube_url"
									:href="video.youtube_url"
									target="_blank"
									class="flex items-center gap-3 card-premium p-3 rounded-xl mb-4">
									<div class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
										<FeatherIcon name="youtube" class="w-5 h-5 text-[#E92634]" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-gray-900">{{ __('Open on YouTube') }}</div>
										<div class="text-xs text-gray-600">{{ __('Watch in YouTube app') }}</div>
									</div>
									<FeatherIcon name="external-link" class="w-4 h-4 text-gray-600" />
								</a>
							</div>
						</template>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button } from "frappe-ui"

const props = defineProps({ id: String })
const __ = inject("$translate")
const router = useRouter()

const detail = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_training_video_detail",
	makeParams() { return { video_name: props.id } },
	auto: true,
	cache: `doc_center:training_video:${props.id}`,
})

const video = computed(() => detail.data || {})

function parseTags(tags) {
	if (!tags) return []
	return tags.split(",").map(t => t.trim()).filter(Boolean)
}
</script>
