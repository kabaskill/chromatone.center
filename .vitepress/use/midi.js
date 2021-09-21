import { reactive, watchEffect, onMounted } from 'vue'
import { WebMidi } from 'webmidi'
import { useStorage } from '@vueuse/core'

export const midi = reactive({
  enabled: false,
  out: true,
  inputs: {},
  outputs: {},
  playing: false,
  channels: {},
  channel: useStorage('global-midi-channel', 1),
  note: {
    pitch: 3,
    octA: 3,
  },
  filter: useStorage('global-midi-filter', {}),
})

export function useMidi() {
  onMounted(() => {
    if (WebMidi.supported) {
      setupMidi()
    }
  })

  watchEffect(() => {
    if (!midi.out) return
    let out = Object.values(WebMidi.outputs)
    if (midi.playing) {
      out.forEach((output) => {
        output.sendContinue()
      })
    } else {
      out.forEach((output) => {
        output.sendStop()
      })
    }
  })

  return {
    midi,
    midiAttack,
    midiRelease,
    midiOnce,
    setCC,
    WebMidi,
  }
}

function setupMidi() {
  WebMidi.enable()
  WebMidi.addListener('enabled', (e) => {
    midi.enabled = true
    initMidi()
  })

  let interval = setInterval(() => {
    initMidi()
  }, 3000)

  WebMidi.addListener('connected', (e) => {
    initMidi()
  })

  WebMidi.addListener('disconnected', (e) => {
    delete midi[e.port.type + 's'][e.port.id]
  })
}

function initMidi() {
  midi.inputs = {}
  WebMidi.inputs.forEach((input) => {
    midi.enabled = true
    midi.inputs[input.id] = {
      name: input.name,
      manufacturer: input.manufacturer,
    }
    input.removeListener()
    input.addListener('start', () => {
      midi.playing = true
    })
    input.addListener('stop', () => {
      midi.playing = false
    })
    input.addListener('noteon', (ev) => noteInOn(ev), {
      channels: 'all',
    })
    input.addListener('noteoff', (ev) => noteInOn(ev), { channels: 'all' })
    input.addListener('controlchange', (ev) => ccIn(ev), {
      channels: 'all',
    })
  })
  midi.outputs = {}
  WebMidi.outputs.forEach((output) => {
    midi.outputs[output.id] = {
      name: output.name,
      manufacturer: output.manufacturer,
    }
  })
}

function noteInOn(ev) {
  let note = processNote(ev)
  if (midi.filter[note.channel]) return
  midi.note = note
  createChannel(note.channel)
  midi.channels[note.channel].notes[note.name] = note
}

function ccIn(ev) {
  let cc = {
    channel: ev.target.number,
    timestamp: ev.timestamp,
    number: ev.controller.number,
    value: ev.value,
    raw: ev.rawValue,
  }
  createChannel(cc.channel)
  midi.channels[cc.channel].cc[cc.number] = cc
}

function processNote(ev) {
  let note = ev.note
  note.timestamp = ev.timestamp
  note.channel = ev.target.number
  if (ev.type == 'noteoff') {
    note.velocity = 0
  } else {
    note.velocity = 100
  }
  note.pitch = (note.number + 3) % 12
  note.octA = Math.floor((note.number + 3) / 12) - 1
  return note
}

function createChannel(ch) {
  if (!midi.channels[ch]) {
    midi.channels[ch] = { num: ch, activeNotes: {}, notes: {}, cc: {} }
  }
}

function setVelocity(channel, note, velocity) {
  if (midi.channels?.[channel]?.notes?.[note]) {
    midi.channels[channel].notes[note].velocity = velocity
  }
}

export function midiAttack(note, options) {
  if (!midi.out) return

  setVelocity(note.channel, note.name, 100)
  WebMidi.outputs.forEach((output) => {
    output.playNote(note, {
      channels: note.channel || midi.channel,
      ...options,
    })
  })
}

export function midiRelease(note) {
  if (!midi.out) return
  if (note) {
    setVelocity(note.channel, note.name, 0)
    WebMidi.outputs.forEach((output) => {
      output.stopNote(note, { channels: note.channel || midi.channel })
    })
  } else {
    WebMidi.outputs.forEach((output) => {
      output.turnNotesOff()
      output.turnSoundOff({ time: '+1' })
    })
  }
}

export function midiOnce(note, time) {
  if (!midi.out) return
  midiAttack(note, { time: `+${time}` })
  setTimeout(() => {
    midiRelease(note, { time: `+${time + 10}` })
  }, 300)
}

export function setCC(cc, value) {
  if (!midi.out) return
  WebMidi.outputs.forEach((output) => {
    output.sendControlChange(Number(cc.number), value, cc.channel)
  })
}

export function stopAll() {
  if (!midi.out) return
  midi.channels = {}
  midi.playing = false
  WebMidi.outputs.forEach((output) => {
    output.turnNotesOff()
    output.turnSoundOff({ time: '+1' })
    output.sendReset()
  })
}
