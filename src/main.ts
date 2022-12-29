import "./style.css"
import setupGamePad from "./gamepad"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div>
  <h1>GamePad API</h1>
  <div id="gamepads"></div>
</div>
`

setupGamePad(document.querySelector<HTMLDivElement>("#gamepads")!)
