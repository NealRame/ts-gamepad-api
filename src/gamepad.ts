function createGamepadHandler(el: HTMLDivElement) {
    const gamepads = {}

    return (event: GamepadEvent, connecting: boolean) => {
        const gamepad = event.gamepad
        if (connecting) {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                gamepad.index,
                gamepad.id,
                gamepad.buttons.length,
                gamepad.axes.length
            )
            ;(gamepads as any)[gamepad.index] = gamepad
        } else {
            console.log("Gamepad disconnected from index %d: %s",
                gamepad.index,
                gamepad.id
            )
            delete (gamepads as any)[gamepad.index]
        }

        const gamepadList = document.createElement("ul")
        for (const [index, gamepad] of Object.entries(gamepads) as Array<[string, Gamepad]>) {
            const gamepadItem = document.createElement("li")
            gamepadItem.innerHTML = `
            <div class="card">
                <h2>${Number(index) + 1}: ${gamepad.id}</h2>
                <div class="card-content">
                </div>
            </div>
            `
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
