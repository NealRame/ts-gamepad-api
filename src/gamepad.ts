import {
    createEmitterReceiver,
    type IReceiver,
    type TEmitter,
} from "@nealrame/ts-events"

export type TGamepadAxis = readonly number[]
export type TGamepadButtons = readonly GamepadButton[]

export type TGamepadEvents = {
    buttonDown: number
    buttonUp: number
    disconnected: void
}

export type IGamepadController = {
    readonly axes: TGamepadAxis | null
    readonly buttons: TGamepadButtons | null
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
    private buttonsState_: Array<boolean>

    private readAxes_(gamepad: Gamepad | null | undefined) {
        return gamepad?.axes ?? null
    }

    private readButtons_(gamepad: Gamepad | null | undefined) {
        return gamepad?.buttons ?? null
    }

    private updateButtonsState_(gamepad: Gamepad | null | undefined) {
        (gamepad?.buttons ?? []).forEach((button, index) => {
            this.buttonsState_[index] = button.pressed
        })
    }

    constructor(
        gamepad: Gamepad,
        config: TGameControllerConfig,
    ) {
        this.config_ = config
        this.id_ = gamepad.id
        this.index_ = gamepad.index
        this.buttonsState_ = []
        ;[this.emit_, this.events] = createEmitterReceiver<TGamepadEvents>()
    }

    public get id() {
        return this.id_
    }

    public get index() {
        return this.index_
    }

    public get axes() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.index_]
        return this.readAxes_(gamepad)
    }

    public get buttons() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.index_]
        return this.readButtons_(gamepad)
    }

    public refresh() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.index_]

        ;(this.readButtons_(gamepad) ?? []).forEach((button, index) => {
            if (button.pressed) {
                if (this.config_.multiple || !this.buttonsState_[index]) {
                    this.emit_("buttonDown", index)
                }
            } else if (this.buttonsState_[index]) {
                this.emit_("buttonUp", index)
            }
        })
        ;this.updateButtonsState_(gamepad)
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
