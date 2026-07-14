<template>
  <div class="p-8 space-y-8 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.home') }}</h1>
      <p class="text-on-surface-variant mt-1">{{ t('dashboard.status') }}: WhatsApp {{ waStore.statusLabel }}</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div v-for="kpi in kpis" :key="kpi.label"
           class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
        <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-60"
             :class="kpi.glow"></div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="kpi.iconBg">
            <component :is="kpi.icon" class="w-5 h-5" :class="kpi.iconColor" />
          </div>
          <span class="text-sm text-on-surface-variant font-medium">{{ kpi.label }}</span>
        </div>
        <p class="text-3xl font-bold text-on-surface tracking-tight">{{ kpi.value }}</p>
        <p v-if="kpi.sub" class="text-xs text-on-surface-variant mt-1">{{ kpi.sub }}</p>
      </div>
    </div>

    <!-- Recent Campaigns -->
    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h2 class="text-lg font-semibold text-on-surface mb-4">{{ t('dashboard.recent_campaigns') }}</h2>
      <div v-if="stats?.recentCampaigns?.length" class="space-y-3">
        <div v-for="c in stats.recentCampaigns" :key="c.id"
             class="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div>
            <p class="font-medium text-on-surface text-sm">{{ c.name }}</p>
            <p class="text-xs text-on-surface-variant">{{ c.template?.name }}</p>
          </div>
          <span class="px-3 py-1 text-xs font-bold rounded-full"
                :class="statusClass(c.status)">
            {{ c.status }}
          </span>
        </div>
      </div>
      <p v-else class="text-on-surface-variant text-sm">{{ t('dashboard.no_campaigns') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Users, Megaphone, Send, TrendingUp } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const waStore = useWhatsappStore()

const stats = ref<any>(null)

onMounted(async () => {
  waStore.fetchStatus()
  try {
    const res = await $fetch<{ data: any }>('/api/stats/dashboard')
    stats.value = res.data
  } catch { /* silent */ }
})

const kpis = computed(() => [
  { label: t('dashboard.total_contacts'), value: stats.value?.totalContacts ?? '—', icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary', glow: 'bg-primary/20', sub: t('dashboard.active_count', { count: stats.value?.activeContacts ?? 0 }) },
  { label: t('dashboard.active_campaigns'), value: stats.value?.activeCampaigns ?? '—', icon: Megaphone, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', glow: 'bg-secondary/20' },
  { label: t('dashboard.messages_sent'), value: stats.value?.sentMessages ?? '—', icon: Send, iconBg: 'bg-tertiary/10', iconColor: 'text-tertiary', glow: 'bg-tertiary/20', sub: t('dashboard.failed_count', { count: stats.value?.failedMessages ?? 0 }) },
  { label: t('dashboard.success_rate'), value: stats.value ? `${stats.value.successRate}%` : '—', icon: TrendingUp, iconBg: 'bg-primary/10', iconColor: 'text-primary', glow: 'bg-primary/20' },
])

function statusClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-white/10 text-on-surface-variant',
    RUNNING: 'bg-primary/20 text-primary',
    PAUSED: 'bg-yellow-500/20 text-yellow-400',
    COMPLETED: 'bg-tertiary/20 text-tertiary',
    FAILED: 'bg-error/20 text-error',
  }
  return map[status] || map.DRAFT
}
</script>
