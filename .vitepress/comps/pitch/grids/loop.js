import { tempo } from '@use/tempo.js'
import { globalScale, rotateArray } from '@use/theory'
import {
  Sequence,
  PanVol,
  gainToDb,
  Draw,
  PolySynth,
  context,
  start,
  Midi,
  Frequency,
  Time,
} from 'tone'
import { createAndDownloadBlobFile, midiPlay } from '@use/midi'

const loops = reactive([])

export function useLoop(order = 0) {
  const loop = reactive({
    over: useStorage(`grid-${order}-over`, 4),
    under: useStorage(`grid-${order}-under`, 4),
    probability: useStorage(`grid-${order}-probability`, 1),
    pitch: computed(() => globalScale.tonic),
    chroma: computed(() => globalScale.set.chroma),
    octave: useStorage(`grid-${order}-octave`, 3),
    volume: useStorage(`grid-${order}-vol`, 1),
    pan: useStorage(`grid-${order}-pan`, order % 2 == 1 ? -0.5 : 0.5),
    tonic: computed(() => {
      return loop.pitch + 12 * loop.octave - 3
    }),
    steps: useStorage(`grid-${order}-steps`, []),
    current: [],
    progress: computed(() => {
      if (tempo.ticks) {
        return sequence?.progress
      } else {
        return 0
      }
    }),
    clear() {
      loop.steps.forEach((step, s) => {
        loop.steps[s] = [{}]
      })
    },
    rotate(way = 1) {
      loop.steps = rotateArray(loop.steps, way)
    },
  })

  loops[order] = loop

  const panner = new PanVol(loop.pan, 0).toDestination()
  const synth = new PolySynth({
    envelope: {
      attack: 0.5,
      release: 0.2,
    },
    filterEnvelope: {
      attack: 0.1,
      release: 0.2,
    },
  }).connect(panner)

  synth.maxPolyphony = 100

  let sequence = new Sequence(
    (time, step) => {
      beatClick(step, time)
    },
    loop.steps,
    loop.under + 'n',
  ).start(0)

  watch(
    () => loop.under,
    () => {
      sequence.stop().dispose()
      sequence = new Sequence(
        (time, step) => {
          beatClick(step, time)
        },
        loop.steps,
        loop.under + 'n',
      ).start(0)
      sequence.probability = loop.probability
    },
  )

  watch(
    () => loop.over,
    () => {
      if (loop.steps.length > loop.over) {
        loop.steps.length = loop.over
      } else {
        for (let i = loop.steps.length; i < loop.over; i++) {
          loop.steps.push([{}])
        }
      }
      sequence.events = loop.steps
    },
    { immediate: true },
  )

  watchEffect(() => {
    sequence.events = loop.steps
  })

  watchEffect(() => {
    if (tempo.stopped) {
      loop.current = null
    }
  })

  watchEffect(() => {
    sequence.probability = loop.probability
    panner.volume.targetRampTo(gainToDb(loop.volume), 1)
    panner.pan.targetRampTo(loop.pan, 1)
  })

  function beatClick(step, time) {
    if (context.state == 'suspended') {
      start()
    }

    let notes = Object.entries(step)
      .map((entry) => {
        if (entry[0] == 'sub') return
        return entry[1] ? Midi(Number(entry[0]) + loop.tonic) : null
      })
      .filter(Number)

    synth.triggerAttackRelease(
      notes,
      { [loop.under + 'n']: 1 / (step.sub || 1) },
      time,
    )

    Draw.schedule(() => {
      let dur = Time({
        [loop.under + 'n']: 1 / (step.sub || 1),
      }).toMilliseconds()
      let midiNotes = notes.map((n) => n.toMidi())
      midiPlay(midiNotes, { duration: dur, attack: loop.volume })
    }, time)
  }

  onBeforeUnmount(() => {
    loops.splice(order, 1)
    sequence.stop().dispose()
    panner.dispose()
    synth.dispose()
  })

  return loop
}

import { Writer, Track, NoteEvent } from 'midi-writer-js'

export function renderMidi() {
  let render = []
  loops.forEach((loop, l) => {
    let division = 512 / loop.under
    let midiTrack = new Track()
    midiTrack.setTempo(tempo.bpm)
    midiTrack.addInstrumentName('piano')
    midiTrack.addTrackName('Chromatone grid ' + l)
    midiTrack.setTimeSignature(4, 4)
    loop?.steps.forEach((step, s) => {
      step.forEach((code, c) => {
        let sub = c
        let beat = s
        let subdivision = division / step.length
        let notes = Object.entries(code)
          .map((entry) =>
            entry[1] == true ? Number(entry[0]) + loop.tonic : null,
          )
          .filter((n) => Number(n))
          .map((midi) => Frequency(midi, 'midi').toNote())
        midiTrack.addEvent(
          new NoteEvent({
            pitch: notes,
            duration: `T${subdivision}`,
            startTick: division * beat + sub * subdivision,
            velocity: loop.volume * 100,
          }),
        )
      })
    })
    // --- LOOP HACK ---
    // midiTrack.addEvent(
    //   new NoteEvent({
    //     pitch: 0,
    //     duration: `T1`,
    //     startTick: division * (track.steps.length - 1),
    //     velocity: 1,
    //   })
    // )
    render[l] = midiTrack
  })

  var write = new Writer(render)

  createAndDownloadBlobFile(write.buildFile(), 'Chromatone-grid')
}