import Dualsense from "./assets/dualsense.svg?raw"

import {
    IReceiver,
    createEmitterReceiver
} from "@nealrame/ts-events"

const GamePadFigure = {
    "DualSense Wireless Controller Extended Gamepad": Dualsense,
    "DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)": Dualsense,
}

const AxisEvents = [
    "leftHorizontalAxisChanged",
    "leftVerticalAxisChanged",
    "rightHorizontalAxisChanged",
    "rightVerticalAxisChanged",
] as const

type TGamePadButtonEvents = {
    buttonDown: number
    buttonUp: number
}

type TGamePadAxisEvents = {
    [key in typeof AxisEvents[number]]: number
}

type TGamePadEvent = TGamePadButtonEvents & TGamePadAxisEvents

type IGamePadController = {
    refresh(): void
    destroy(): void
    events: IReceiver<TGamePadEvent>
}

type TGamePadControllerEvents = {
    gamepadConnected: IGamePadController
    gamepadDisconnected: IGamePadController
}

function createGamepadController(
    gamepadId: string,
    gamepadIndex: number,
    parentEl: HTMLElement,
): IGamePadController {
    const el = document.createElement("li")
    const svg = document.createElement("svg")

    const [emit, events] = createEmitterReceiver<TGamePadEvent>()

    const state = {
        buttons: [] as Array<boolean>,
        axes: [] as Array<number>,
    }

    const refresh = () => {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[gamepadIndex]

        if (gamepad == null) return

        gamepad.buttons.forEach((button, index) => {
            if (button.pressed !== state.buttons[index]) {
                emit(button.pressed ? "buttonDown" : "buttonUp", index)
            }
        })

        gamepad.axes.forEach((value, index) => {
            if (value !== state.axes[index]) {
                emit(AxisEvents[index], value)
            }
        })

        state.buttons = gamepad.buttons.map(button => button.pressed)
        state.axes = Array.from(gamepad.axes)
    }

    const destroy = () => {
        events.off()
        el.remove()
    }

    el.classList.add("card")
    if (gamepadId in GamePadFigure) {
        const caption = document.createElement("figcaption")
        const figure = document.createElement("figure")

        figure.appendChild(svg)
        figure.appendChild(caption)

        caption.innerHTML = gamepadId
        svg.outerHTML = (GamePadFigure as any)[gamepadId]

        el.appendChild(figure)
    }

    parentEl.appendChild(el)

    return {
        refresh,
        destroy,
        events,
        
    }
}

export default function(el: HTMLDivElement) {
    const gamepads = new Map<number, IGamePadController>()
    const gamepadListView = document.createElement("ul")

    const [emit, events] = createEmitterReceiver<TGamePadControllerEvents>()

    gamepadListView.classList.add("gamepad-list")
    el.appendChild(gamepadListView)

    const onGamepadConnected = ({ gamepad }: GamepadEvent) => {
        const controller = createGamepadController(
            gamepad.id,
            gamepad.index,
            gamepadListView
        )
        gamepads.set(gamepad.index, controller)
        emit("gamepadConnected", controller)
    }

    const onGamepadDisconnected = ({ gamepad }: GamepadEvent) => {
        const controller = gamepads.get(gamepad.index)
        if (controller != null) {
            controller.destroy()
            gamepads.delete(gamepad.index)
            emit("gamepadDisconnected", controller)
        }
    }

    let animationFrameId = 0
    const animationFrameCallback = () => {
        for (const [, gamepad] of gamepads) {
            gamepad.refresh()
        }
        animationFrameId = requestAnimationFrame(animationFrameCallback)
    }

    return {
        events,
        gamepad(index: number) {
            return gamepads.get(index)
        },
        start() {
            window.addEventListener("gamepadconnected", onGamepadConnected)
            animationFrameCallback()
            return this
        },
        stop() {
            window.addEventListener("gamepaddisconnected", onGamepadDisconnected)
            cancelAnimationFrame(animationFrameId)
            return this
        },
    }
}
