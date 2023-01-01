import Dualsense from "./assets/dualsense.svg?raw"

const GamePadFigure = {
    "DualSense Wireless Controller Extended Gamepad": Dualsense
}

function createGamePadCard(gamepad: Gamepad): HTMLDivElement {
    const card = document.createElement("div")

    card.classList.add("card")
    if (gamepad.id in GamePadFigure) {
        const caption = document.createElement("figcaption")
        const svg = document.createElement("svg")
        const figure = document.createElement("figure")

        figure.appendChild(svg)
        figure.appendChild(caption)

        caption.innerHTML = gamepad.id
        svg.outerHTML = (GamePadFigure as any)[gamepad.id]

        card.appendChild(figure)
    }
    return card
}


export default function(el: HTMLDivElement): void {
    const gamepads = new Map<number, Gamepad>()

    const refreshGamepads = () => {
        el.innerHTML = ""

        const gamepadList = document.createElement("ul")
        gamepadList.classList.add("gamepad-list")

        for (const [, gamepad] of gamepads) {
            const gamepadItem = document.createElement("li")
            gamepadItem.appendChild(createGamePadCard(gamepad))
            gamepadList.appendChild(gamepadItem)
        }

        el.appendChild(gamepadList)
    }

    const onGamepadConnected = ({ gamepad }: GamepadEvent) => {
        gamepads.set(gamepad.index, gamepad)
        refreshGamepads()
    }

    const onGamepadDisconnected = ({ gamepad }: GamepadEvent) => {
        gamepads.delete(gamepad.index)
        refreshGamepads()
    }

    // let animationFrameId = 0
    // const animationFrameCallback = () => {
    //     animationFrameId = requestAnimationFrame(animationFrameCallback)
    //     for (const [, gamepad] of gamepads) {

    //     }
    // }

    window.addEventListener("gamepadconnected", onGamepadConnected)
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected)

    // animationFrameCallback()
}
