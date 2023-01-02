import "./style.css"

import setupGamePad from "./gamepad"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div>
  <h1>GamePad API</h1>
  <div id="gamepads"></div>
</div>
`

const gamepads = setupGamePad(document.querySelector<HTMLDivElement>("#gamepads")!)

gamepads
  .start()
  .events.on("gamepadConnected", controller => {
    controller.events.on("buttonDown", button => {
      console.log("buttonDown", button)
    })
  })

