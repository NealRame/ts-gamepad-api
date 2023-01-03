import {
    createEmitterReceiver,
    type IReceiver,
    type TEmitter,
} from "@nealrame/ts-events"

export const Axis = {
    LeftHorizontal: 0,
    LeftVertical: 1,
    RightHorizontal: 2,
    RightVertical: 3,
} as const

export type TGamepadAxes = [ number, number, number, number ]
export type TGamepadButton = { index: number, value: number }

export type TGamepadAxesEvents = {
    axesChanged: TGamepadAxes
}

export type TGamepadButtonEvents = {
    buttonDown: TGamepadButton
    buttonUp: number
}

export type TGamepadEvents = TGamepadButtonEvents & TGamepadAxesEvents & {
    disconnected: void
}

export type IGamepadController = {
    readonly id: string
    readonly index: number
    readonly events: IReceiver<TGamepadEvents>
}

export type TGamepadManagerEvents = {
    gamepadConnected: IGamepadController
}

export type IGamepadManager = {
    events: IReceiver<TGamepadManagerEvents>
    gamepad(index: number): IGamepadController | undefined
    start(): IGamepadManager
    stop(): IGamepadManager
}


function createValueComparator(precision: number = 0.001) {
    return (a: number, b: number) => Math.abs(a - b) > precision
}

function createGamepadControllerView(
    controller: IGamepadController,
): IGamepadController {
    return {
        get events() {
            return controller.events
        },
        get id() {
            return controller.id
        },
        get index() {
            return controller.index
        },
    }
}

class GamepadController implements IGamepadController {
    public events: IReceiver<TGamepadEvents>

    private emit_: TEmitter<TGamepadEvents>

    private id_: string
    private index_: number

    private axes_: TGamepadAxes
    private buttons_: Array<GamepadButton>

    private equalValues_: (a: number, b: number) => boolean

    private axesDidChanged_(axes: number[]) {
        return this.equalValues_(axes[0], this.axes_[0])
            || this.equalValues_(axes[1], this.axes_[1])
            || this.equalValues_(axes[2], this.axes_[2])
            || this.equalValues_(axes[3], this.axes_[3])
    }

    private buttonDidChanged_({ pressed, value }: GamepadButton, index: number) {
        const cachedButton = this.buttons_[index]
        if (pressed) {
            return pressed !== cachedButton.pressed
                || this.equalValues_(value, cachedButton.value)
        }
        return pressed !== cachedButton.pressed
    }

    private readAxes_({ axes }: Gamepad) {
        return Array.from(axes) as TGamepadAxes
    }

    private readButtons_({ buttons }: Gamepad) {
        return Array.from(buttons)
    }

    constructor(gamepad: Gamepad) {
        [this.emit_, this.events] = createEmitterReceiver<TGamepadEvents>()
        this.equalValues_ = createValueComparator()
        this.axes_ = this.readAxes_(gamepad)
        this.buttons_ = this.readButtons_(gamepad)
        this.id_ = gamepad.id
        this.index_ = gamepad.index
    }

    public get id() {
        return this.id_
    }

    public get index() {
        return this.index_
    }

    public refresh() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.index_]

        if (gamepad == null) return

        this.readButtons_(gamepad).forEach((button, index) => {
            if (this.buttonDidChanged_(button, index)) {
                this.buttons_[index] = button
                if (button.pressed) {
                    this.emit_("buttonDown", { index, value: button.value })
                } else {
                    this.emit_("buttonUp", index)
                }
            }
        })

        const currentAxes = this.readAxes_(gamepad)
        if (this.axesDidChanged_(currentAxes)) {
            this.axes_ = currentAxes
            this.emit_("axesChanged", currentAxes)
        }
    }

    public destroy() {
        this.id_ = ""
        this.index_ = -1
        this.emit_("disconnected")
        this.events.off()
    }
}

export function createGamepadManager(): IGamepadManager {
    const gamepads = new Map<number, GamepadController>()
    const [emit, events] = createEmitterReceiver<TGamepadManagerEvents>()

    const onGamepadConnected = ({ gamepad }: GamepadEvent) => {
        const controller = new GamepadController(gamepad)
        gamepads.set(gamepad.index, controller)
        emit("gamepadConnected", createGamepadControllerView(controller))
    }

    const onGamepadDisconnected = ({ gamepad }: GamepadEvent) => {
        const controller = gamepads.get(gamepad.index)
        if (controller != null) {
            controller.destroy()
            gamepads.delete(gamepad.index)
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
            const controller = gamepads.get(index)
            if (controller != null) {
                return createGamepadControllerView(controller)
            }
            return controller
        },
        start() {
            window.addEventListener("gamepadconnected", onGamepadConnected)
            window.addEventListener("gamepaddisconnected", onGamepadDisconnected)
            animationFrameCallback()
            return this
        },
        stop() {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener("gamepadconnected", onGamepadConnected)
            window.removeEventListener("gamepaddisconnected", onGamepadDisconnected)
            return this
        },
    }
}
