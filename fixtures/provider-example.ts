import { Provider } from "./inject"

declare namespace quux {
    interface Corge {}
}

interface Foo {}
interface Bar {
    foo: Foo
}
interface Baz {
    corge: quux.Corge
}

export class FooProvider extends Provider {
    static provide(): Foo {
        return {}
    }
}

export class BazProvider extends Provider {
    static provide(corge: quux.Corge): Baz {
        return {
            corge,
        }
    }
}

export class AsyncBarProvider extends Provider {
    static async provide(): Promise<Bar> {
        return new Promise<Bar>(resolve => {
            return {}
        })
    }
}
