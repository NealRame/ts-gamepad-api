import Dualsense from "./assets/dualsense.svg?raw"

import {
    type IGamepadController,
    createGamepadManager,
} from "./gamepad"

import "./style.css"

const GamePadFigures = {
    "DualSense Wireless Controller Extended Gamepad": Dualsense,
    "DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)": Dualsense,
}

function createGameView(
    gamepad: IGamepadController,
): HTMLElement {
    const el = document.createElement("li")

    if (gamepad.id in GamePadFigures) {
        const caption = document.createElement("figcaption")
        const figure = document.createElement("figure")
        const svg = document.createElement("svg")

        figure.appendChild(svg)
        figure.appendChild(caption)

        caption.innerHTML = gamepad.id
        svg.outerHTML = (GamePadFigures as any)[gamepad.id]

        el.appendChild(figure)
    }

    const svg = el.querySelector("svg")!

    gamepad.events.on("disconnected", () => el.remove())
    gamepad.events.on("buttonDown", button => {
        const buttonId = `#button-${button.index}`
        const buttonEl = svg.querySelector(buttonId)
        if (buttonEl != null) {
            buttonEl.classList.add("active")
        }
        console.log("button down", button.index, button.value)
    })
    gamepad.events.on("buttonUp", button => {
        svg.querySelector(`#button-${button}`)?.classList.remove("active")
        console.log("button up", button)
    })
    // gamepad.events.on("axesChanged", axes => {
    //     console.log("axes changed", axes)
    // })

    return el
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div>
    <h1>GamePad API</h1>
    <ul id="gamepads"></ul>
</div>
`

const gamepadsListView = document.querySelector<HTMLUListElement>("#gamepads")!

const gamepadManager = createGamepadManager()

gamepadManager
    .start()
    .events.on("gamepadConnected", gamepad => {
        gamepadsListView.appendChild(createGameView(gamepad))
    })
