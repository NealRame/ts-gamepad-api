import {
    createEmitterReceiver,
    type IReceiver,
    type TEmitter,
} from "@nealrame/ts-events"

export const GamepadAxis = {
    LeftHorizontal: 0,
    LeftVertical: 1,
    RightHorizontal: 2,
    RightVertical: 3,
} as const

export type TGamepadAxis = typeof GamepadAxis[keyof typeof GamepadAxis]
export type TGamepadAxes = [ number, number, number, number ]

export type TGamepadButton = {
    pressed: boolean
    value: number
}

export type TGamepadEvents = {
    buttonDown: number
    buttonUp: number
    disconnected: void
}

export type IGamepadController = {
    readonly axes: TGamepadAxes
    readonly buttons: Array<TGamepadButton>
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
    refresh(): IGamepadManager
    start(): IGamepadManager
    stop(): IGamepadManager
}

export type TGamepadManagerOptions = {
    multiple?: boolean
}

export type TGameControllerConfig = Required<TGamepadManagerOptions>

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
        get axes() {
            return controller.axes
        },
        get buttons() {
            return controller.buttons
        },
    }
}

class GamepadController implements IGamepadController {
    public events: IReceiver<TGamepadEvents>
    
    private emit_: TEmitter<TGamepadEvents>

    private id_: string
    private index_: number

    private config_: TGameControllerConfig
    private axes_: TGamepadAxes
    private buttons_: Array<TGamepadButton>

    private readAxes_({ axes }: Gamepad) {
        return Array.from(axes) as TGamepadAxes
    }

    private readButtons_({ buttons }: Gamepad) {
        return buttons.map(({ pressed, value }) => ({ pressed, value }))
    }

    constructor(
        gamepad: Gamepad,
        config: TGameControllerConfig,
    ) {
        this.config_ = config
        this.id_ = gamepad.id
        this.index_ = gamepad.index
        this.axes_ = this.readAxes_(gamepad)
        this.buttons_ = this.readButtons_(gamepad)
        ;[this.emit_, this.events] = createEmitterReceiver<TGamepadEvents>()
    }

    public get id() {
        return this.id_
    }

    public get index() {
        return this.index_
    }

    public get axes() {
        return this.axes_.slice() as TGamepadAxes
    }

    public get buttons() {
        return this.buttons_.slice() as Array<TGamepadButton>
    }

    public refresh() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.index_]

        if (gamepad == null) return

        const lastButtons = this.buttons_

        this.axes_ = this.readAxes_(gamepad)

        this.buttons_ = this.readButtons_(gamepad)
        this.buttons_.forEach((button, index) => {
            if (button.pressed) {
                if (this.config_.multiple || !lastButtons[index].pressed) {
                    this.emit_("buttonDown", index)
                }
            } else if (lastButtons[index].pressed) {
                this.emit_("buttonUp", index)
            }
        })
    }

    public destroy() {
        this.id_ = ""
        this.index_ = -1
        this.emit_("disconnected")
        this.events.off()
    }
}

export function createGamepadManager(options: TGamepadManagerOptions = {}): IGamepadManager {
    const controllerConfig = Object.assign({
        multiple: false,
    }, options) as TGameControllerConfig

    const gamepads = new Map<number, GamepadController>()
    const [emit, events] = createEmitterReceiver<TGamepadManagerEvents>()

    const onGamepadConnected = ({ gamepad }: GamepadEvent) => {
        const controller = new GamepadController(gamepad, controllerConfig)
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

    return {
        events,
        gamepad(index: number) {
            const controller = gamepads.get(index)
            if (controller != null) {
                return createGamepadControllerView(controller)
            }
            return controller
        },
        refresh() {
            for (const [, gamepad] of gamepads) {
                gamepad.refresh()
            }
            return this
        },
        start() {
            window.addEventListener("gamepadconnected", onGamepadConnected)
            window.addEventListener("gamepaddisconnected", onGamepadDisconnected)
            return this
        },
        stop() {
            window.removeEventListener("gamepadconnected", onGamepadConnected)
            window.removeEventListener("gamepaddisconnected", onGamepadDisconnected)
            return this
        },
    }
}
