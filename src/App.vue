<template>
  <div class="app">
    <h1 class="title">
      <span class="light">Sticky</span><span class="bold">Phrases</span>
    </h1>

    <div class="controls">
      <!-- Zone Texte -->
      <div class="input-wrapper">
        <input 
          v-model="text" 
          placeholder="tu es magnifique" 
          class="text-input"
        />
        <button v-if="text" @click="clearText" class="clear-btn">×</button>
      </div>

      <!-- GRILLE D'ALIGNEMENT -->
      <!-- [Label: 140px] [Slider: 1fr] [Valeur: 50px] [Reset: 30px] -->
      <div class="grid-layout">
        
        <!-- Ligne 1 : Min Weight -->
        <label>MIN WEIGHT</label>
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
        <label>MAX WEIGHT</label>
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
        <label>ESPACE MOTS</label>
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
        <label>ESPACE LETTRES</label>
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
        <label class="font-label">POLICE</label>
        <div class="font-picker-wrapper">
          <FontPicker v-model="chosenFont" />
        </div>
        <!-- Cellules vides -->
        <span></span>
        <span></span>

      </div>
    </div>

    <!-- Zone d'aperçu SVG -->
    <div class="preview-zone">
      <svg 
        ref="svgRef"
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
      <button @click="exportSvgVector" class="export-btn" :disabled="isExporting">
        {{ isExporting ? 'VECTORISATION...' : 'TÉLÉCHARGER LE SVG (COURBES)' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import FontPicker from './components/FontPicker.vue';

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
    const text = ref('tu es magnifique');
    const wghtMin = ref(200);
    const wghtMax = ref(800);
    const wordSpacing = ref(20);    
    const letterSpacing = ref(0);   
    
    const chosenFont = ref<FontItem | null>(null);
    const sliderKey = ref(0);
    const svgRef = ref<SVGElement | null>(null);
    const isExporting = ref(false);

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

    const loadScript = (src: string, globalName: string) => {
      return new Promise((resolve, reject) => {
        if ((window as any)[globalName]) return resolve(true);
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(true);
        s.onerror = reject;
        document.head.appendChild(s);
      });
    };

    const exportSvgVector = async () => {
      if (!svgRef.value) return;
      isExporting.value = true;
      let canvas: HTMLCanvasElement | null = null;
      let img: HTMLImageElement | null = null;

      try {
        await loadScript('https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.min.js', 'ImageTracer');
        const ImageTracer = (window as any).ImageTracer;

        // 1. CLONAGE et PRÉPARATION HD
        const clone = svgRef.value.cloneNode(true) as SVGElement;
        
        // Scale x10 pour une précision vectorielle parfaite
        const scale = 10; 
        const w = 1000 * scale; 
        const h = 250 * scale;
        
        clone.setAttribute('width', `${w}px`);
        clone.setAttribute('height', `${h}px`);
        // On conserve le viewBox pour que le contenu s'adapte
        clone.setAttribute('viewBox', `0 0 1000 250`); 
        
        // Force le noir pour la vectorisation
        clone.querySelectorAll('tspan, text').forEach((el: any) => el.style.fill = '#000000');
        
        // INJECTION CSS CRITIQUE : Permet au Canvas de connaître la police
        const family = chosenFont.value?.family || 'Inter';
        const style = document.createElement('style');
        style.textContent = `
          text, tspan { 
            font-family: "${family}", sans-serif !important; 
          }
        `;
        clone.prepend(style);

        // 2. RENDU CANVAS (PIXELS)
        const svgStr = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Context null');
        
        ctx.clearRect(0, 0, w, h); // Fond transparent

        img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
            img!.onload = resolve;
            img!.onerror = reject;
        });
        
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // 3. VECTORISATION (CHEMINS)
        const imageData = ctx.getImageData(0, 0, w, h);
        
        const svgVector = ImageTracer.imagedataToSVG(imageData, {
            ltres: 0.1, qtres: 0.1, pathomit: 20, // Ignorer le bruit
            colorsampling: 2, numberofcolors: 2, mincolorratio: 0, 
            strokewidth: 0, viewbox: true, linefilter: true,
            scale: 1/scale, // Redimensionner à la taille originale (1000px)
            rightangleenhance: false // Respecter les courbes naturelles
        });

        // 4. TÉLÉCHARGEMENT
        const finalBlob = new Blob([svgVector], { type: 'image/svg+xml;charset=utf-8' });
        const finalUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = finalUrl;
        a.download = `sticky-cut-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(finalUrl);

      } catch (e) {
        console.error(e);
        alert('Erreur export: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        isExporting.value = false;
        if (canvas) canvas.remove();
      }
    };

    return {
      text, wghtMin, wghtMax,
      wordSpacing, letterSpacing,
      globalMinAllowed, globalMaxAllowed,
      chosenFont, processedWords, sliderKey,
      svgRef, svgViewBox, isExporting,
      clearText, getWordStyle, exportSvgVector
    };
  },
});
</script>

<style scoped>
/* GRILLE D'ALIGNEMENT */
.grid-layout {
  display: grid;
  grid-template-columns: 140px 1fr 50px 30px;
  row-gap: 20px;
  column-gap: 15px;
  align-items: center;
  margin-top: 20px;
}

/* Col 1: Labels */
.grid-layout label {
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* Col 2: Sliders */
.slider-track {
  width: 100%;
  display: flex;
  align-items: center;
}
.slider-track input[type="range"] {
  width: 100%;
  cursor: pointer;
}

/* Col 3: Valeurs */
.value {
  text-align: right;
  font-family: monospace;
  font-size: 0.9rem;
  color: #fff;
}

/* Col 4: Reset Buttons */
.reset-btn {
  background: none;
  border: 1px solid #444;
  border-radius: 50%;
  color: #aaa;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  transition: all 0.2s;
  justify-self: end;
}

.reset-btn:hover:not(.disabled) {
  background-color: #555;
  color: #fff;
  border-color: #666;
}

.reset-btn.disabled {
  opacity: 0.2;
  cursor: default;
  border-color: transparent;
}

/* Col 2 (Font): FontPicker */
.font-picker-wrapper {
  width: 100%;
}

/* Preview Zone */
.preview-zone {
  width: 100%;
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
  overflow: hidden;
  border-radius: 12px;
  margin-top: 30px;
  border: 1px solid #333;
}
.preview-svg {
  width: 100%;
  height: auto;
  max-height: 400px;
}
</style>
