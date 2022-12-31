import Dualsense from "./assets/dualsense.svg?raw"

const GamePadFigure = {
    "DualSense Wireless Controller Extended Gamepad": Dualsense
}

function createGamePadCard(gamepad: Gamepad): HTMLDivElement {
    const card = document.createElement("div")

    card.classList.add("card")
    if (gamepad.id in GamePadFigure) {
        const figure = document.createElement("figure")
        const caption = document.createElement("figcaption")

        caption.innerHTML = gamepad.id
        figure.innerHTML = (GamePadFigure as any)[gamepad.id]
        figure.appendChild(caption)

        card.appendChild(figure)
    }
    return card
}

function createGamepadHandler(el: HTMLDivElement) {
    const gamepads = new Map<number, Gamepad>()

    return (event: GamepadEvent, connecting: boolean) => {
        const gamepad = event.gamepad

        if (connecting) {
            gamepads.set(gamepad.index, gamepad)
        } else {
            gamepads.delete(gamepad.index)
        }

        const gamepadList = document.createElement("ul")
        gamepadList.classList.add("gamepad-list")

        for (const [, gamepad] of gamepads) {
            const gamepadItem = document.createElement("li")
            gamepadItem.appendChild(createGamePadCard(gamepad))
            gamepadList.appendChild(gamepadItem)
        }

        el.innerHTML = ""
        el.appendChild(gamepadList)
    }
}

export default function(el: HTMLDivElement): void {
    const gamepadHandler = createGamepadHandler(el)
    window.addEventListener("gamepadconnected", e => gamepadHandler(e, true))
    window.addEventListener("gamepaddisconnected", e => gamepadHandler(e, false))
}
