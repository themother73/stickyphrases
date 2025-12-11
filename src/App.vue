<template>
  <div class="app">
    <h1 class="title">
      <span class="light">sticky</span><span class="bold">Phrases</span>
    </h1>

    <div class="controls">
      <!-- Zone Texte -->
      <div class="input-wrapper">
        <input 
          v-model="text" 
          placeholder="tu es exceptionnelle" 
          class="text-input"
        />
        <button v-if="text" @click="clearText" class="clear-btn">×</button>
      </div>

      <!-- GRILLE D'ALIGNEMENT -->
      <div class="grid-layout">
        <!-- Ligne 1 : Min Weight -->
        <label>LEFT WEIGHT</label>
        <div class="slider-track">
          <input type="range" :min="globalMinAllowed" :max="globalMaxAllowed" v-model.number="wghtMin" />
        </div>
        <span class="value">{{ wghtMin }}</span>
        <button 
          @click="wghtMin = globalMinAllowed" 
          class="reset-btn"
          :class="{ disabled: wghtMin === globalMinAllowed }"
          title="Reset"
        >↺</button>

        <!-- Ligne 2 : Max Weight -->
        <label>RIGHT WEIGHT</label>
        <div class="slider-track">
          <input type="range" :min="globalMinAllowed" :max="globalMaxAllowed" v-model.number="wghtMax" />
        </div>
        <span class="value">{{ wghtMax }}</span>
        <button 
          @click="wghtMax = globalMaxAllowed" 
          class="reset-btn"
          :class="{ disabled: wghtMax === globalMaxAllowed }"
          title="Reset"
        >↺</button>

        <!-- Ligne 3 : Espace Mots -->
        <label>WORDS SPACES</label>
        <div class="slider-track">
          <input type="range" min="0" max="100" v-model.number="wordSpacing" />
        </div>
        <span class="value">{{ wordSpacing }}px</span>
        <button 
          @click="wordSpacing = 20" 
          class="reset-btn"
          :class="{ disabled: wordSpacing === 20 }"
          title="Reset"
        >↺</button>

        <!-- Ligne 4 : Espace Lettres -->
        <label>LETTERS SPACES</label>
        <div class="slider-track">
          <input type="range" min="-10" max="50" step="0.5" v-model.number="letterSpacing" />
        </div>
        <span class="value">{{ letterSpacing }}px</span>
        <button 
          @click="letterSpacing = 0" 
          class="reset-btn"
          :class="{ disabled: letterSpacing === 0 }"
          title="Reset"
        >↺</button>

        <!-- Ligne 5 : Police -->
        <label class="font-label">FONT</label>
        <div class="font-picker-wrapper">
          <FontPicker v-model="chosenFont" />
        </div>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- Zone d'aperçu -->
    <div ref="previewRef" class="preview-zone">
      <svg 
        class="preview-svg"
        xmlns="http://www.w3.org/2000/svg"
        :viewBox="svgViewBox"
      >
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          <tspan
            v-for="(wordData, i) in processedWords"
            :key="i"
            :style="getWordStyle(wordData.weight)"
            :dx="i === 0 ? 0 : wordSpacing" 
          >{{ wordData.text }}</tspan>
        </text>
      </svg>
    </div>

    <div class="export-container">
      <button @click="exportPng" class="export-btn" :disabled="isExporting">
        {{ isExporting ? 'EXPORTATION...' : 'DOWNLOAD PNG' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import FontPicker from './components/FontPicker.vue';
import html2canvas from 'html2canvas';

interface FontItem {
  family: string;
  url: string;
  wghtMin: number;
  wghtMax: number;
}

export default defineComponent({
  name: 'App',
  components: { FontPicker },
  setup() {
    const text = ref('tu es exceptionnelle');
    const wghtMin = ref(200);
    const wghtMax = ref(800);
    const wordSpacing = ref(20);    
    const letterSpacing = ref(0);   
    const chosenFont = ref<FontItem | null>(null);
    const sliderKey = ref(0);
    const isExporting = ref(false);
    const previewRef = ref<HTMLDivElement | null>(null);

    const globalMinAllowed = ref(100);
    const globalMaxAllowed = ref(1000);

    const svgWidth = 1000;
    const svgHeight = 250; 
    const fontSize = 100;
    const svgViewBox = computed(() => `0 0 ${svgWidth} ${svgHeight}`);

    const clearText = () => { text.value = ''; };

    watch(chosenFont, async (newFont) => {
      if (!newFont) return;
      globalMinAllowed.value = newFont.wghtMin;
      globalMaxAllowed.value = newFont.wghtMax;
      wghtMin.value = newFont.wghtMin;
      wghtMax.value = newFont.wghtMax;
      sliderKey.value++;
      await nextTick();
    }, { immediate: true });

    const processedWords = computed(() => {
      const rawWords = text.value.trim().split(/\s+/).filter(w => w);
      const n = rawWords.length;
      return rawWords.map((w, i) => {
        const ratio = n <= 1 ? 0 : i / (n - 1);
        const weight = Math.round(wghtMin.value + ratio * (wghtMax.value - wghtMin.value));
        return { text: w, weight };
      });
    });

    const getWordStyle = (weight: number) => {
      const family = chosenFont.value?.family || 'Inter';
      return {
        fontFamily: `"${family}", sans-serif`,
        fontWeight: weight,
        fontVariationSettings: `'wght' ${weight}`,
        fontSize: `${fontSize}px`,
        letterSpacing: `${letterSpacing.value}px`,
        fill: '#ffffff'
      };
    };

    const exportPng = async () => {
      if (!previewRef.value) return;
      isExporting.value = true;
      try {
        const canvas = await html2canvas(previewRef.value);
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sticky-preview-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      } catch (e) {
        console.error(e);
        alert('Erreur export PNG');
      } finally {
        isExporting.value = false;
      }
    };

    return {
      text, wghtMin, wghtMax,
      wordSpacing, letterSpacing,
      globalMinAllowed, globalMaxAllowed,
      chosenFont, processedWords, sliderKey,
      previewRef, svgViewBox, isExporting,
      clearText, getWordStyle, exportPng
    };
  },
});
</script>
