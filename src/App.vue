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
        // Couleur affichée à l'écran : BLANC
        fill: '#ffffff'
      };
    };

    const exportPng = async () => {
      if (!previewRef.value) return;
      isExporting.value = true;
      try {
        const canvas = await html2canvas(previewRef.value, {
          backgroundColor: null, // Fond transparent
          scale: 2, // Haute résolution
          useCORS: true, // Chargement des fonts externes
          
          // --- CORRECTION TYPESCRIPT & STYLE ---
          onclone: (clonedDoc: Document) => {
            const clonedPreview = clonedDoc.querySelector('.preview-zone') as HTMLElement;
            
            // On supprime la bordure et le fond gris du conteneur cloné
            if (clonedPreview) {
              clonedPreview.style.border = 'none';
              clonedPreview.style.background = 'none';
              clonedPreview.style.boxShadow = 'none';
            }

            // On force le texte en NOIR sur le clone
            const textElements = clonedDoc.querySelectorAll('tspan');
            textElements.forEach((el: any) => {
              el.style.fill = '#000000';
              el.style.color = '#000000';
            });
          }
        });

        canvas.toBlob((blob: Blob | null) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sticky-export-${Date.now()}.png`;
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

<style>
/* =========================================
   IMPORTS & RESET
   ========================================= */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap');

body {
  margin: 0;
  padding: 0;
  background-color: #181818;
}

/* =========================================
   LAYOUT PRINCIPAL
   ========================================= */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px;
  gap: 24px;
  background-color: #181818;
  font-family: 'Roboto', sans-serif;
  box-sizing: border-box;
}

/* =========================================
   TITRE
   ========================================= */
.title {
  font-family: 'Roboto', sans-serif;
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: 0;
  color: #fff;
  text-align: center;
}

.title .light { font-weight: 300; }
.title .bold { font-weight: 700; }

/* =========================================
   ZONE DE CONTRÔLES (Container)
   ========================================= */
.controls {
  width: 100%;
  max-width: 650px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* =========================================
   INPUT TEXTE
   ========================================= */
.input-wrapper {
  position: relative;
  width: 100%;
}

.text-input {
  width: 100%;
  padding: 16px 50px 16px 18px;
  font-size: 1.5rem;
  font-family: 'Roboto', sans-serif;
  border: 1px solid #555;
  border-radius: 10px;
  background-color: rgba(26, 26, 26, 0.9);
  color: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.text-input::placeholder { color: #888; }

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #555;
  color: #fff;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.clear-btn:hover { background-color: #777; }

/* =========================================
   GRILLE D'ALIGNEMENT
   ========================================= */
.grid-layout {
  display: grid;
  /* 4 colonnes : Label | Slider | Valeur | Reset */
  grid-template-columns: 130px 1fr 50px 30px;
  align-items: center;
  column-gap: 15px;
  row-gap: 25px;
  width: 100%;
}

.grid-layout label {
  color: #888;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.slider-track {
  width: 100%;
  display: flex;
  align-items: center;
}

.slider-track input[type="range"] {
  width: 100%;
  margin: 0;
  cursor: pointer;
  accent-color: #3b82f6;
}

.value {
  color: #fff;
  font-family: monospace;
  font-size: 0.9rem;
  text-align: right;
}

.reset-btn {
  background: none;
  border: none;
  color: #555;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: color 0.2s, opacity 0.2s;
}

.reset-btn:hover { color: #fff; }
.reset-btn.disabled { opacity: 0; pointer-events: none; }

.font-picker-wrapper { width: 100%; }

/* =========================================
   APERÇU & EXPORT
   ========================================= */
.preview-zone {
  width: 100%;
  max-width: 900px;
  min-height: 150px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Style écran uniquement */
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 10px;
}

.preview-svg {
  width: 100%;
  height: auto;
  max-height: 300px;
}

.export-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: flex-end;
}

.export-btn {
  padding: 14px 36px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  border: none;
  border-radius: 8px;
  background-color: #4caf50;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-btn:hover { background-color: #45a049; }
.export-btn:disabled { background-color: #2d5a30; cursor: wait; }
</style>
