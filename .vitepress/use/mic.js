import { useRafFn } from "@vueuse/core"
import { Meter, UserMedia } from "tone"
import { useRecorder } from "./recorder"



const mic = reactive({
  initiated: false,
  open: false,
  opened: false,
  monitor: false,
  meter: 0,
})

let meter, input

export function useMic() {
  if (!mic.initiated) {
    const { recorder } = useRecorder()
    meter = new Meter()
    meter.normalRange = true
    input = new UserMedia().connect(meter)
    input.connect(recorder)
  }

  watch(() => mic.open, o => {
    if (o) {
      input.open().then(() => {
        mic.opened = true
        useRafFn(() => {
          mic.meter = meter.getValue()
        })
      })
    } else {
      input.close()
      mic.opened = false
    }
  })

  watch(() => mic.monitor, mon => {
    if (mon) {
      input.toDestination()
    } else {
      input.disconnect()
    }
  })


  return { mic, input }
}