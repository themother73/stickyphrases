<template>
  <select v-model="selectedFontFamily" @change="onChange" class="font-select">
    <option
      v-for="font in fonts"
      :key="font.family"
      :value="font.family"
      :style="{ fontFamily: font.family }"
    >
      {{ font.family }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue'
import type { PropType } from 'vue'
import fontsCurated from '../fonts-curated.json'
import { ensureFontLoaded } from '../services/fontLoader'

interface FontItem {
  family: string
  url: string
  wghtMin: number
  wghtMax: number
}

export default defineComponent({
  name: 'FontPicker',
  props: {
    modelValue: {
      type: Object as PropType<FontItem | null>,
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const fonts = fontsCurated as FontItem[]
    const selectedFontFamily = ref(props.modelValue?.family || fonts[0]?.family || '')

    const onChange = () => {
      const f = fonts.find(f => f.family === selectedFontFamily.value)
      if (f) {
        emit('update:modelValue', f)
      }
    }

    onMounted(async () => {
      // Émettre la police par défaut
      if (!props.modelValue) {
        const defaultFont = fonts[0]
        if (defaultFont) {
          emit('update:modelValue', defaultFont)
        }
      }
      
      // Précharger toutes les polices pour qu'elles s'affichent dans le select
      for (const font of fonts) {
        await ensureFontLoaded(font.family, font.url)
      }
    })

    watch(
      () => props.modelValue,
      (val) => {
        if (val) {
          selectedFontFamily.value = val.family
        }
      }
    )

    return { fonts, selectedFontFamily, onChange }
  }
})
</script>
