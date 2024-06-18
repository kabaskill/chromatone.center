---
title: ZZFX
description:  Zuper Zmall Zound Zynth
date: 2024-06-16
layout: app
links:
  - https://github.com/KilledByAPixel/ZzFX
  - https://killedbyapixel.github.io/ZzFX/
  - https://keithclark.github.io/ZzFXM/#note-code-1
  - https://github.com/keithclark/ZzFXM
  - https://github.com/js13kGames
---

<script setup>
import { defineClientComponent } from 'vitepress'

const SynthZzfx = defineClientComponent(() => {
  return import('./SynthZzfx.vue')
})
</script>

<SynthZzfx/>


## ZzFX

### A Tiny JavaScript Sound FX System

ZzFX is a tiny sound generator designed to produce a wide variety of sound effects with minimal code overhead. It's perfect for games, prototypes, and any web application that needs sound without the bulk of traditional sound files.

https://zzfx.3d2k.com 

https://github.com/KilledByAPixel/ZzFX

### Features

- Compact: Less than 1 kilobyte when compressed!
- Versatile: 20 controllable parameters for diverse sound effects.
- No Dependencies: Standalone with no external libraries.
- Cross-Browser: Compatible with nearly all web browsers.
- Open Source: MIT licensed, use it anywhere!