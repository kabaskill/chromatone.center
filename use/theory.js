/**
 * @module MusicTheory
 */


export const intervals = ['1P', '2m', '2M', '3m', '3M', '4P', 'TT', '5P', '6m', '6M', '7m', '7M']

export const naturals = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

export const sharps = ['G##', 'A#', 'A##', 'B#', 'C#', 'C##', 'D#', 'D##', 'E#', 'F#', 'F##', 'G#']

export const flats = ['Bbb', 'Bb', 'Cb', 'Dbb', 'Db', 'Ebb', 'Eb', 'Fb', 'Gbb', 'Gb', 'Abb', 'Ab']

export const noteNames = []

naturals.forEach((note, n) => {
  noteNames[note] = n
})
sharps.forEach((note, n) => {
  noteNames[note] = n
})
flats.forEach((note, n) => {
  noteNames[note] = n
})

export const notes = naturals

// import ChordChoice from '../db/chord/choice.yaml'
// import ScaleChoice from '../db/scale/choice.yaml'

// export const chords = ChordChoice
// export const scales = ScaleChoice

// import scaleNames from '../db/scale/scale-names.yaml'

// for (let s in scaleNames) {
//   const scale = scaleNames[s]
//   const intervals = Pcset.intervals(scale.chroma)
//   ScaleType.add(intervals, scale.title, Object.values(scale.names).flat())
// }

// import { ChordType } from 'tonal'

// import intervalList from '../db/chord/intervals.yaml'

// for (let int in intervalList) {
//   ChordType.add(...intervalList[int], int)
// }
